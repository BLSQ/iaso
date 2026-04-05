import csv
import io
import logging

from collections import Counter

import phonenumbers

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import Permission, User
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.db import transaction
from django.db.models import Q
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from iaso.api.bulk_create_users.constants import BULK_CREATE_USER_COLUMNS_LIST
from iaso.api.common.validators import FileTypeValidator
from iaso.api.validation_workflows.serializers.common import CurrentAccountDefault
from iaso.models import BulkCreateUserCsvFile, OrgUnit, OrgUnitType, Profile, Project, Team, UserRole
from iaso.permissions.core_permissions import CORE_USERS_MANAGED_PERMISSION


logger = logging.getLogger(__name__)


class BulkCreateItemSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        allow_null=False,
        allow_blank=False,
        required=True,
        write_only=True,
        validators=[UniqueValidator(queryset=User.objects.only("username").all())],
    )
    email = serializers.EmailField(allow_null=True, allow_blank=True, required=False, write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    last_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True, allow_null=True)
    permissions = serializers.SlugRelatedField(
        slug_field="codename",
        queryset=Permission.objects.all(),
        required=False,
        many=True,
        allow_null=True,
        allow_empty=True,
    )
    profile_language = serializers.ChoiceField(
        required=False, allow_null=True, allow_blank=True, source="language", choices=settings.LANGUAGES
    )

    class Meta:
        model = Profile
        fields = [
            "username",
            "password",
            "email",
            "first_name",
            "last_name",
            "orgunit",
            "orgunit__source_ref",
            "permissions",
            "profile_language",
            "dhis2_id",
            "organization",
            "projects",
            "user_roles",
            "teams",
            "phone_number",
            "editable_org_unit_types",
        ]

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("password"):
            raise serializers.ValidationError("Either password or email required for user creation")

        if not attrs.get("orgunit") and not attrs.get("orgunit__source_ref"):
            raise serializers.ValidationError(
                f"A User with {CORE_USERS_MANAGED_PERMISSION.full_name()} permission must create users with OrgUnits"
            )
        return attrs

    def __init__(self, *args, **kwargs):
        default_permissions = kwargs.get("default_permissions")
        default_projects = kwargs.get("default_projects")
        default_user_roles = kwargs.get("default_user_roles")
        default_profile_language = kwargs.get("default_profile_language")
        default_organization = kwargs.get("default_organization")
        default_org_units = kwargs.get("default_org_units")
        default_teams = kwargs.get("default_teams")

        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        importer_user = request.user

        if default_profile_language:
            self.fields["profile_language"].default = default_profile_language

        if default_permissions:
            self.fields["permissions"].default = default_permissions

    def create(self, validated_data) -> (AbstractBaseUser, Profile, bool):
        user_model = get_user_model()(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            is_active=True,
        )

        password = validated_data.get("password", None)
        email = validated_data.get("email", None)
        # Auto-detect email invitation: no password + has email = send invitation
        send_invitation = not password and bool(email)

        if send_invitation:
            user_model.set_unusable_password()
        elif password:
            user_model.set_password(password)

        profile = Profile(
            user=user_model,
            account=self.context["request"].user.iaso_profile.account,
            language=validated_data.get("profile_language", None),
            dhis2_id=validated_data.get("dhis2_id", None),
            organization=validated_data.get("organization", None),
            phone_number=validated_data.get("phone_number", ""),
        )

        # bulk

        return user_model, profile, send_invitation


class BulkCreateUserSerializer(serializers.ModelSerializer):
    default_permissions = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=Permission.objects.all(), allow_empty=True
    )
    default_projects = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=Project.objects.none(), allow_empty=True
    )
    default_user_roles = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=UserRole.objects.none(), allow_empty=True
    )
    default_org_units = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=OrgUnit.objects.none(), allow_empty=True
    )
    default_teams = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=Team.objects.none(), allow_empty=True
    )
    account = serializers.HiddenField(default=CurrentAccountDefault())

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
            "account",
        ]
        read_only_fields = [
            "created_by",
            "created_at",
            "account",
        ]

        extra_kwargs = {
            "file": {
                "validators": [
                    FileTypeValidator(allowed_mimetypes=["text/csv"]),
                    FileExtensionValidator(allowed_extensions=["csv"]),
                ],
            }
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        importer_user = request.user
        importer_account = request.user.iaso_profile.account

        self.dialect = None

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

        # init querysets for primary key related fields

        # default projects
        if request.user.iaso_profile.projects_ids:
            available_projects = Project.objects.filter(account=importer_account).filter_on_user_projects(importer_user)
        else:
            available_projects = Project.objects.filter(account=importer_account)

        self.fields["default_projects"].child_relation.queryset = available_projects

        # default user roles
        self.fields["default_user_roles"].child_relation.queryset = UserRole.objects.filter(account=importer_account)

        # org units
        self.fields["default_org_units"].child_relation.queryset = OrgUnit.objects.filter_for_user_and_app_id(
            importer_user
        )

        # teams
        self.fields["default_teams"].child_relation.queryset = Team.objects.filter_for_user(importer_user)

    def validate(self, attrs):
        if attrs.get("file"):
            self._validate_file_content(attrs["file"])
        return attrs

    def validate_file(self, value):
        if value:
            try:
                decoded = value.readline().decode("utf-8")
                value.seek(0)

                self.dialect = csv.Sniffer().sniff(decoded, delimiters=";,|")

            except UnicodeDecodeError:
                raise serializers.ValidationError("Invalid file encoding")
            except csv.Error:
                raise serializers.ValidationError("Invalid CSV file")

        return value

    def _validate_file_content(self, value):
        reader = csv.DictReader(io.StringIO(value.read().decode("utf-8")), dialect=self.dialect)
        # validating columns
        missing_columns = set(BULK_CREATE_USER_COLUMNS_LIST) - set(reader.fieldnames)
        if missing_columns:
            raise serializers.ValidationError(
                {"file_content": [{"general": f"Missing required column(s): {', '.join(sorted(missing_columns))}"}]}
            )

        validation_errors, self.csv_data_cache = self._validate_csv_users(reader)

        if validation_errors:
            raise serializers.ValidationError({"file_content": validation_errors})

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

    def _validate_csv_users(self, user_data):
        importer_user = self.context.get("request").user

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

        if len(set(usernames)) != len(usernames):
            raise ValidationError(
                {
                    "file_content": [
                        {
                            "general": f"Duplicates in usernames: {', '.join([item for item, count in Counter(usernames).items() if count > 1])}"
                        }
                    ]
                }
            )

        importer_access_ou = OrgUnit.objects.filter_for_user_and_app_id(importer_user).only("id")

        for row_index, data in enumerate(user_data):
            row_errors = {}
            row_num = data.get("_row_number", "unknown")

            # Validate OrgUnits
            org_unit_list = data.get("orgunit") or []
            org_unit_source_refs = data.get("orgunit__source_ref") or []
            has_any_org_unit = org_unit_list or org_unit_source_refs

            if not has_any_org_unit:
                row_errors["orgunit"] = (
                    f"A User with {CORE_USERS_MANAGED_PERMISSION.full_name()} permission "
                    "must create users with OrgUnits"
                )
            else:
                valid_org_units = []

                # Resolve org units by ID/name
                if org_unit_list:
                    resolved, invalid_org_units, inaccessible_org_units = self._resolve_org_units_for_user(
                        org_unit_list, importer_access_ou, importer_user.iaso_profile.account
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
                            version_id=importer_user.iaso_profile.account.default_version_id,
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
                module_permissions = [
                    perm.codename for perm in importer_user.iaso_profile.account.permissions_from_active_modules
                ]
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
                    account=importer_user.iaso_profile.account,
                    group__name__in=[f"{importer_user.iaso_profile.account_id}_{role}" for role in role_names],
                )
                existing_role_names = set(existing_roles.values_list("group__name", flat=True))
                invalid_roles = [
                    role
                    for role in role_names
                    if f"{importer_user.iaso_profile.account_id}_{role}" not in existing_role_names
                ]
                if invalid_roles:
                    row_errors["user_roles"] = f"Invalid user roles: {', '.join(invalid_roles)}"
                else:
                    validation_context["user_roles_by_row"][row_index] = list(existing_roles)

            # Validate projects
            project_refs = data.get("projects", [])
            if project_refs:
                # Separate numeric IDs from names
                project_ids = [int(ref) for ref in project_refs if ref.isdigit()]
                project_names = [ref for ref in project_refs if not ref.isdigit()]

                # Build a single query matching either IDs or names
                project_query = Q()
                if project_ids:
                    project_query |= Q(id__in=project_ids)
                if project_names:
                    project_query |= Q(name__in=project_names)

                user_has_project_restrictions = bool(importer_user.iaso_profile.projects_ids)

                if user_has_project_restrictions:
                    matched_projects = Project.objects.filter(
                        project_query, account=importer_user.iaso_profile.account
                    ).filter_on_user_projects(importer_user)

                    if matched_projects.exists():
                        validation_context["projects_by_row"][row_index] = list(matched_projects)
                    else:
                        available_projects = Project.objects.filter(
                            account=importer_user.iaso_profile.account
                        ).filter_on_user_projects(importer_user)
                        validation_context["projects_by_row"][row_index] = list(available_projects)
                else:
                    available_projects = Project.objects.filter(
                        project_query, account=importer_user.iaso_profile.account
                    )
                    found_ids = set(available_projects.values_list("id", flat=True))
                    found_names = set(available_projects.values_list("name", flat=True))
                    invalid_projects = [str(pid) for pid in project_ids if pid not in found_ids] + [
                        pname for pname in project_names if pname not in found_names
                    ]
                    if invalid_projects:
                        row_errors["projects"] = f"Invalid projects: {', '.join(invalid_projects)}"
                    else:
                        validation_context["projects_by_row"][row_index] = list(available_projects)

            # Validate teams
            team_names = data.get("teams", [])
            if team_names:
                existing_teams = Team.objects.filter(
                    name__in=team_names, project__account=importer_user.iaso_profile.account
                )
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
                    projects__account=importer_user.iaso_profile.account, id__in=editable_org_unit_type_ids
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

        return validation_errors, validation_context

    def _resolve_org_units_for_user(self, org_unit_refs, importer_access_ou, importer_account):
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

    @transaction.atomic
    def create(self, validated_data):
        # bulk create first
        # users
        users = []
        profiles = []
        csv_reader = csv.DictReader(validated_data["csv_file"].read(), dialect=self.dialect)

        for row in csv_reader:
            serializer = BulkCreateItemSerializer(data=row)
            if serializer.is_valid():
                user, profile, invitation = serializer.save()
                users.append(user)
                profiles.append(profile)

        # create
        get_user_model().objects.bulk_create(users)
        Profile.objects.bulk_create(profiles)

        # profile

        # update the validated_data to contain all the data in csv

        instance = super().create(validated_data)

        return instance
