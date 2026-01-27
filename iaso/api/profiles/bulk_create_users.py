import csv
import io

import pandas as pd
import phonenumbers

from django.contrib.auth.models import Group, Permission, User
from django.contrib.auth.password_validation import validate_password
from django.core import validators
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db import transaction
from django.http import FileResponse
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from hat.audit.models import PROFILE_API_BULK
from iaso.api.profiles.audit import ProfileAuditLogger
from iaso.models import BulkCreateUserCsvFile, OrgUnit, OrgUnitType, Profile, Project, Team, UserRole
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION


BULK_CREATE_USER_COLUMNS_LIST = [
    "username",
    "password",
    "email",
    "first_name",
    "last_name",
    "orgunit",
    "orgunit__source_ref",
    "profile_language",
    "dhis2_id",
    "organization",
    "permissions",
    "user_roles",
    "projects",
    "teams",
    "phone_number",
    "editable_org_unit_types",
]


class BulkCreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkCreateUserCsvFile
        fields = ["file"]
        read_only_fields = ["created_by", "created_at", "account"]


class HasUserPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()) or request.user.has_perm(
            CORE_USERS_MANAGED_PERMISSION.full_name()
        ):
            return True
        return False


class BulkCreateUserFromCsvViewSet(ModelViewSet):
    """Api endpoint to bulkcreate users and profiles from a CSV File.

    Mandatory columns are : ["username", "password", "email", "first_name", "last_name", "orgunit", "profile_language", "dhis2_id", "projects", "permissions", "user_roles", "projects"]

    Email, dhis2_id, permissions, profile_language and org_unit are not mandatory, but you must keep the columns.

    Sample csv input:

    username,password,email,first_name,last_name,orgunit,profile_language,permissions,dhis2_id,user_role,projects

    john,j0hnDoei5f@mous#,johndoe@bluesquarehub.com,John,D.,KINSHASA,fr,"iaso_submissions, iaso_forms",Enc73jC3, manager, "oms, RDC"

    You can add multiples permissions for the same user : "iaso_submissions, iaso_forms"
    You can add multiples org_units for the same user by ID or Name : "28334, Bas Uele, 9999"

    It's a better practice and less error-prone to use org_units IDs instead of names.


    The permissions are :

    "iaso_forms",

    "iaso_submissions",

    "iaso_mappings",

    "iaso_completeness",

    "iaso_org_units",

    "iaso_links",

    "iaso_users",

    "iaso_projects",

    "iaso_sources",

    "iaso_data_tasks",
    """

    result_key = "file"
    remove_results_key_if_paginated = True
    permission_classes = [HasUserPermission]

    def get_serializer_class(self):
        return BulkCreateUserSerializer

    def get_queryset(self):
        queryset = BulkCreateUserCsvFile.objects.none()

        return queryset

    @staticmethod
    def has_only_user_managed_permission(user):
        if not user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()) and user.has_perm(
            CORE_USERS_MANAGED_PERMISSION.full_name()
        ):
            return True
        return False

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create users from CSV file. All validation happens in this step.

        After users are created successfully, use bulk_update() to apply configuration.
        """
        if not request.FILES.get("file"):
            raise serializers.ValidationError({"error": "No CSV file provided"})

        importer_user = request.user
        importer_account = importer_user.iaso_profile.account

        parsed_data = self._parse_csv_file(request.FILES["file"])

        csv_file_instance = BulkCreateUserCsvFile.objects.create(
            file=request.FILES["file"], created_by=importer_user, account=importer_account
        )

        validation_errors, validation_context = self._pre_validate_users(
            parsed_data, importer_user, importer_account
        )
        if validation_errors:
            return Response({"validation_errors": validation_errors}, status=400)

        user_created_count = self._bulk_create_users_and_profiles(
            parsed_data,
            importer_user,
            importer_account,
            csv_file_instance,
            validation_context=validation_context,
        )

        response = {
            "users_created": user_created_count,
            "csv_file_id": csv_file_instance.id,
        }
        return Response(response)

    def _parse_csv_file(self, csv_file):
        """Parse CSV file and return structured data."""
        try:
            user_csv_decoded = csv_file.read().decode("utf-8")
            csv_str = io.StringIO(user_csv_decoded)
            delimiter = ";" if ";" in user_csv_decoded else ","
            reader = csv.reader(csv_str, delimiter=delimiter)

            if delimiter == ";":
                new_reader = []
                for row in reader:
                    new_row = [cell.replace(",", "*") for cell in row]
                    new_reader.append(new_row)
                reader = new_reader

            pd.read_csv(io.BytesIO(csv_str.getvalue().encode()), delimiter=delimiter)
        except UnicodeDecodeError as e:
            raise serializers.ValidationError({"error": f"Invalid file encoding: {e}"})
        except pd.errors.ParserError as e:
            raise serializers.ValidationError({"error": f"Invalid CSV file: {e}"})
        except Exception as e:
            raise serializers.ValidationError({"error": f"Failed to parse CSV: {e}"})

        parsed_rows = []
        headers = None
        value_splitter = "," if delimiter == "," else "*"

        # Fields that contain multiple values separated by delimiter
        multi_value_fields = [
            "orgunit",
            "orgunit__source_ref",
            "projects",
            "user_roles",
            "permissions",
            "editable_org_unit_types",
        ]

        for i, row in enumerate(reader):
            if i == 0:
                headers = row
                # Validate required columns exist
                missing_columns = set(BULK_CREATE_USER_COLUMNS_LIST) - set(headers)
                if missing_columns:
                    raise serializers.ValidationError(
                        {
                            "error": f"Something is wrong with your CSV File. Possibly missing {missing_columns} column(s)."
                        }
                    )
            else:
                row_data = dict(zip(headers, row))
                row_data["_row_number"] = i  # Data row numbering starts at 1 (ignoring header)

                for field in multi_value_fields:
                    if field in row_data and row_data[field]:
                        row_data[field] = [v.strip() for v in row_data[field].split(value_splitter) if v.strip()]
                    else:
                        row_data[field] = []

                parsed_rows.append(row_data)

        return parsed_rows

    def _pre_validate_users(self, user_data, importer_user, importer_account):
        """Validate all users and cache resolved objects for creation phase."""
        validation_errors = []

        # Cache for resolved objects - key: row_index, value: resolved objects
        validation_context = {
            "permissions_by_row": {},  # {row_idx: [Permission objects]}
            "projects_by_row": {},  # {row_idx: [Project objects]}
            "user_roles_by_row": {},  # {row_idx: [UserRole objects]}
        }

        # Collect all unique values for batch validation
        usernames = [data.get("username") for data in user_data if data.get("username")]
        emails = [data.get("email") for data in user_data if data.get("email")]
        dhis2_ids = [data.get("dhis2_id") for data in user_data if data.get("dhis2_id")]

        existing_usernames = set(User.objects.filter(username__in=usernames).values_list("username", flat=True))
        existing_emails = set(User.objects.filter(email__in=emails).values_list("email", flat=True))
        existing_dhis2_ids = set(Profile.objects.filter(dhis2_id__in=dhis2_ids).values_list("dhis2_id", flat=True))

        has_geo_limit = self.has_only_user_managed_permission(importer_user)

        for i, data in enumerate(user_data):
            row_errors = {}
            row_num = data.get("_row_number", "unknown")

            username = data.get("username", "").strip()
            if not username:
                row_errors["username"] = "Username is required"
            elif username in existing_usernames:
                row_errors["username"] = f"Username '{username}' already exists"

            email = data.get("email", "").strip() if data.get("email") else None
            if email:
                if email in existing_emails:
                    row_errors["email"] = f"Email '{email}' already exists"
                try:
                    validators.validate_email(email)
                except ValidationError:
                    row_errors["email"] = f"Invalid email format: '{email}'"

            # DHIS2 ID validation
            dhis2_id = data.get("dhis2_id", "").strip() if data.get("dhis2_id") else None
            if dhis2_id and dhis2_id in existing_dhis2_ids:
                row_errors["dhis2_id"] = f"DHIS2 ID '{dhis2_id}' already exists"

            # Password vs email invitation validation
            # Auto-detect email invitation: no password + has email = send invitation
            password = data.get("password", "").strip() if data.get("password") else None

            if not password and email:
                # Email invitation mode - no validation needed
                pass
            elif password:
                # Password mode - validate password strength
                try:
                    temp_user = User(username=username)
                    validate_password(password, temp_user)
                except ValidationError as e:
                    row_errors["password"] = f"Invalid password: {'; '.join(e.messages)}"
            else:
                # Error: need either password or email
                row_errors["password"] = "Either password or email required for user creation"

            # OrgUnit validation
            org_unit_list = data.get("orgunit", [])
            org_unit_field = org_unit_list[0] if org_unit_list else ""
            if has_geo_limit and not org_unit_field:
                row_errors["orgunit"] = (
                    f"A User with {CORE_USERS_MANAGED_PERMISSION.full_name()} permission "
                    "must create users with OrgUnits"
                )

            # Permissions validation WITH caching
            permission_names = data.get("permissions", [])
            if permission_names:
                module_permissions = [perm.codename for perm in importer_account.permissions_from_active_modules]
                invalid_permissions = [pn for pn in permission_names if pn not in module_permissions]
                if invalid_permissions:
                    row_errors["permissions"] = f"Invalid permissions: {', '.join(invalid_permissions)}"
                else:
                    # Cache valid Permission objects for creation phase
                    valid_permissions = Permission.objects.filter(
                        codename__in=[pn for pn in permission_names if pn in module_permissions]
                    )
                    validation_context["permissions_by_row"][i] = list(valid_permissions)

            # User Roles validation WITH caching
            role_names = data.get("user_roles", [])
            if role_names:
                existing_roles = UserRole.objects.filter(
                    account=importer_account,
                    group__name__in=[f"{importer_account.id}_{role}" for role in role_names],
                )
                existing_role_names = set(existing_roles.values_list("group__name", flat=True))
                invalid_roles = [
                    role for role in role_names if f"{importer_account.id}_{role}" not in existing_role_names
                ]
                if invalid_roles:
                    row_errors["user_roles"] = f"Invalid user roles: {', '.join(invalid_roles)}"
                else:
                    # Cache valid UserRole objects for creation phase
                    validation_context["user_roles_by_row"][i] = list(existing_roles)

            # Projects validation WITH caching
            project_names = data.get("projects", [])
            if project_names:
                # NOT sure if it's entirely necessary, I think user without profile have same permission as admin
                user_has_project_restrictions = hasattr(importer_user, "iaso_profile") and bool(
                    importer_user.iaso_profile.projects_ids
                )

                if user_has_project_restrictions and self.has_only_user_managed_permission(importer_user):
                    available_projects = Project.objects.filter(
                        name__in=project_names, account=importer_account
                    ).filter_on_user_projects(importer_user)
                else:
                    available_projects = Project.objects.filter(name__in=project_names, account=importer_account)

                valid_project_names = set(available_projects.values_list("name", flat=True))
                invalid_projects = [pn for pn in project_names if pn not in valid_project_names]
                if invalid_projects:
                    row_errors["projects"] = f"Invalid projects: {', '.join(invalid_projects)}"
                else:
                    # Cache valid Project objects for creation phase
                    validation_context["projects_by_row"][i] = list(available_projects)

            if row_errors:
                validation_errors.append({"row": row_num, "errors": row_errors})

        return validation_errors, validation_context

    def _bulk_create_users_and_profiles(
        self, user_data, importer_user, importer_account, csv_file_instance, validation_context
    ):
        """Create users and profiles using bulk operations and cached validation context."""
        audit_logger = ProfileAuditLogger()

        # Phase 1: Prepare User objects for bulk_create
        users_to_create = []
        user_data_map = {}

        for i, data in enumerate(user_data):
            user = User(
                username=data.get("username", "").strip(),
                first_name=data.get("first_name", "").strip(),
                last_name=data.get("last_name", "").strip(),
                email=data.get("email", "").strip(),
                is_active=True,
            )

            password = data.get("password", "").strip()
            email = data.get("email", "").strip() if data.get("email") else None
            # Auto-detect email invitation: no password + has email = send invitation
            send_invitation = not password and bool(email)

            if send_invitation:
                user.set_unusable_password()
            elif password:
                user.set_password(password)

            users_to_create.append(user)
            user_data_map[i] = data

        created_users = User.objects.bulk_create(users_to_create)

        # Phase 2: Prepare Profile objects for bulk_create
        profiles_to_create = []

        for i, user in enumerate(created_users):
            data = user_data_map[i]
            profile = Profile(
                user=user,
                account=importer_account,
                language=data.get("profile_language", "fr").lower() or "fr",
                dhis2_id=data.get("dhis2_id", "").strip() or None,
                organization=data.get("organization", "").strip() or None,
                phone_number=self._validate_and_format_phone(data.get("phone_number")),
            )
            profiles_to_create.append(profile)

        created_profiles = Profile.objects.bulk_create(profiles_to_create)

        # Phase 3: Handle ManyToMany relationships with bulk operations (using cached validation context)
        self._bulk_set_many_to_many_relationships(
            created_profiles, user_data_map, importer_user, importer_account, validation_context
        )

        # Phase 4: Handle editable org unit types
        self._bulk_set_editable_org_unit_types(created_profiles, user_data_map, importer_account)

        # Phase 5: Send email invitations if no password + has email
        invitation_users = [
            created_users[i]
            for i, data in enumerate(user_data_map.values())
            if not data.get("password", "").strip() and data.get("email", "").strip()
        ]
        if invitation_users:
            self._send_bulk_email_invitations(invitation_users)

        # Phase 6: Save passwords to CSV and log audit
        self._save_csv_and_audit(csv_file_instance, user_data, created_profiles, audit_logger, importer_user)

        return len(created_users)

    def _bulk_set_many_to_many_relationships(
        self, profiles, user_data_map, importer_user, importer_account, validation_context
    ):
        """Set ManyToMany relationships using bulk operations and cached validated objects."""
        importer_access_ou = OrgUnit.objects.filter_for_user_and_app_id(importer_user).only("id")

        # Collect all bulk relationship operations
        profile_org_units_list = []
        profile_projects_list = []
        profile_user_roles_list = []
        user_groups_list = []
        user_permissions_list = []

        for i, profile in enumerate(profiles):
            data = user_data_map[i]

            org_unit_refs = data.get("orgunit", [])
            org_unit_source_refs = data.get("orgunit__source_ref", [])

            org_units_to_add = []
            for ou_ref in org_unit_refs:
                if ou_ref.isdigit():
                    try:
                        ou = OrgUnit.objects.get(id=int(ou_ref))
                        if ou in importer_access_ou:
                            org_units_to_add.append(ou)
                    except OrgUnit.DoesNotExist:
                        pass
                else:
                    ou = (
                        OrgUnit.objects.filter(
                            pk__in=importer_access_ou,
                            version_id=importer_account.default_version_id,
                            name=ou_ref,
                        )
                        .order_by("-version_id")
                        .first()
                    )
                    if ou:
                        org_units_to_add.append(ou)

            for ou_ref in org_unit_source_refs:
                ou = OrgUnit.objects.filter(
                    pk__in=importer_access_ou,
                    version_id=importer_account.default_version_id,
                    source_ref=ou_ref,
                ).first()
                if ou and ou not in org_units_to_add:
                    org_units_to_add.append(ou)

            for ou in org_units_to_add:
                profile_org_units_list.append(Profile.org_units.through(profile=profile, orgunit=ou))

            cached_projects = validation_context["projects_by_row"].get(i, [])
            for project in cached_projects:
                profile_projects_list.append(Profile.projects.through(profile=profile, project=project))

            cached_roles = validation_context["user_roles_by_row"].get(i, [])
            for role in cached_roles:
                profile_user_roles_list.append(Profile.user_roles.through(profile=profile, userrole=role))
                user_groups_list.append(User.groups.through(user=profile.user, group=role.group))

            cached_permissions = validation_context["permissions_by_row"].get(i, [])
            for permission in cached_permissions:
                user_permissions_list.append(User.user_permissions.through(user=profile.user, permission=permission))

        # Bulk create all relationships
        if profile_org_units_list:
            Profile.org_units.through.objects.bulk_create(profile_org_units_list, ignore_conflicts=True)

        if profile_projects_list:
            Profile.projects.through.objects.bulk_create(profile_projects_list, ignore_conflicts=True)

        if profile_user_roles_list:
            Profile.user_roles.through.objects.bulk_create(profile_user_roles_list, ignore_conflicts=True)

        if user_groups_list:
            User.groups.through.objects.bulk_create(user_groups_list, ignore_conflicts=True)

        if user_permissions_list:
            User.user_permissions.through.objects.bulk_create(user_permissions_list, ignore_conflicts=True)

    def _bulk_set_editable_org_unit_types(self, profiles, user_data_map, importer_account):
        """Set editable org unit types for profiles."""
        profile_org_unit_types_list = []

        for i, profile in enumerate(profiles):
            data = user_data_map[i]
            ou_type_ids = data.get("editable_org_unit_types", [])

            if ou_type_ids:
                new_editable_org_unit_types = OrgUnitType.objects.filter(
                    projects__account=importer_account, id__in=ou_type_ids
                )

                for ou_type in new_editable_org_unit_types:
                    profile_org_unit_types_list.append(
                        Profile.editable_org_unit_types.through(profile=profile, orgunittype=ou_type)
                    )

        if profile_org_unit_types_list:
            Profile.editable_org_unit_types.through.objects.bulk_create(
                profile_org_unit_types_list, ignore_conflicts=True
            )

    def _send_bulk_email_invitations(self, users):
        """Send email invitations to users without passwords."""
        # TODO: Integrate with existing email invitation system

    def _save_csv_and_audit(self, csv_file_instance, user_data, created_profiles, audit_logger, importer_user):
        """Save CSV with password redacted and log audit trail."""
        try:
            csv_file_instance.file.seek(0)
            user_csv_decoded = csv_file_instance.file.read().decode("utf-8")
            csv_str = io.StringIO(user_csv_decoded)
            delimiter = ";" if ";" in user_csv_decoded else ","

            csv_file = pd.read_csv(csv_str, delimiter=delimiter)

            if "password" in csv_file.columns:
                csv_file["password"] = None
            csv_content = csv_file.to_csv(path_or_buf=None, index=False)

            content_file = ContentFile(csv_content.encode("utf-8"))
            csv_file_instance.file.save(f"{csv_file_instance.id}.csv", content_file)
        except Exception:
            pass

        for profile in created_profiles:
            audit_logger.log_modification(
                instance=profile,
                old_data_dump=None,
                request_user=importer_user,
                source=f"{PROFILE_API_BULK}_create",
            )

    def _validate_and_format_phone(self, phone_number):
        """Validate and format phone number or return None."""
        if not phone_number or not phone_number.strip():
            return ""
        try:
            return self.validate_phone_number(phone_number)
        except serializers.ValidationError:
            return ""

    @staticmethod
    def validate_phone_number(phone_number):
        try:
            # Parse phone number
            parsed_number = phonenumbers.parse(phone_number, None)
            # Check if the number is valid
            if not phonenumbers.is_valid_number(parsed_number):
                raise serializers.ValidationError(
                    {"error": f"Operation aborted. The phone number {phone_number} is invalid"}
                )

            return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException as e:
            raise serializers.ValidationError(
                {"error": f"Operation aborted. This '{phone_number}' is not a phone number"}
            )

    @swagger_auto_schema()
    @action(detail=False, methods=["POST"], url_path="apply_configuration")
    @transaction.atomic
    def apply_configuration(self, request, *args, **kwargs):
        """Apply bulk configuration to users created by a CSV file."""
        csv_file_id = request.data.get("csv_file_id")
        bulk_configuration = request.data.get("bulk_configuration", {})

        if not csv_file_id:
            raise serializers.ValidationError({"error": "csv_file_id is required"})

        importer_account = request.user.iaso_profile.account

        try:
            csv_file = BulkCreateUserCsvFile.objects.get(id=csv_file_id, created_by=request.user)
        except BulkCreateUserCsvFile.DoesNotExist:
            raise serializers.ValidationError({"error": f"CSV file {csv_file_id} not found"})

        # Get all users created by this CSV file
        users = User.objects.filter(iaso_profile__bulk_create_csv_file=csv_file).prefetch_related(
            "user_permissions", "groups", "iaso_profile__projects"
        )

        if not users.exists():
            return Response({"message": "No users found for this CSV file", "users_updated": 0}, status=200)

        # Apply bulk updates
        users_updated = self._apply_configuration_to_users(users, bulk_configuration, importer_account)

        return Response(
            {"message": f"Successfully updated {users_updated} users", "users_updated": users_updated},
            status=200,
        )

    def _apply_configuration_to_users(self, users, bulk_configuration, importer_account):
        """Apply bulk configuration to existing users. """
        if not bulk_configuration:
            return 0

        profiles_to_update = []
        users_list = list(users)

        for user in users_list:
            profile = user.iaso_profile

            if bulk_configuration.get("profile_language"):
                profile.language = bulk_configuration["profile_language"]

            if bulk_configuration.get("organization"):
                profile.organization = bulk_configuration["organization"]

            profiles_to_update.append(profile)

        if profiles_to_update:
            Profile.objects.bulk_update(
                profiles_to_update,
                fields=["language", "organization"],
                batch_size=1000,
            )

        if bulk_configuration.get("permissions"):
            permission_names = bulk_configuration["permissions"]
            permissions_to_add = Permission.objects.filter(codename__in=permission_names)

            for user in users_list:
                user.user_permissions.set(permissions_to_add)

        if bulk_configuration.get("projects"):
            project_names = bulk_configuration["projects"]
            projects = Project.objects.filter(name__in=project_names, account=importer_account)

            for user in users_list:
                user.iaso_profile.projects.set(projects)

        if bulk_configuration.get("user_roles"):
            role_names = bulk_configuration["user_roles"]
            groups = Group.objects.filter(name__in=role_names)

            for user in users_list:
                user.groups.set(groups)

        if bulk_configuration.get("send_email_invitation"):
            self._send_bulk_email_invitations(users_list)

        return len(users_list)

    @swagger_auto_schema(request_body=no_body)
    @action(detail=False, methods=["get"], url_path="getsample")
    def download_sample_csv(self, request):
        return FileResponse(open("iaso/api/fixtures/sample_bulk_user_creation.csv", "rb"))
