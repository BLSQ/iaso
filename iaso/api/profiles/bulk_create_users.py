import csv
import io
import logging

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
from iaso.tasks.bulk_create_users_email import send_bulk_email_invitations


logger = logging.getLogger(__name__)


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

        csv_data = self._parse_csv_file(request.FILES["file"])

        csv_file_instance = BulkCreateUserCsvFile.objects.create(
            file=request.FILES["file"], created_by=importer_user, account=importer_account
        )

        validation_errors, validation_context = self._pre_validate_users(csv_data, importer_user, importer_account)
        if validation_errors:
            return Response({"validation_errors": validation_errors}, status=400)

        user_created_count = self._bulk_create_users_and_profiles(
            csv_data,
            importer_user,
            importer_account,
            csv_file_instance,
            validation_context,
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

    def _resolve_org_units_for_user(self, org_unit_refs, importer_access_ou, importer_account):
        """
        Resolve org unit references to OrgUnit objects, validating accessibility.

        Args:
            org_unit_refs: List of org unit references (IDs or names)
            importer_access_ou: QuerySet of accessible org units
            importer_account: Account for version filtering

        Returns:
            tuple: (valid_org_units: list[OrgUnit], invalid_refs: list[str], inaccessible_refs: list[str])
        """
        valid_org_units = []
        invalid_refs = []
        inaccessible_refs = []

        # Get accessible org unit IDs for efficient lookup
        accessible_ou_ids = set(importer_access_ou.values_list("id", flat=True))
        accessible_ou_dict = {ou.id: ou for ou in importer_access_ou}

        for ou_ref in org_unit_refs:
            if ou_ref.isdigit():
                ou_id = int(ou_ref)
                if ou_id not in accessible_ou_dict:
                    if not OrgUnit.objects.filter(id=ou_id).exists():
                        invalid_refs.append(ou_ref)
                    else:
                        inaccessible_refs.append(ou_ref)
                else:
                    valid_org_units.append(accessible_ou_dict[ou_id])
            else:
                # Check org unit by name within accessible org units
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
                    valid_org_units.append(ou)
                else:
                    invalid_refs.append(ou_ref)

        return valid_org_units, invalid_refs, inaccessible_refs

    def _pre_validate_users(self, user_data, importer_user, importer_account):
        """Validate all users and cache resolved objects for creation phase."""
        validation_errors = []

        validation_context = {
            "permissions_by_row": {},  # {row_idx: [Permission objects]}
            "projects_by_row": {},  # {row_idx: [Project objects]}
            "user_roles_by_row": {},  # {row_idx: [UserRole objects]}
            "org_units_by_row": {},  # {row_idx: [OrgUnit objects]}
            "editable_org_unit_types_by_row": {},  # {row_idx: [OrgUnitType objects]}
        }

        usernames = [data.get("username") for data in user_data if data.get("username")]
        emails = [data.get("email") for data in user_data if data.get("email")]
        dhis2_ids = [data.get("dhis2_id") for data in user_data if data.get("dhis2_id")]

        existing_usernames = set(User.objects.filter(username__in=usernames).values_list("username", flat=True))
        existing_emails = set(User.objects.filter(email__in=emails).values_list("email", flat=True))
        existing_dhis2_ids = set(Profile.objects.filter(dhis2_id__in=dhis2_ids).values_list("dhis2_id", flat=True))

        has_geo_limit = self.has_only_user_managed_permission(importer_user)

        importer_access_ou = OrgUnit.objects.filter_for_user_and_app_id(importer_user).only("id")

        for row_index, data in enumerate(user_data):
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

            password = data.get("password", "").strip() if data.get("password") else None

            # Auto-detect email invitation: no password + has email = send invitation
            if not password and email:
                # Email invitation mode - no validation needed
                pass
            elif password:
                try:
                    temp_user = User(username=username)
                    validate_password(password, temp_user)
                except ValidationError as e:
                    row_errors["password"] = f"Invalid password: {'; '.join(e.messages)}"
            else:
                # Error: need either password or email
                row_errors["password"] = "Either password or email required for user creation"

            # OrgUnit validation (by ID/name)
            org_unit_list = data.get("orgunit") or []
            org_unit_field = org_unit_list[0] if org_unit_list else ""

            # OrgUnit validation (by source_ref)
            org_unit_source_refs = data.get("orgunit__source_ref") or []

            has_any_org_unit = org_unit_field or org_unit_source_refs
            if has_geo_limit and not has_any_org_unit:
                row_errors["orgunit"] = (
                    f"A User with {CORE_USERS_MANAGED_PERMISSION.full_name()} permission "
                    "must create users with OrgUnits"
                )
            elif has_any_org_unit:
                valid_org_units = []

                # Resolve org units by ID/name
                if org_unit_list:
                    resolved, invalid_org_units, inaccessible_org_units = self._resolve_org_units_for_user(
                        org_unit_list, importer_access_ou, importer_account
                    )
                    if invalid_org_units:
                        row_errors["orgunit"] = f"Invalid OrgUnit: {', '.join(invalid_org_units)}"
                    elif inaccessible_org_units:
                        row_errors["orgunit"] = f"You don't have access to OrgUnit: {', '.join(inaccessible_org_units)}"
                    else:
                        valid_org_units.extend(resolved)

                # Resolve org units by source_ref
                if org_unit_source_refs and "orgunit" not in row_errors:
                    invalid_source_refs = []
                    for ou_ref in org_unit_source_refs:
                        ou = OrgUnit.objects.filter(
                            pk__in=importer_access_ou,
                            version_id=importer_account.default_version_id,
                            source_ref=ou_ref,
                        ).first()
                        if ou:
                            if ou not in valid_org_units:
                                valid_org_units.append(ou)
                        else:
                            invalid_source_refs.append(ou_ref)

                    if invalid_source_refs:
                        row_errors["orgunit__source_ref"] = (
                            f"Invalid or inaccessible OrgUnit source_ref: {', '.join(invalid_source_refs)}"
                        )

                if "orgunit" not in row_errors and "orgunit__source_ref" not in row_errors:
                    validation_context["org_units_by_row"][row_index] = valid_org_units

            permission_names = data.get("permissions", [])
            if permission_names:
                module_permissions = [perm.codename for perm in importer_account.permissions_from_active_modules]
                invalid_permissions = [pn for pn in permission_names if pn not in module_permissions]
                if invalid_permissions:
                    row_errors["permissions"] = f"Invalid permissions: {', '.join(invalid_permissions)}"
                else:
                    valid_permissions = Permission.objects.filter(
                        codename__in=[pn for pn in permission_names if pn in module_permissions]
                    )
                    validation_context["permissions_by_row"][row_index] = list(valid_permissions)

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
                    validation_context["user_roles_by_row"][row_index] = list(existing_roles)

            project_names = data.get("projects", [])
            if project_names:
                user_has_project_restrictions = hasattr(importer_user, "iaso_profile") and bool(
                    importer_user.iaso_profile.projects_ids
                )

                if user_has_project_restrictions and has_geo_limit:
                    available_projects = Project.objects.filter(
                        name__in=project_names, account=importer_account
                    ).filter_on_user_projects(importer_user)
                    # If none of the submitted projects is a subset of the user's project restrictions,
                    # fallback to the same restrictions as the user.
                    if not available_projects.exists():
                        available_projects = Project.objects.filter(account=importer_account).filter_on_user_projects(
                            importer_user
                        )
                    validation_context["projects_by_row"][row_index] = list(available_projects)
                else:
                    available_projects = Project.objects.filter(name__in=project_names, account=importer_account)
                    valid_project_names = set(available_projects.values_list("name", flat=True))
                    invalid_projects = [pn for pn in project_names if pn not in valid_project_names]
                    if invalid_projects:
                        row_errors["projects"] = f"Invalid projects: {', '.join(invalid_projects)}"
                    else:
                        validation_context["projects_by_row"][row_index] = list(available_projects)

            # Editable OrgUnitTypes - cache valid ones without validation error (matches original behavior)
            editable_org_unit_type_ids = data.get("editable_org_unit_types", [])
            if editable_org_unit_type_ids:
                available_org_unit_types = OrgUnitType.objects.filter(
                    projects__account=importer_account, id__in=editable_org_unit_type_ids
                ).distinct()
                # Store only valid types, silently ignore invalid ones (matches original behavior)
                validation_context["editable_org_unit_types_by_row"][row_index] = list(available_org_unit_types)

            if row_errors:
                validation_errors.append({"row": row_num, "errors": row_errors})

        return validation_errors, validation_context

    def _bulk_create_users_and_profiles(
        self, csv_data, importer_user, importer_account, csv_file_instance, validation_context
    ):
        """Create users and profiles using bulk operations and cached validation context."""
        audit_logger = ProfileAuditLogger()

        # Phase 1: Prepare User objects for bulk_create
        users_to_create = []

        for data in csv_data:
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

        created_users = User.objects.bulk_create(users_to_create)

        # Phase 2: Prepare Profile objects for bulk_create
        profiles_to_create = []
        invitation_users = []

        for user, data in zip(created_users, csv_data):
            profile = Profile(
                user=user,
                account=importer_account,
                language=data.get("profile_language", "fr").lower() or "fr",
                dhis2_id=data.get("dhis2_id", "").strip() or None,
                organization=data.get("organization", "").strip() or None,
                phone_number=self._validate_and_format_phone(data.get("phone_number")),
            )
            profiles_to_create.append(profile)

            # Check for email invitation while we have the data
            if not data.get("password", "").strip() and data.get("email", "").strip():
                invitation_users.append(user)

        created_profiles = Profile.objects.bulk_create(profiles_to_create)

        # Phase 3: Handle ManyToMany relationships with bulk operations
        self._bulk_set_many_to_many_relationships(
            created_profiles, csv_data, importer_user, importer_account, validation_context
        )

        # Phase 4: Send email invitations
        if invitation_users:
            self._send_bulk_email_invitations(invitation_users)

        # Phase 5: Save passwords to CSV and log audit
        self._save_csv_and_audit(csv_file_instance, csv_data, created_profiles, audit_logger, importer_user)

        return len(created_users)

    def _bulk_set_many_to_many_relationships(
        self, profiles, user_data, importer_user, importer_account, validation_context
    ):
        """Set ManyToMany relationships using bulk operations and cached validated objects."""
        profile_org_units_list = []
        profile_projects_list = []
        profile_user_roles_list = []
        user_groups_list = []
        user_permissions_list = []
        profile_editable_types_list = []

        for row_index, (profile, data) in enumerate(zip(profiles, user_data)):
            org_units_to_add = validation_context["org_units_by_row"].get(row_index, [])

            for ou in org_units_to_add:
                profile_org_units_list.append(Profile.org_units.through(profile=profile, orgunit=ou))

            cached_projects = validation_context["projects_by_row"].get(row_index, [])
            for project in cached_projects:
                profile_projects_list.append(Profile.projects.through(profile=profile, project=project))

            cached_roles = validation_context["user_roles_by_row"].get(row_index, [])
            for role in cached_roles:
                profile_user_roles_list.append(Profile.user_roles.through(profile=profile, userrole=role))
                user_groups_list.append(User.groups.through(user=profile.user, group=role.group))

            cached_permissions = validation_context["permissions_by_row"].get(row_index, [])
            for permission in cached_permissions:
                user_permissions_list.append(User.user_permissions.through(user=profile.user, permission=permission))

            cached_editable_types = validation_context["editable_org_unit_types_by_row"].get(row_index, [])
            for org_unit_type in cached_editable_types:
                profile_editable_types_list.append(
                    Profile.editable_org_unit_types.through(profile=profile, orgunittype=org_unit_type)
                )

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

        if profile_editable_types_list:
            Profile.editable_org_unit_types.through.objects.bulk_create(
                profile_editable_types_list, ignore_conflicts=True
            )

    def _send_bulk_email_invitations(self, users):
        """Queue background task to send email invitations to users without passwords."""
        user_ids = [
            user.id
            for user in users
            if user.email and not user.has_usable_password()  # Only users with unusable passwords need invitations
        ]

        if not user_ids:
            return

        send_bulk_email_invitations(user_ids, self.request.is_secure(), user=self.request.user)

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
        """Apply bulk configuration to existing users."""
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
