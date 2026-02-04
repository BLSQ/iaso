import csv
import io
import json

import pandas as pd
import phonenumbers

from django.contrib.auth.models import Permission, User
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


class JSONListField(serializers.ListField):
    """ListField that accepts JSON strings in multipart form data."""

    def to_internal_value(self, data):
        # Handle JSON string (e.g., '["item1", "item2"]')
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format for list field.")
        # Handle list containing a single JSON string (e.g., ['["item1", "item2"]'])
        elif isinstance(data, list) and len(data) == 1 and isinstance(data[0], str):
            try:
                parsed = json.loads(data[0])
                if isinstance(parsed, list):
                    data = parsed
            except json.JSONDecodeError:
                pass  # Keep original data, let parent handle validation
        return super().to_internal_value(data)


class BulkCreateUserSerializer(serializers.ModelSerializer):
    default_permissions = JSONListField(child=serializers.CharField(max_length=255), required=False, allow_empty=True)
    default_projects = JSONListField(child=serializers.CharField(max_length=255), required=False, allow_empty=True)
    default_user_roles = JSONListField(child=serializers.CharField(max_length=255), required=False, allow_empty=True)
    default_org_units = JSONListField(child=serializers.IntegerField(), required=False, allow_empty=True)
    default_teams = JSONListField(child=serializers.CharField(max_length=255), required=False, allow_empty=True)

    class Meta:
        model = BulkCreateUserCsvFile
        fields = [
            "file",
            "default_permissions",
            "default_projects",
            "default_user_roles",
            "default_profile_language",
            "default_organization",
            "default_org_units",
            "default_teams",
        ]
        read_only_fields = [
            "created_by",
            "created_at",
            "account",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        self.importer_user = request.user
        self.importer_account = request.user.iaso_profile.account

        self.parsed_csv_data = []

        # Cache for validated objects
        self.csv_objects_cache = {
            "permissions": [],
            "projects": [],
            "user_roles": [],
            "org_units": [],
            "teams": [],
        }

        # Cache for CSV row validation data
        self.csv_data_cache = {}

    def validate_file(self, value):
        if not value.name.endswith(".csv"):
            raise serializers.ValidationError("Only CSV files are allowed.")

        self.parsed_csv_data = self._parse_csv_file(value)

        validation_errors, self.csv_data_cache = self._validate_csv_users(self.parsed_csv_data)

        if validation_errors:
            raise serializers.ValidationError({"csv_validation_errors": validation_errors})

        return value

    def validate_default_permissions(self, value):
        """Validate permissions against available permissions."""
        if not value:
            return value

        if not self.importer_account:
            return value

        module_permissions = [perm.codename for perm in self.importer_account.permissions_from_active_modules]
        invalid_permissions = [pn for pn in value if pn not in module_permissions]

        if invalid_permissions:
            raise serializers.ValidationError(f"Invalid permissions: {', '.join(invalid_permissions)}")

        # Cache resolved permission objects for later use
        valid_permissions = Permission.objects.filter(codename__in=[pn for pn in value if pn in module_permissions])
        self.csv_objects_cache["permissions"] = list(valid_permissions)

        return value

    def validate_default_projects(self, value):
        """Validate projects exist in user's account."""
        if not value:
            return value

        if not self.importer_account or not self.importer_user:
            return value

        has_geo_limit = BulkCreateUserFromCsvViewSet.has_only_user_managed_permission(self.importer_user)
        user_has_project_restrictions = bool(self.importer_user.iaso_profile.projects_ids)

        if user_has_project_restrictions and has_geo_limit:
            available_projects = Project.objects.filter(
                name__in=value, account=self.importer_account
            ).filter_on_user_projects(self.importer_user)

            if not available_projects.exists():
                available_projects = Project.objects.filter(account=self.importer_account).filter_on_user_projects(
                    self.importer_user
                )
        else:
            available_projects = Project.objects.filter(name__in=value, account=self.importer_account)
            valid_project_names = set(available_projects.values_list("name", flat=True))
            invalid_projects = [pn for pn in value if pn not in valid_project_names]

            if invalid_projects:
                raise serializers.ValidationError(f"Invalid projects: {', '.join(invalid_projects)}")

        # Cache resolved objects
        self.csv_objects_cache["projects"] = list(available_projects)

        return value

    def validate_default_user_roles(self, value):
        """Validate user roles exist in account."""
        if not value:
            return value

        if not self.importer_account:
            return value

        existing_roles = UserRole.objects.filter(
            account=self.importer_account,
            group__name__in=[f"{self.importer_account.id}_{role}" for role in value],
        )
        existing_role_names = set(existing_roles.values_list("group__name", flat=True))
        invalid_roles = [role for role in value if f"{self.importer_account.id}_{role}" not in existing_role_names]

        if invalid_roles:
            raise serializers.ValidationError(f"Invalid user roles: {', '.join(invalid_roles)}")

        # Cache resolved objects
        self.csv_objects_cache["user_roles"] = list(existing_roles)

        return value

    def validate_default_org_units(self, value):
        """Validate org unit IDs exist and user has access."""
        if not value:
            return value

        if not self.importer_user:
            return value

        importer_access_ou = OrgUnit.objects.filter_for_user_and_app_id(self.importer_user)
        accessible_ou_ids = set(importer_access_ou.values_list("id", flat=True))

        invalid_ids = [ou_id for ou_id in value if ou_id not in accessible_ou_ids]
        if invalid_ids:
            raise serializers.ValidationError(
                f"Invalid or inaccessible org unit IDs: {', '.join(map(str, invalid_ids))}"
            )

        # Cache resolved objects
        valid_org_units = OrgUnit.objects.filter(id__in=value, pk__in=importer_access_ou)
        self.csv_objects_cache["org_units"] = list(valid_org_units)

        return value

    def validate_default_teams(self, value):
        """Validate team names exist in user's account."""
        if not value:
            return value

        if not self.importer_account:
            return value

        existing_teams = Team.objects.filter(name__in=value, project__account=self.importer_account)
        existing_team_names = set(existing_teams.values_list("name", flat=True))

        invalid_teams = [team for team in value if team not in existing_team_names]
        if invalid_teams:
            raise serializers.ValidationError(f"Invalid teams: {', '.join(invalid_teams)}")

        # Cache resolved objects
        self.csv_objects_cache["teams"] = list(existing_teams)

        return value

    @staticmethod
    def _format_phone_number(phone_number):
        """Format phone number using E.164 format or raise ValidationError."""
        try:
            parsed_number = phonenumbers.parse(phone_number, None)
            if not phonenumbers.is_valid_number(parsed_number):
                raise ValidationError(f"Invalid phone number: {phone_number}")
            return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValidationError(f"Invalid phone number format: {phone_number}")

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
        except UnicodeDecodeError:
            raise serializers.ValidationError("Invalid file encoding")
        except pd.errors.ParserError:
            raise serializers.ValidationError("Invalid CSV file")
        except Exception as e:
            raise serializers.ValidationError("Failed to parse CSV")

        parsed_rows = []
        headers = None
        value_splitter = "," if delimiter == "," else "*"

        # Fields that contain multiple values separated by delimiter
        multi_value_fields = [
            "orgunit",
            "orgunit__source_ref",
            "projects",
            "user_roles",
            "teams",
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
                        f"Missing required column(s): {', '.join(sorted(missing_columns))}"
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

    def _validate_csv_users(self, user_data):
        """Validate all CSV users and cache resolved objects."""
        if not self.importer_user or not self.importer_account:
            raise serializers.ValidationError("Invalid user context for CSV validation")

        validation_errors = []
        validation_context = {
            "permissions_by_row": {},
            "projects_by_row": {},
            "user_roles_by_row": {},
            "teams_by_row": {},
            "org_units_by_row": {},
            "editable_org_unit_types_by_row": {},
            "phone_numbers_by_row": {},
        }

        # Get existing data for uniqueness checks
        usernames = [data.get("username") for data in user_data if data.get("username")]
        dhis2_ids = [data.get("dhis2_id") for data in user_data if data.get("dhis2_id")]

        existing_usernames = set(User.objects.filter(username__in=usernames).values_list("username", flat=True))
        existing_dhis2_ids = set(Profile.objects.filter(dhis2_id__in=dhis2_ids).values_list("dhis2_id", flat=True))

        has_geo_limit = BulkCreateUserFromCsvViewSet.has_only_user_managed_permission(self.importer_user)
        importer_access_ou = OrgUnit.objects.filter_for_user_and_app_id(self.importer_user).only("id")

        for row_index, data in enumerate(user_data):
            row_errors = {}
            row_num = data.get("_row_number", "unknown")

            # Validate username
            username = data.get("username", "").strip()
            if not username:
                row_errors["username"] = "Username is required"
            elif username in existing_usernames:
                row_errors["username"] = f"Username '{username}' already exists"

            # Validate email
            email = data.get("email", "").strip() if data.get("email") else None
            if email:
                try:
                    validators.validate_email(email)
                except ValidationError:
                    row_errors["email"] = f"Invalid email format: '{email}'"

            # Validate DHIS2 ID
            dhis2_id = data.get("dhis2_id", "").strip() if data.get("dhis2_id") else None
            if dhis2_id and dhis2_id in existing_dhis2_ids:
                row_errors["dhis2_id"] = f"DHIS2 ID '{dhis2_id}' already exists"

            # Validate password
            password = data.get("password", "").strip() if data.get("password") else None
            if not password and email:
                # Email invitation mode - no password validation
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

            # Validate OrgUnits
            org_unit_list = data.get("orgunit") or []
            org_unit_source_refs = data.get("orgunit__source_ref") or []
            has_any_org_unit = org_unit_list or org_unit_source_refs

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
                        org_unit_list, importer_access_ou
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
                            version_id=self.importer_account.default_version_id,
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

            # Validate permissions
            permission_names = data.get("permissions", [])
            if permission_names:
                module_permissions = [perm.codename for perm in self.importer_account.permissions_from_active_modules]
                invalid_permissions = [pn for pn in permission_names if pn not in module_permissions]
                if invalid_permissions:
                    row_errors["permissions"] = f"Invalid permissions: {', '.join(invalid_permissions)}"
                else:
                    valid_permissions = Permission.objects.filter(
                        codename__in=[pn for pn in permission_names if pn in module_permissions]
                    )
                    validation_context["permissions_by_row"][row_index] = list(valid_permissions)

            # Validate user roles
            role_names = data.get("user_roles", [])
            if role_names:
                existing_roles = UserRole.objects.filter(
                    account=self.importer_account,
                    group__name__in=[f"{self.importer_account.id}_{role}" for role in role_names],
                )
                existing_role_names = set(existing_roles.values_list("group__name", flat=True))
                invalid_roles = [
                    role for role in role_names if f"{self.importer_account.id}_{role}" not in existing_role_names
                ]
                if invalid_roles:
                    row_errors["user_roles"] = f"Invalid user roles: {', '.join(invalid_roles)}"
                else:
                    validation_context["user_roles_by_row"][row_index] = list(existing_roles)

            # Validate projects
            project_names = data.get("projects", [])
            if project_names:
                user_has_project_restrictions = bool(self.importer_user.iaso_profile.projects_ids)

                if user_has_project_restrictions and has_geo_limit:
                    available_projects = Project.objects.filter(
                        name__in=project_names, account=self.importer_account
                    ).filter_on_user_projects(self.importer_user)

                    if not available_projects.exists():
                        available_projects = Project.objects.filter(
                            account=self.importer_account
                        ).filter_on_user_projects(self.importer_user)
                    validation_context["projects_by_row"][row_index] = list(available_projects)
                else:
                    available_projects = Project.objects.filter(name__in=project_names, account=self.importer_account)
                    valid_project_names = set(available_projects.values_list("name", flat=True))
                    invalid_projects = [pn for pn in project_names if pn not in valid_project_names]
                    if invalid_projects:
                        row_errors["projects"] = f"Invalid projects: {', '.join(invalid_projects)}"
                    else:
                        validation_context["projects_by_row"][row_index] = list(available_projects)

            # Validate teams
            team_names = data.get("teams", [])
            if team_names:
                existing_teams = Team.objects.filter(name__in=team_names, project__account=self.importer_account)
                existing_team_names = set(existing_teams.values_list("name", flat=True))
                invalid_teams = [team for team in team_names if team not in existing_team_names]
                if invalid_teams:
                    row_errors["teams"] = f"Row {row_num}: Team '{invalid_teams[0]}' does not exist."
                else:
                    validation_context["teams_by_row"][row_index] = list(existing_teams)

            # Validate editable org unit types
            editable_org_unit_type_ids = data.get("editable_org_unit_types", [])
            if editable_org_unit_type_ids:
                available_org_unit_types = OrgUnitType.objects.filter(
                    projects__account=self.importer_account, id__in=editable_org_unit_type_ids
                ).distinct()
                validation_context["editable_org_unit_types_by_row"][row_index] = list(available_org_unit_types)

            # Validate and format phone number
            phone_number = data.get("phone_number", "").strip()
            formatted_phone = ""
            if phone_number:
                try:
                    formatted_phone = self._format_phone_number(phone_number)
                except ValidationError:
                    # Silent correction: invalid phones become empty string
                    formatted_phone = ""
            validation_context["phone_numbers_by_row"][row_index] = formatted_phone

            if row_errors:
                validation_errors.append({"row": row_num, "errors": row_errors})

        return validation_errors, validation_context

    def _resolve_org_units_for_user(self, org_unit_refs, importer_access_ou):
        """Resolve org unit references to OrgUnit objects."""
        valid_org_units = []
        invalid_refs = []
        inaccessible_refs = []

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
                        version_id=self.importer_account.default_version_id,
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
        """Create users from CSV file with optional default values.

        CSV field values take precedence. Default fields provide fallback values
        for empty fields across all users in a single atomic transaction.

        Email invitations are sent automatically to users without passwords
        (users with email but no password in CSV).

        Request body:
        {
            "file": <csv file>,
            "default_permissions": ["iaso_forms", "iaso_submissions"],
            "default_projects": ["Project 1"],
            "default_user_roles": ["manager"],
            "default_profile_language": "en",
            "default_organization": "WHO",
            "default_org_units": [123, 456]
        }
        """
        importer_user = request.user
        importer_account = importer_user.iaso_profile.account

        # Validate file and bulk configuration fields via serializer (includes CSV parsing and validation)
        serializer = self.get_serializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response({"error": serializer.errors}, status=400)

        # Get validated CSV data and context from serializer
        csv_data = serializer.parsed_csv_data
        csv_data_cache = serializer.csv_data_cache

        # Use serializer data and cached objects directly
        default_data = serializer.validated_data
        csv_objects_cache = serializer.csv_objects_cache

        created_users, created_profiles = self._bulk_create_users_and_profiles(
            csv_data,
            importer_user,
            importer_account,
            csv_data_cache,
            default_data,
            csv_objects_cache,
        )

        csv_file_instance = BulkCreateUserCsvFile.objects.create(
            file=request.FILES["file"],
            created_by=importer_user,
            account=importer_account,
            default_permissions=default_data.get("default_permissions", []),
            default_projects=default_data.get("default_projects", []),
            default_user_roles=default_data.get("default_user_roles", []),
            default_org_units=default_data.get("default_org_units", []),
            default_teams=default_data.get("default_teams", []),
            default_profile_language=default_data.get("default_profile_language", ""),
            default_organization=default_data.get("default_organization", ""),
        )

        # remove passwords from stored CSV using pandas
        csv_file_instance.file.seek(0)
        file_content = csv_file_instance.file.read().decode("utf-8")
        delimiter = ";" if ";" in file_content else ","
        csv_data = pd.read_csv(io.StringIO(file_content), delimiter=delimiter)
        csv_data["password"] = ""
        csv_content = csv_data.to_csv(path_or_buf=None, index=False, sep=delimiter)
        content_file = ContentFile(csv_content.encode("utf-8"))
        csv_file_instance.file.save(f"{csv_file_instance.id}.csv", content_file, save=False)
        csv_file_instance.save()

        audit_logger = ProfileAuditLogger()
        self._audit(created_profiles, audit_logger, importer_user)

        response = {"Accounts created": len(created_users)}
        return Response(response)

    def _bulk_create_users_and_profiles(
        self,
        csv_data,
        importer_user,
        importer_account,
        csv_data_cache,
        default_data=None,
        csv_objects_cache=None,
    ):
        """Create users and profiles using bulk operations validation context.
        Uses default_data for fallback values and csv_objects_cache for cached objects
        """
        default_data = default_data or {}
        csv_objects_cache = csv_objects_cache or {}
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

        for row_index, (user, data) in enumerate(zip(created_users, csv_data)):
            language = (
                data.get("profile_language", "").strip().lower()
                or default_data.get("default_profile_language", "").lower()
                or "fr"
            )

            organization = data.get("organization", "").strip() or default_data.get("default_organization", "")

            dhis2_id = data.get("dhis2_id", "").strip()

            profile = Profile(
                user=user,
                account=importer_account,
                language=language,
                dhis2_id=dhis2_id or None,
                organization=organization,
                phone_number=csv_data_cache.get("phone_numbers_by_row", {}).get(row_index, ""),
            )
            profiles_to_create.append(profile)

            if not data.get("password", "").strip() and data.get("email", "").strip():
                invitation_users.append(user)

        created_profiles = Profile.objects.bulk_create(profiles_to_create)

        # Phase 3: Handle ManyToMany relationships with bulk operations
        self._bulk_set_many_to_many_relationships(
            created_profiles,
            csv_data,
            importer_user,
            importer_account,
            csv_data_cache,
            default_data,
            csv_objects_cache,
        )

        # Phase 4: Send email invitations
        if invitation_users:
            self._send_bulk_email_invitations(invitation_users)

        return created_users, created_profiles

    def _bulk_set_many_to_many_relationships(
        self,
        profiles,
        user_data,
        importer_user,
        importer_account,
        csv_data_cache,
        default_data=None,
        csv_objects_cache=None,
    ):
        """Set ManyToMany relationships using bulk operations and cached validated objects.

        Uses default_data for defaults and csv_objects_cache for cached objects.
        """
        default_data = default_data or {}
        csv_objects_cache = csv_objects_cache or {}

        profile_org_units_list = []
        profile_projects_list = []
        profile_user_roles_list = []
        user_groups_list = []
        user_permissions_list = []
        profile_editable_types_list = []
        team_users_list = []

        for row_index, (profile, data) in enumerate(zip(profiles, user_data)):
            org_units_to_add = csv_data_cache["org_units_by_row"].get(row_index, [])
            if not org_units_to_add:
                org_units_to_add = csv_objects_cache.get("org_units", [])

            for ou in org_units_to_add:
                profile_org_units_list.append(Profile.org_units.through(profile=profile, orgunit=ou))

            cached_projects = csv_data_cache["projects_by_row"].get(row_index, [])
            if not cached_projects:
                cached_projects = csv_objects_cache.get("projects", [])

            for project in cached_projects:
                profile_projects_list.append(Profile.projects.through(profile=profile, project=project))

            cached_teams = csv_data_cache["teams_by_row"].get(row_index, [])
            if not cached_teams:
                cached_teams = csv_objects_cache.get("teams", [])

            for team in cached_teams:
                team_users_list.append(Team.users.through(team=team, user=profile.user))

            cached_roles = csv_data_cache["user_roles_by_row"].get(row_index, [])
            if not cached_roles:
                cached_roles = csv_objects_cache.get("user_roles", [])

            for role in cached_roles:
                profile_user_roles_list.append(Profile.user_roles.through(profile=profile, userrole=role))
                user_groups_list.append(User.groups.through(user=profile.user, group=role.group))

            cached_permissions = csv_data_cache["permissions_by_row"].get(row_index, [])
            if not cached_permissions:
                cached_permissions = csv_objects_cache.get("permissions", [])

            for permission in cached_permissions:
                user_permissions_list.append(User.user_permissions.through(user=profile.user, permission=permission))

            cached_editable_types = csv_data_cache["editable_org_unit_types_by_row"].get(row_index, [])
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

        if team_users_list:
            Team.users.through.objects.bulk_create(team_users_list, ignore_conflicts=True)

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

    def _audit(self, created_profiles, audit_logger, importer_user):
        """Log created users"""
        for profile in created_profiles:
            audit_logger.log_modification(
                instance=profile,
                old_data_dump=None,
                request_user=importer_user,
                source=f"{PROFILE_API_BULK}_create",
            )

    @swagger_auto_schema(request_body=no_body)
    @action(detail=False, methods=["get"], url_path="getsample")
    def download_sample_csv(self, request):
        return FileResponse(open("iaso/api/fixtures/sample_bulk_user_creation.csv", "rb"))
