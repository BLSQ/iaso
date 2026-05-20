import logging

import django.core.exceptions as django_exceptions
import phonenumbers

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import Permission, User
from django.contrib.auth.password_validation import validate_password
from django.core.validators import FileExtensionValidator
from django.db import transaction
from rest_framework import serializers
from rest_framework.fields import CurrentUserDefault
from rest_framework.relations import SlugRelatedField
from rest_framework.validators import UniqueValidator

from iaso.api.bulk_create_users.mixin import BulkCreateUserSerializerFileMixin
from iaso.api.bulk_create_users.permissions import has_only_user_managed_permission
from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import (
    AccountPrefixedSlugRelatedField,
    PrimaryKeyRelatedFieldFromJSON,
    SlugOrPrimaryKeyRelatedField,
)
from iaso.api.common.validators import FileTypeValidator
from iaso.api.validation_workflows.serializers.common import CurrentAccountDefault
from iaso.models import BulkCreateUserFile, OrgUnit, OrgUnitType, Profile, Project, Team, UserRole
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
        slug_field="name", queryset=OrgUnit.objects.none(), required=False, many=True, allow_null=True, allow_empty=True
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
        password = attrs.get("password")
        if not attrs.get("email") and not password:
            raise serializers.ValidationError("Either password or email required for user creation")

        if (
            not attrs.get("orgunit")
            and not attrs.get("orgunit__source_ref")
            and has_only_user_managed_permission(self.context["request"].user)
        ):
            raise serializers.ValidationError(
                f"A User with {CORE_USERS_MANAGED_PERMISSION.full_name()} permission must create users with OrgUnits"
            )

        if password:
            account = self.context["request"].user.iaso_profile.account
            if account.enforce_password_validation:
                user = get_user_model()(
                    username=attrs.get("username", ""),
                    email=attrs.get("email", ""),
                    first_name=attrs.get("first_name", ""),
                    last_name=attrs.get("last_name", ""),
                )
                try:
                    validate_password(password=password, user=user)
                except django_exceptions.ValidationError as e:
                    raise serializers.ValidationError({"password": e.messages})

        return attrs

    def __init__(self, *args, **kwargs):
        default_permissions = kwargs.pop("default_permissions", None)
        default_projects = kwargs.pop("default_projects", None)
        default_user_roles = kwargs.pop("default_user_roles", None)
        default_profile_language = kwargs.pop("default_profile_language", None)
        default_organization = kwargs.pop("default_organization", None)
        default_org_units = kwargs.pop("default_org_units", None)
        default_teams = kwargs.pop("default_teams", None)
        qs_cache = kwargs.pop("qs_cache", {})

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
        if qs_cache.get("permissions", None):
            self.fields["permissions"].child_relation.queryset = qs_cache.get("permissions")
        else:
            self.fields["permissions"].child_relation.queryset = Permission.objects.filter(
                codename__in=importer_user.iaso_profile.account.permissions_from_active_modules
            )

        if qs_cache.get("user_roles", None):
            self.fields["user_roles"].child_relation.queryset = qs_cache.get("user_roles")
        else:
            self.fields["user_roles"].child_relation.queryset = UserRole.objects.filter(
                account=importer_user.iaso_profile.account
            )

        if qs_cache.get("teams", None):
            self.fields["teams"].child_relation.queryset = qs_cache.get("teams")
        else:
            self.fields["teams"].child_relation.queryset = Team.objects.filter_for_user(importer_user)

        if qs_cache.get("editable_org_unit_types", None):
            self.fields["editable_org_unit_types"].child_relation.queryset = qs_cache.get("editable_org_unit_types")
        else:
            self.fields["editable_org_unit_types"].child_relation.queryset = OrgUnitType.objects.prefetch_related(
                "projects__account"
            ).filter(projects__account=importer_user.iaso_profile.account)

        if qs_cache.get("projects", None):
            self.fields["projects"].child_relation.queryset = qs_cache["projects"]
        else:
            if request.user.iaso_profile.projects_ids and has_only_user_managed_permission(importer_user):
                available_projects = Project.objects.filter(
                    account=request.user.iaso_profile.account
                ).filter_on_user_projects(importer_user)
            else:
                available_projects = Project.objects.filter(account=request.user.iaso_profile.account)
            self.fields["projects"].child_relation.queryset = available_projects

        if qs_cache.get("orgunit", None):
            self.fields["orgunit"].child_relation.queryset = qs_cache.get("orgunit")
        else:
            self.fields["orgunit"].child_relation.queryset = OrgUnit.objects.filter_for_user_and_app_id(importer_user)

        if qs_cache.get("orgunit__source_ref", None):
            self.fields["orgunit__source_ref"].child_relation.queryset = qs_cache.get("orgunit__source_ref")
        else:
            self.fields["orgunit__source_ref"].child_relation.queryset = OrgUnit.objects.filter_for_user_and_app_id(
                importer_user
            ).filter(version_id=importer_user.iaso_profile.account.default_version_id)

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
            email=validated_data.get("email", "") or "",
            first_name=validated_data.get("first_name", "") or "",
            last_name=validated_data.get("last_name", "") or "",
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
            phone_number=validated_data.get("phone_number", "") or "",
        )

        return {
            "user_model": user_model,
            "profile": profile,
            "send_invitation": user_model if send_invitation else None,
            "org_units": list(set(validated_data.get("orgunit", []) + validated_data.get("orgunit__source_ref", []))),
            "teams": validated_data.get("teams", []),
            "permissions": validated_data.get("permissions", []),
            "org_units_editable_types": validated_data.get("editable_org_unit_types", []),
            "user_roles": validated_data.get("user_roles", []),
            "projects": validated_data.get("projects", []),
        }


class BulkCreateUserSerializer(BulkCreateUserSerializerFileMixin, ModelSerializer):
    default_permissions = PrimaryKeyRelatedFieldFromJSON(
        many=True, allow_null=True, queryset=Permission.objects.all(), allow_empty=True, write_only=True, required=False
    )
    default_projects = PrimaryKeyRelatedFieldFromJSON(
        many=True, allow_null=True, queryset=Project.objects.none(), allow_empty=True, write_only=True, required=False
    )
    default_user_roles = PrimaryKeyRelatedFieldFromJSON(
        many=True, allow_null=True, queryset=UserRole.objects.none(), allow_empty=True, write_only=True, required=False
    )
    default_org_units = PrimaryKeyRelatedFieldFromJSON(
        many=True, allow_null=True, queryset=OrgUnit.objects.none(), allow_empty=True, write_only=True, required=False
    )
    default_teams = PrimaryKeyRelatedFieldFromJSON(
        many=True, allow_null=True, queryset=Team.objects.none(), allow_empty=True, write_only=True, required=False
    )

    account = serializers.HiddenField(default=CurrentAccountDefault(), write_only=True)
    created_by = serializers.HiddenField(default=CurrentUserDefault(), write_only=True)

    class Meta:
        model = BulkCreateUserFile
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
                    FileTypeValidator(
                        allowed_mimetypes=[
                            "text/csv",
                            "text/plain",
                            "application/vnd.ms-excel",
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        ]
                    ),
                    FileExtensionValidator(allowed_extensions=["csv", "xlsx", "xls"]),
                ],
            },
            "default_profile_language": {
                "write_only": True,
            },
            "default_organization": {"write_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        importer_user = request.user
        importer_account = request.user.iaso_profile.account

        self.dialect = None

        # init querysets for primary key related fields

        # default projects
        if has_only_user_managed_permission(importer_user):
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

    def create(self, validated_data):
        validation_errors = []

        items = []

        # we do that so we avoid the BulkCreateItemSerializer serializer to hit the db every init for the querysets in m2m fields
        account = self.context["request"].user.iaso_profile.account

        if self.context["request"].user.iaso_profile.projects_ids and has_only_user_managed_permission(
            self.context["request"].user
        ):
            available_projects = Project.objects.filter(account=account).filter_on_user_projects(
                self.context["request"].user
            )
        else:
            available_projects = Project.objects.filter(account=account)

        # to avoid hitting the DB everytime in the BulkCreateItemSerializer __init__ method
        qs_cache = {
            "permissions": Permission.objects.filter(codename__in=account.permissions_from_active_modules),
            "user_roles": UserRole.objects.filter(account=account),
            "teams": Team.objects.filter_for_user(self.context["request"].user),
            "editable_org_unit_types": OrgUnitType.objects.prefetch_related("projects__account").filter(
                projects__account=account
            ),
            "projects": available_projects,
            "orgunit": OrgUnit.objects.filter_for_user_and_app_id(self.context["request"].user),
            "orgunit__source_ref": OrgUnit.objects.filter_for_user_and_app_id(self.context["request"].user).filter(
                version_id=account.default_version_id
            ),
        }

        for idx, row in self.get_data_from_file(validated_data["file"]):
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
                qs_cache=qs_cache,
            )
            if serializer.is_valid():
                items.append(serializer.save())
            else:
                validation_errors.append({"row": idx + 1, "details": serializer.errors})

        if validation_errors:
            raise serializers.ValidationError({"file_content": validation_errors})

        # bulk create data
        with transaction.atomic():
            users = get_user_model().objects.bulk_create([item["user_model"] for item in items])

            profiles = Profile.objects.bulk_create([item["profile"] for item in items])

            # bulk create m2m

            bulk_org_units = []
            bulk_teams = []
            bulk_permissions = []
            bulk_org_units_editable_types = []
            bulk_user_roles = []
            bulk_projects = []
            bulk_user_groups = []
            email_invitations = [item["send_invitation"] for item in items if item["send_invitation"]]

            for i, item in enumerate(items):
                profile = profiles[i]
                user = users[i]

                bulk_org_units.extend(
                    [
                        Profile.org_units.through(
                            profile_id=profile.id,
                            orgunit_id=ou.id,
                        )
                        for ou in item["org_units"]
                    ]
                )

                bulk_permissions.extend(
                    [
                        get_user_model().user_permissions.through(user_id=user.id, permission_id=permission.id)
                        for permission in item["permissions"]
                    ]
                )

                bulk_teams.extend([Team.users.through(team_id=team.id, user_id=user.id) for team in item["teams"]])

                bulk_projects.extend(
                    [
                        Profile.projects.through(project_id=project.id, profile_id=profile.id)
                        for project in item["projects"]
                    ]
                )

                bulk_org_units_editable_types.extend(
                    [
                        Profile.editable_org_unit_types.through(profile_id=profile.id, orgunittype_id=ou_type.id)
                        for ou_type in item["org_units_editable_types"]
                    ]
                )

                bulk_user_roles.extend(
                    [
                        Profile.user_roles.through(profile_id=profile.id, userrole_id=user_role.id)
                        for user_role in item["user_roles"]
                    ]
                )

                bulk_user_groups.extend(
                    [
                        get_user_model().groups.through(user_id=user.id, group_id=user_role.group_id)
                        for user_role in item["user_roles"]
                    ]
                )

            Profile.org_units.through.objects.bulk_create(bulk_org_units)
            get_user_model().user_permissions.through.objects.bulk_create(bulk_permissions)

            Team.users.through.objects.bulk_create(bulk_teams)
            Profile.projects.through.objects.bulk_create(bulk_projects)

            Profile.editable_org_unit_types.through.objects.bulk_create(bulk_org_units_editable_types)
            Profile.user_roles.through.objects.bulk_create(bulk_user_roles)

            get_user_model().groups.through.objects.bulk_create(bulk_user_groups)

            # save the instance, but filter out all sensitive data like password
            if validated_data.get("file", None):
                validated_data["file"] = self._filter_out_sensitive_data(validated_data["file"])

            instance = super().create(validated_data)

        if email_invitations:
            self._send_bulk_email_invitations(email_invitations)

        return instance, users, profiles
