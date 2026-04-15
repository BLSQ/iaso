from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import CountryAwarePhoneNumberField
from iaso.models import OrgUnit, OrgUnitType, Profile, Project, TenantUser, UserRole


class BaseProfileUpdateSerializer(ModelSerializer):
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

    country_code = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)

    projects = serializers.PrimaryKeyRelatedField(
        allow_empty=True, allow_null=True, queryset=Project.objects.none(), required=False, many=True
    )
    user_permissions = serializers.SlugRelatedField(
        slug_field="codename", many=True, queryset=Permission.objects.none(), required=False
    )

    user_roles = serializers.PrimaryKeyRelatedField(
        allow_empty=True,
        allow_null=True,
        many=True,
        queryset=UserRole.objects.none(),
        required=False,
        error_messages={"does_not_exist": _("One or more user roles do not belong to the provided account.")},
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        profile = self.instance
        if profile is not None:
            self.fields["projects"].child_relation.queryset = Project.objects.filter(account_id=profile.account_id)
            self.fields["user_roles"].child_relation.queryset = UserRole.objects.filter(account=profile.account)
            module_permission_codenames = {perm.codename for perm in profile.account.permissions_from_active_modules}
            self.fields["user_permissions"].child_relation.queryset = Permission.objects.filter(
                codename__in=list(module_permission_codenames)
            )

    def validate_dhis2_id(self, value):
        return value or None

    def _get_account(self):
        request = self.context["request"]
        user = getattr(request, "user", None)
        current_profile = getattr(user, "iaso_profile", None)
        return getattr(current_profile, "account", None)

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
