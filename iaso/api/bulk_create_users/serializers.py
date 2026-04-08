import csv
import io
import logging

from collections import Counter

import phonenumbers

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import Permission, User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.validators import FileExtensionValidator
from django.db import transaction
from rest_framework import serializers
from rest_framework.fields import CurrentUserDefault
from rest_framework.relations import SlugRelatedField
from rest_framework.validators import UniqueValidator

from iaso.api.bulk_create_users.constants import BULK_CREATE_USER_COLUMNS_LIST
from iaso.api.bulk_create_users.permissions import has_only_user_managed_permission
from iaso.api.bulk_create_users.utils import detect_multi_field_value_splitter
from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import AccountPrefixedSlugRelatedField, SlugOrPrimaryKeyRelatedField
from iaso.api.common.validators import FileTypeValidator
from iaso.api.validation_workflows.serializers.common import CurrentAccountDefault
from iaso.models import BulkCreateUserCsvFile, OrgUnit, OrgUnitType, Profile, Project, Team, UserRole
from iaso.permissions.core_permissions import CORE_USERS_MANAGED_PERMISSION
from iaso.tasks.bulk_create_users_email import send_bulk_email_invitations


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
        queryset=Permission.objects.none(),
        required=False,
        many=True,
        allow_null=True,
        allow_empty=True,
    )
    profile_language = serializers.ChoiceField(
        required=False, allow_null=True, allow_blank=True, choices=settings.LANGUAGES
    )

    user_roles = AccountPrefixedSlugRelatedField(
        slug_field="group__name",
        queryset=UserRole.objects.none(),
        required=False,
        many=True,
        allow_null=True,
        allow_empty=True,
    )
    teams = SlugRelatedField(
        slug_field="name", queryset=Team.objects.none(), required=False, many=True, allow_null=True, allow_empty=True
    )
    editable_org_unit_types = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnitType.objects.none(), required=False, many=True, allow_null=True, allow_empty=True
    )

    projects = SlugOrPrimaryKeyRelatedField(
        slug_field="name", queryset=Project.objects.none(), required=False, many=True, allow_null=True, allow_empty=True
    )

    orgunit = SlugOrPrimaryKeyRelatedField(
        slug_field="name", queryset=Project.objects.none(), required=False, many=True, allow_null=True, allow_empty=True
    )

    orgunit__source_ref = SlugRelatedField(
        slug_field="source_ref",
        queryset=OrgUnit.objects.none(),
        allow_null=True,
        allow_empty=True,
        many=True,
        required=False,
    )
    phone_number = serializers.CharField(allow_null=True, allow_blank=True, required=False)

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

        if (
            not attrs.get("orgunit")
            and not attrs.get("orgunit__source_ref")
            and has_only_user_managed_permission(self.context["request"].user)
        ):
            raise serializers.ValidationError(
                f"A User with {CORE_USERS_MANAGED_PERMISSION.full_name()} permission must create users with OrgUnits"
            )

        return attrs

    def __init__(self, *args, **kwargs):
        default_permissions = kwargs.pop("default_permissions", None)
        default_projects = kwargs.pop("default_projects", None)
        default_user_roles = kwargs.pop("default_user_roles", None)
        default_profile_language = kwargs.pop("default_profile_language", None)
        default_organization = kwargs.pop("default_organization", None)
        default_org_units = kwargs.pop("default_org_units", None)
        default_teams = kwargs.pop("default_teams", None)

        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        importer_user = request.user
        self.context["account_id"] = request.user.iaso_profile.account_id

        # enable defaults
        if default_profile_language:
            self.fields["profile_language"].default = default_profile_language

        if default_permissions:
            self.fields["permissions"].default = default_permissions

        if default_user_roles:
            self.fields["user_roles"].default = default_user_roles

        if default_teams:
            self.fields["teams"].default = default_teams

        if default_organization:
            self.fields["organization"].default = default_organization

        if default_projects:
            self.fields["projects"].default = default_projects

        if default_org_units:
            self.fields["orgunit"].default = default_org_units

        # enable querysets
        self.fields["permissions"].child_relation.queryset = Permission.objects.filter(
            codename__in=importer_user.iaso_profile.account.permissions_from_active_modules
        )
        self.fields["user_roles"].child_relation.queryset = UserRole.objects.filter(
            account=importer_user.iaso_profile.account
        )
        self.fields["teams"].child_relation.queryset = Team.objects.filter_for_user(importer_user)
        self.fields["editable_org_unit_types"].child_relation.queryset = OrgUnitType.objects.prefetch_related(
            "projects__account"
        ).filter(projects__account=importer_user.iaso_profile.account)

        if request.user.iaso_profile.projects_ids and has_only_user_managed_permission(importer_user):
            available_projects = Project.objects.filter(
                account=request.user.iaso_profile.account
            ).filter_on_user_projects(importer_user)
        else:
            available_projects = Project.objects.filter(account=request.user.iaso_profile.account)

        self.fields["projects"].child_relation.queryset = available_projects

        self.fields["orgunit"].child_relation.queryset = OrgUnit.objects.filter_for_user_and_app_id(importer_user)
        self.fields["orgunit__source_ref"].child_relation.queryset = OrgUnit.objects.filter_for_user_and_app_id(
            importer_user
        )

    def validate_phone_number(self, data):
        if data:
            try:
                parsed_number = phonenumbers.parse(data, None)
                if not phonenumbers.is_valid_number(parsed_number):
                    raise serializers.ValidationError(f"Invalid phone number: {data}")
                return phonenumbers.format_number(parsed_number, phonenumbers.PhoneNumberFormat.E164)
            except phonenumbers.NumberParseException:
                raise serializers.ValidationError(f"Invalid phone number format: {data}")
        return data

    def create(self, validated_data) -> (AbstractBaseUser, Profile, bool):
        user_model = get_user_model()(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
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

        # m2m
        org_units = []
        org_units_editable_types = []
        teams = []
        permissions = []
        projects = []
        user_roles = []
        user_groups = []

        if validated_data.get("orgunit", None):
            for ou in validated_data.get("orgunit", []) or []:
                org_units.append(Profile.org_units.through(profile=profile, orgunit=ou))

        if validated_data.get("orgunit__source_ref", None):
            for ou in validated_data.get("orgunit__source_ref", []) or []:
                if ou not in org_units:
                    org_units.append(Profile.org_units.through(profile=profile, orgunit=ou))

        if validated_data.get("teams", None):
            for team in validated_data.get("teams", []) or []:
                teams.append(Team.users.through(team=team, user=user_model))

        if validated_data.get("permissions", None):
            for permission in validated_data.get("permissions", []) or []:
                permissions.append(get_user_model().user_permissions.through(user=user_model, permission=permission))

        if validated_data.get("editable_org_unit_types", None):
            for editable in validated_data.get("editable_org_unit_types", []) or []:
                org_units_editable_types.append(
                    Profile.editable_org_unit_types.through(profile=profile, orgunittype=editable)
                )

        if validated_data.get("projects", None):
            for project in validated_data.get("projects", []) or []:
                projects.append(Profile.projects.through(profile=profile, project=project))

        if validated_data.get("user_roles", None):
            for user_role in validated_data.get("user_roles", []) or []:
                user_roles.append(Profile.user_roles.through(profile=profile, userrole=user_role))
                user_groups.append(get_user_model().groups.through(user=user_model, group=user_role.group))

        return (
            user_model,
            profile,
            user_model if send_invitation else None,
            org_units,
            teams,
            permissions,
            org_units_editable_types,
            user_roles,
            projects,
            user_groups,
        )


class BulkCreateUserSerializer(ModelSerializer):
    default_permissions = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=Permission.objects.all(), allow_empty=True, write_only=True
    )
    default_projects = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=Project.objects.none(), allow_empty=True, write_only=True
    )
    default_user_roles = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=UserRole.objects.none(), allow_empty=True, write_only=True
    )
    default_org_units = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=OrgUnit.objects.none(), allow_empty=True, write_only=True
    )
    default_teams = serializers.PrimaryKeyRelatedField(
        many=True, allow_null=True, queryset=Team.objects.none(), allow_empty=True, write_only=True
    )
    account = serializers.HiddenField(default=CurrentAccountDefault(), write_only=True)
    created_by = serializers.HiddenField(default=CurrentUserDefault(), write_only=True)

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
            "created_by",
        ]

        extra_kwargs = {
            "file": {
                "write_only": True,
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

        # init querysets for primary key related fields

        # default projects
        if request.user.iaso_profile.projects_ids and has_only_user_managed_permission(importer_user):
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

        self._validate_csv_users(reader)

        return value

    def _validate_csv_users(self, user_data):
        # Get existing data for uniqueness checks
        usernames = [data.get("username") for data in user_data if data.get("username")]

        if len(set(usernames)) != len(usernames):
            raise serializers.ValidationError(
                {
                    "file_content": [
                        {
                            "general": f"Duplicates in usernames: {', '.join([item for item, count in Counter(usernames).items() if count > 1])}"
                        }
                    ]
                }
            )

        return user_data

    def _filter_out_sensitive_data(self, file):
        file.seek(0)
        reader = csv.DictReader(io.StringIO(file.read().decode("utf-8")), dialect=self.dialect)
        for row in reader:
            if row.get("password", ""):
                row["password"] = "*" * 6  # put 6 there so we can't guess really the password length if there is one

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=reader.fieldnames)
        writer.writeheader()
        writer.writerows(list(reader))
        output.seek(0)
        return SimpleUploadedFile(
            name=file.name,
            content=output.getvalue().encode("utf-8"),
            content_type="text/csv",
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

        send_bulk_email_invitations(user_ids, self.context["request"].is_secure(), user=self.context["request"].user)

    def _pre_process_row(self, row):
        """
        Split the values by delimiter if needed
        Transform the integer strings into real integers
        """

        for k, v in list(row.items()):
            if k in [
                "teams",
                "permissions",
                "user_roles",
                "orgunit",
                "projects",
                "orgunit__source_ref",
                "editable_org_unit_types",
            ]:
                row[k] = list(
                    map(
                        lambda x: int(x) if isinstance(x, str) and x.isdigit() else x,
                        filter(
                            lambda x: bool(x),
                            [i.strip() for i in v.split(detect_multi_field_value_splitter(self.dialect, v))]
                            if isinstance(v, str)
                            else (v or []),
                        ),
                    )
                )
            if k in ["profile_language"]:
                if v:
                    row[k] = v.lower()  # e.g to map FR to fr
        return {k: v for k, v in row.items() if v}

    def create(self, validated_data):
        validation_errors = []

        bulk_users = []
        bulk_profiles = []
        bulk_org_units = []
        bulk_teams = []
        bulk_permissions = []
        bulk_org_units_editable_types = []
        bulk_user_roles = []
        bulk_projects = []
        bulk_user_groups = []
        email_invitations = []

        validated_data["file"].seek(0)
        csv_reader = csv.DictReader(validated_data["file"].read().decode("utf-8").splitlines(), dialect=self.dialect)

        for idx, row in enumerate(csv_reader):
            serializer = BulkCreateItemSerializer(
                data=self._pre_process_row(row),
                context=self.context,
                default_user_roles=validated_data.get("default_user_roles", None),
                default_teams=validated_data.get("default_teams", None),
                default_projects=validated_data.get("default_projects", None),
                default_permissions=validated_data.get("default_permissions", None),
                default_org_units=validated_data.get("default_org_units", None),
                default_profile_language=validated_data.get("default_profile_language", None),
                default_organization=validated_data.get("default_organization", None),
            )
            if serializer.is_valid():
                (
                    user,
                    profile,
                    invitation,
                    org_units,
                    teams,
                    permissions,
                    org_units_editable_types,
                    user_roles,
                    projects,
                    user_groups,
                ) = serializer.save()
                bulk_users.append(user)
                bulk_profiles.append(profile)
                if invitation:
                    email_invitations.append(invitation)

                if org_units:
                    bulk_org_units.extend(org_units)

                if teams:
                    bulk_teams.extend(teams)

                if permissions:
                    bulk_permissions.extend(permissions)

                if org_units_editable_types:
                    bulk_org_units_editable_types.extend(org_units_editable_types)

                if user_roles:
                    bulk_user_roles.extend(user_roles)

                if projects:
                    bulk_projects.extend(projects)

                if user_groups:
                    bulk_user_groups.extend(user_groups)
            else:
                validation_errors.append({"row": idx + 1, "details": serializer.errors})

        if validation_errors:
            raise serializers.ValidationError({"file_content": validation_errors})

        # bulk create data
        with transaction.atomic():
            get_user_model().objects.bulk_create(bulk_users)
            Profile.objects.bulk_create(bulk_profiles)

            # bulk create m2m
            Profile.org_units.through.objects.bulk_create(bulk_org_units, ignore_conflicts=True)
            Team.users.through.objects.bulk_create(bulk_teams, ignore_conflicts=True)
            get_user_model().user_permissions.through.objects.bulk_create(bulk_permissions, ignore_conflicts=True)
            Profile.editable_org_unit_types.through.objects.bulk_create(
                bulk_org_units_editable_types, ignore_conflicts=True
            )
            Profile.user_roles.through.objects.bulk_create(bulk_user_roles, ignore_conflicts=True)
            Profile.projects.through.objects.bulk_create(bulk_projects, ignore_conflicts=True)
            get_user_model().groups.through.objects.bulk_create(bulk_user_groups, ignore_conflicts=True)

            # save the instance, but filter out all sensitive data like password
            if validated_data.get("file", None):
                validated_data["file"] = self._filter_out_sensitive_data(validated_data["file"])

            instance = super().create(validated_data)

        if email_invitations:
            self._send_bulk_email_invitations(email_invitations)

        return instance, bulk_users, bulk_profiles
