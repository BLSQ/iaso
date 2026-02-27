from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.profiles.serializers.common import CountryAwarePhoneNumberField
from iaso.models import OrgUnit, OrgUnitType, Profile, Project, TenantUser, UserRole
from iaso.utils.colors import COLOR_FORMAT_ERROR, validate_hex_color


class BaseProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["language", "home_page"]


class ProfileMeUpdateSerializer(BaseProfileUpdateSerializer):
    pass


class ProfileUpdateSerializer(BaseProfileUpdateSerializer):
    _org_units_unchanged = False

    email = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    last_name = serializers.CharField(required=False, allow_blank=True, write_only=True)

    user_name = serializers.CharField(required=False, write_only=True)

    country_code = serializers.CharField(write_only=True, required=False)

    projects = serializers.PrimaryKeyRelatedField(
        allow_empty=True, allow_null=True, queryset=Project.objects.all(), required=False, many=True
    )
    user_permissions = serializers.SlugRelatedField(
        slug_field="codename", many=True, queryset=Permission.objects.all(), required=False
    )

    user_roles = serializers.PrimaryKeyRelatedField(
        allow_empty=True, allow_null=True, many=True, queryset=UserRole.objects.all(), required=False
    )

    org_units = serializers.PrimaryKeyRelatedField(
        allow_empty=True, allow_null=True, many=True, queryset=OrgUnit.objects.all(), required=False
    )
    editable_org_unit_type_ids = serializers.PrimaryKeyRelatedField(
        source="editable_org_unit_types",
        allow_empty=True,
        allow_null=True,
        queryset=OrgUnitType.objects.all(),
        required=False,
        many=True,
    )

    phone_number = CountryAwarePhoneNumberField(required=False, allow_blank=True)

    class Meta(BaseProfileUpdateSerializer.Meta):
        model = Profile
        fields = BaseProfileUpdateSerializer.Meta.fields + [
            "first_name",
            "organization",
            "last_name",
            "user_name",
            "email",
            "color",
            "phone_number",
            "country_code",
            "dhis2_id",
            "user_permissions",
            "org_units",
            "editable_org_unit_type_ids",
            "projects",
            "user_roles",
        ]

    def validate_dhis2_id(self, value):
        return value or None

    def validate_user_roles(self, data):
        return set(data)

    def _get_account(self):
        request = self.context["request"]
        current_profile = request.user.iaso_profile
        return current_profile.account

    def _validate_projects(self, data):
        profile = self.instance
        projects = data.get("projects", None) or []

        if not profile.account_id and not projects:
            return None

        return Project.objects.filter(pk__in=[project.pk for project in projects], account=profile.account_id)

    def _validate_user_permissions(self, data):
        account = self._get_account()
        user_permissions = data.get("user_permissions")

        if not account or not user_permissions:
            return []

        module_permission_codenames = {perm.codename for perm in account.permissions_from_active_modules}

        valid_permissions = [perm for perm in user_permissions if perm.codename in module_permission_codenames]

        return valid_permissions

    def _validate_user_roles(self, data):
        account = self._get_account()
        user_roles = data.get("user_roles")

        if not user_roles:
            return

        if UserRole.objects.filter(pk__in=[user_role.pk for user_role in user_roles]).exclude(account=account).exists():
            raise serializers.ValidationError(
                {"user_roles": _("One or more user roles do not belong to the provided account.")}
            )

    def validate(self, data):
        self._validate_user_roles(data)
        data["projects"] = self._validate_projects(data)
        data["user_permissions"] = self._validate_user_permissions(data)
        return data

    def validate_color(self, value):
        # todo : we should make a ColorFieldSerializer for this
        try:
            return validate_hex_color(value)
        except ValueError:
            raise serializers.ValidationError(COLOR_FORMAT_ERROR)

    def validate_org_units(self, org_units):
        profile = self.instance

        existing_ids = set(profile.org_units.values_list("id", flat=True))
        new_ids = {ou.id for ou in org_units}

        # if no change, do nothing
        self._org_units_unchanged = new_ids == existing_ids

        return org_units

    def validate_user_name(self, value):
        user = self.instance.user

        # ok for multi tenant user
        if TenantUser.is_multi_account_user(user):
            return value

        # skip validation if username is unchanged
        if user.username == value:
            return value

        if get_user_model().objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError(_("Username already exists"))

        return value


class ProfileUpdatePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        if not value.strip():
            raise serializers.ValidationError(_("Password cannot be empty."))
        return value

    def validate(self, data):
        if data.get("password", "") != data.get("confirm_password", ""):
            raise serializers.ValidationError(_("Passwords must match."))

        return data
