from django.contrib.auth.models import Permission
from django.utils.crypto import get_random_string
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.profiles.serializers.common import CountryAwarePhoneNumberField
from iaso.models import OrgUnit, OrgUnitType, Profile, Project, TenantUser, UserRole
from iaso.models.tenant_users import UserCreationData, UsernameAlreadyExistsError
from iaso.utils.colors import COLOR_FORMAT_ERROR, validate_hex_color


class ProfileCreateSerializer(serializers.ModelSerializer):
    # output only
    id = serializers.IntegerField(read_only=True)

    # input only
    email = serializers.EmailField(required=False, allow_blank=True, write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    last_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True, allow_null=True)
    send_email_invitation = serializers.BooleanField(default=False, write_only=True)
    user_name = serializers.CharField(required=True, write_only=True)
    user_roles = serializers.PrimaryKeyRelatedField(
        allow_empty=True, allow_null=True, many=True, queryset=UserRole.objects.all(), required=False
    )
    projects = serializers.PrimaryKeyRelatedField(
        allow_empty=True, allow_null=True, queryset=Project.objects.all(), required=False, many=True
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

    user_permissions = serializers.SlugRelatedField(
        slug_field="codename", many=True, queryset=Permission.objects.all(), required=False
    )

    country_code = serializers.CharField(required=False, allow_blank=True, write_only=True)
    phone_number = CountryAwarePhoneNumberField(required=False)

    class Meta:
        model = Profile
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "password",
            "send_email_invitation",
            "user_name",
            "language",
            "home_page",
            "organization",
            "dhis2_id",
            "color",
            "user_roles",
            "projects",
            "org_units",
            "editable_org_unit_type_ids",
            "user_permissions",
            "phone_number",
            "country_code",
        ]

    def _get_account(self):
        request = self.context["request"]
        current_profile = request.user.iaso_profile
        return current_profile.account

    def validate_color(self, value):
        # todo : we should make a ColorFieldSerializer for this
        try:
            return validate_hex_color(value)
        except ValueError:
            raise serializers.ValidationError(COLOR_FORMAT_ERROR)

    def validate_dhis2_id(self, value):
        return value or None

    def validate_user_roles(self, data):
        # should we raise an error if not unique ?
        return set(data)

    def _validate_user_roles(self, data):
        # we get the account
        account = self._get_account()
        user_roles = data.get("user_roles")

        if not user_roles:
            return

        if UserRole.objects.filter(pk__in=[user_role.pk for user_role in user_roles]).exclude(account=account).exists():
            raise serializers.ValidationError(
                {"user_roles": _("One or more user roles do not belong to the provided account.")}
            )

    def validate(self, data):
        self._validate_password_if_no_send_email(data)
        self._validate_user_roles(data)
        data["projects"] = self._validate_projects(data)
        data["user_permissions"] = self._validate_user_permissions(data)
        return data

    @staticmethod
    def _validate_password_if_no_send_email(data):
        if not data.get("password") and not data.get("send_email_invitation"):
            raise serializers.ValidationError({"password": _("This field is required.")})

        if data.get("send_email_invitation") and not data.get("email"):
            raise serializers.ValidationError({"email": _("This field is required.")})

    def _validate_user_permissions(self, data):
        account = self._get_account()
        user_permissions = data.get("user_permissions")

        if not account or not user_permissions:
            return []

        module_permission_codenames = {perm.codename for perm in account.permissions_from_active_modules}

        valid_permissions = [perm for perm in user_permissions if perm.codename in module_permission_codenames]

        return valid_permissions

    def _validate_projects(self, data):
        account = self._get_account()
        projects = data.get("projects", None) or []

        if not account and not projects:
            return None

        return Project.objects.filter(pk__in=[project.pk for project in projects], account=self._get_account())

    def set_user_password(self, user, password, send_email_invitation, email):
        if password:
            user.set_password(password)
            user.save()
        elif send_email_invitation:
            random_password = get_random_string(32)
            user.set_password(random_password)
            user.save()

    def create(self, validated_data):
        account = self._get_account()

        # retrieve non-model fields
        non_model_fields = [
            "user_name",
            "country_code",
            "email",
            "first_name",
            "last_name",
            "password",
            "send_email_invitation",
            "user_permissions",
        ]
        user_name = validated_data.get("user_name")
        email = validated_data.get("email", "")
        first_name = validated_data.get("first_name", "")
        last_name = validated_data.get("last_name", "")

        try:
            # Currently, the `account` is always the same in the UI.
            # This means that we'll never get back a `tenant_main_user` here - at least for the moment.
            # Yet we keep `create_user_or_tenant_user()` here to avoid repeating part of its logic.
            new_user, tenant_main_user, tenant_account_user = TenantUser.objects.create_user_or_tenant_user(
                data=UserCreationData(
                    username=user_name, email=email, first_name=first_name, last_name=last_name, account=account
                )
            )

        except UsernameAlreadyExistsError as e:
            raise serializers.ValidationError({"user_name": [e.message]})

        user = new_user or tenant_account_user

        profile = super().create(
            {
                **{k: v for k, v in validated_data.items() if k not in non_model_fields},
                "account_id": account.id,
                "user_id": user.id,
            }
        )

        return profile

    def to_representation(self, instance):
        """
        Legacy compatibility : imho those fields shouldn't be there in the create response.
        And if so, maybe it should be method/properties on the Profile itself?
        """

        data = super().to_representation(instance)

        user = instance.user

        data["user_name"] = user.username if user else None
        data["email"] = user.email if user else None
        data["first_name"] = user.first_name if user else None
        data["last_name"] = user.last_name if user else None
        data["is_superuser"] = user.is_superuser if user else False

        return data
