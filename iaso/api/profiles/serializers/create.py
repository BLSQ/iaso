from django.contrib.auth.models import Permission
from django.utils.crypto import get_random_string
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer_fields import CountryAwarePhoneNumberField
from iaso.models import OrgUnit, OrgUnitType, Profile, Project, TenantUser, UserRole
from iaso.models.tenant_users import UserCreationData, UsernameAlreadyExistsError


class ProfileCreateSerializer(ModelSerializer):
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
        allow_empty=True,
        allow_null=True,
        many=True,
        queryset=UserRole.objects.none(),
        required=False,
        error_messages={"does_not_exist": _("One or more user roles do not belong to the provided account.")},
    )
    projects = serializers.PrimaryKeyRelatedField(
        allow_empty=True, allow_null=True, queryset=Project.objects.none(), required=False, many=True
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        account = self._get_account()
        if account:
            self.fields["projects"].child_relation.queryset = Project.objects.filter(account=account)
            self.fields["user_roles"].child_relation.queryset = UserRole.objects.filter(account=account)

            module_permission_codenames = {perm.codename for perm in account.permissions_from_active_modules}
            self.fields["user_permissions"].child_relation.queryset = Permission.objects.filter(
                codename__in=list(module_permission_codenames)
            )

    def _get_account(self):
        request = self.context["request"]
        user = getattr(request, "user", None)
        current_profile = getattr(user, "iaso_profile", None)
        return getattr(current_profile, "account", None)

    def validate_dhis2_id(self, value):
        return value or None

    def validate(self, data):
        self._validate_password_if_no_send_email(data)
        return data

    @staticmethod
    def _validate_password_if_no_send_email(data):
        if not data.get("password") and not data.get("send_email_invitation"):
            raise serializers.ValidationError({"password": _("This field is required.")})

        if data.get("send_email_invitation") and not data.get("email"):
            raise serializers.ValidationError({"email": _("This field is required.")})

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
