from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.utils.crypto import get_random_string
from django.utils.translation import gettext_lazy as _
from phonenumber_field.phonenumber import PhoneNumber
from phonenumbers.phonenumberutil import NumberParseException, region_code_for_number
from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import Account, DataSource, OrgUnit, OrgUnitType, Profile, Project, SourceVersion, TenantUser, UserRole
from iaso.models.tenant_users import UserCreationData, UsernameAlreadyExistsError
from iaso.utils.colors import COLOR_FORMAT_ERROR, validate_hex_color


class RelatedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "app_id", "color"]


class NestedDataSourceSerializer(serializers.ModelSerializer):
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    url = serializers.CharField(source="credentials__url", read_only=True)
    versions = serializers.SerializerMethodField()

    class Meta:
        model = DataSource
        fields = [
            "name",
            "description",
            "id",
            "url",
            "created_at",
            "updated_at",
            "versions",
            "tree_config_status_fields",
        ]

    def get_versions(self, obj):
        versions = SourceVersion.objects.filter(data_source_id=obj.id)
        return [v.as_dict_without_data_source() for v in versions]


class NestedDefaultVersionSerializer(serializers.ModelSerializer):
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    data_source = NestedDataSourceSerializer(read_only=True)

    class Meta:
        model = SourceVersion
        fields = ["data_source", "number", "description", "id", "created_at", "updated_at"]


class NestedDefaultVersionExtendedSerializer(NestedDefaultVersionSerializer):
    pass


class NestedAccountSerializer(serializers.ModelSerializer):
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    feature_flags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="code")
    user_manual_path = serializers.ReadOnlyField(default=settings.USER_MANUAL_PATH)
    forum_path = serializers.ReadOnlyField(default=settings.FORUM_PATH)
    default_version = NestedDefaultVersionSerializer(read_only=True)

    class Meta:
        model = Account
        fields = [
            "name",
            "id",
            "created_at",
            "updated_at",
            "default_version",
            "feature_flags",
            "user_manual_path",
            "forum_path",
            "analytics_script",
        ]


class NestedAccountExtendedSerializer(NestedAccountSerializer):
    class Meta(NestedAccountSerializer.Meta):
        fields = NestedAccountSerializer.Meta.fields + ["modules"]


class NestedUserRoleSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    permissions = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="codename", source="get_iaso_permissions"
    )
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    class Meta:
        model = UserRole
        fields = ["id", "name", "group_id", "permissions", "created_at", "updated_at"]

    def get_name(self, obj):
        head, sep, tail = obj.group.name.partition("_")
        return tail if sep else obj.group.name


class NestedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "app_id", "color"]


class NestedOrgUnitSerializer(serializers.ModelSerializer):
    source = serializers.CharField(source="version.data_source.name", read_only=True)
    source_id = serializers.IntegerField(source="version.data_source_id", read_only=True)

    short_name = serializers.CharField(source="name", read_only=True)

    latitude = serializers.FloatField(source="location.y", read_only=True)
    longitude = serializers.FloatField(source="location.x", read_only=True)
    altitude = serializers.FloatField(source="location.z", read_only=True)

    created_at = TimestampField(read_only=True, source="source_created_at_with_fallback")
    updated_at = TimestampField(read_only=True)

    version = serializers.IntegerField(read_only=True, source="version.number")

    opening_date = serializers.SerializerMethodField()
    closed_date = serializers.SerializerMethodField()

    org_unit_type_name = serializers.CharField(source="org_unit_type.name", read_only=True)
    org_unit_type_depth = serializers.IntegerField(source="org_unit_type.depth", read_only=True)

    has_geo_json = serializers.SerializerMethodField()

    def get_has_geo_json(self, obj):
        return bool(obj.simplified_geom)

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # todo : bit weird considering the DRF logic, hard to document with openAPI and swagger
        # it should be made as a nullable field
        if hasattr(instance, "search_index"):
            representation.update({"search_index": instance.search_index})
        return representation

    class Meta:
        model = OrgUnit
        fields = [
            "name",
            "short_name",
            "id",
            "source",
            "source_id",
            "source_ref",
            "parent_id",
            "org_unit_type_id",
            "org_unit_type_name",
            "org_unit_type_depth",
            "created_at",
            "updated_at",
            "aliases",
            "validation_status",
            "latitude",
            "longitude",
            "altitude",
            "has_geo_json",
            "version",
            "opening_date",
            "closed_date",
        ]

    def get_opening_date(self, obj):
        return obj.opening_date.strftime("%d/%m/%Y") if obj.opening_date else None

    def get_closing_date(self, obj):
        return obj.closed_date.strftime("%d/%m/%Y") if obj.closed_date else None


class ProfileUserFallbackRetrieveSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField(source="id")
    projects = serializers.SerializerMethodField()
    account = serializers.SerializerMethodField()
    user_name = serializers.ReadOnlyField(source="username", default=None)

    class Meta:
        model = get_user_model()
        fields = [
            "first_name",
            "user_name",
            "last_name",
            "email",
            "user_id",
            "projects",
            "is_staff",
            "is_superuser",
            "account",
        ]

    def get_projects(self, obj):
        # constant field : intentional
        return []

    def get_account(self, obj):
        # constant field : intentional
        return None


class ProfileRetrieveSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.tenant_user.main_user.first_name", read_only=True)
    user_name = serializers.CharField(source="user.tenant_user.main_user.username", read_only=True)
    last_name = serializers.CharField(source="user.tenant_user.main_user.last_name", read_only=True)
    email = serializers.EmailField(source="user.tenant_user.main_user.email", read_only=True)
    permissions = serializers.SerializerMethodField()
    user_permissions = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(source="user.is_staff", read_only=True)
    is_superuser = serializers.BooleanField(source="user.is_superuser", read_only=True)
    user_roles = serializers.PrimaryKeyRelatedField(source="get_ordered_user_roles", many=True, read_only=True)
    user_roles_permissions = NestedUserRoleSerializer(many=True, read_only=True, source="get_ordered_user_roles")
    country_code = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source="phone_number.as_e164", read_only=True)
    projects = NestedProjectSerializer(many=True, read_only=True, source="get_ordered_projects")
    other_accounts = NestedAccountSerializer(many=True, read_only=True, source="user.tenant_user.get_other_accounts")
    editable_org_unit_type_ids = serializers.SerializerMethodField()
    user_roles_editable_org_unit_type_ids = serializers.ReadOnlyField(
        source="get_user_roles_editable_org_unit_type_ids"
    )
    account = NestedAccountExtendedSerializer(read_only=True)
    org_units = NestedOrgUnitSerializer(many=True, source="get_ordered_org_units")

    class Meta:
        model = Profile
        fields = [
            "id",
            "first_name",
            "user_name",
            "last_name",
            "email",
            "permissions",
            "user_permissions",
            "is_staff",
            "is_superuser",
            "user_roles",
            "user_roles_permissions",
            "language",
            "organization",
            "user_id",
            "dhis2_id",
            "home_page",
            "phone_number",
            "country_code",
            "projects",
            "other_accounts",
            "editable_org_unit_type_ids",
            "user_roles_editable_org_unit_type_ids",
            "color",
            "account",
            "org_units",
        ]

    def get_country_code(self, obj):
        return region_code_for_number(obj.phone_number).lower() if obj.phone_number else None

    def get_permissions(self, obj):
        user_group_permissions = [
            permission.split(".")[1]
            for permission in obj.user.get_group_permissions()
            if permission.split(".")[1].startswith("iaso_")
        ]
        user_permissions = list(
            obj.user.user_permissions.filter(codename__startswith="iaso_").values_list("codename", flat=True)
        )
        all_permissions = user_group_permissions + user_permissions
        permissions = list(set(all_permissions))
        return permissions

    def get_user_permissions(self, obj):
        return list(obj.user.user_permissions.filter(codename__startswith="iaso_").values_list("codename", flat=True))

    def get_editable_org_unit_type_ids(self, obj):
        try:
            editable_org_unit_type_ids = obj.annotated_editable_org_unit_types_ids
        except AttributeError:
            editable_org_unit_type_ids = [out.pk for out in obj.editable_org_unit_types.all()]

        return editable_org_unit_type_ids


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
    editable_org_unit_types = serializers.PrimaryKeyRelatedField(
        allow_empty=True, allow_null=True, queryset=OrgUnitType.objects.all(), required=False, many=True
    )

    dhis2_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    user_permissions = serializers.SlugRelatedField(
        slug_field="codename", many=True, queryset=Permission.objects.all(), required=False
    )

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
            "editable_org_unit_types",
            "user_permissions",
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
        self._validate_phone_number_and_country(data)
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

    @staticmethod
    def _validate_phone_number_and_country(data):
        phone_number = data.get("phone_number")
        country_code = data.get("country_code")
        number = ""

        if any([phone_number, country_code]) and not all([phone_number, country_code]):
            raise serializers.ValidationError(
                {"phone_number": [_("Both phone number and country code must be provided")]}
            )

        if phone_number and country_code:
            try:
                number = PhoneNumber.from_string(phone_number, region=country_code.upper())
            except NumberParseException:
                raise serializers.ValidationError({"phone_number": _("Invalid phone number format")})

            if not number.is_valid():
                raise serializers.ValidationError({"phone_number": _("Invalid phone number")})

        return number

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


class ProfileListSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.tenant_user.main_user.first_name", read_only=True)
    user_name = serializers.CharField(source="user.tenant_user.main_user.username", read_only=True)
    last_name = serializers.CharField(source="user.tenant_user.main_user.last_name", read_only=True)
    email = serializers.EmailField(source="user.tenant_user.main_user.email", read_only=True)

    country_code = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source="phone_number.as_e164", read_only=True)

    editable_org_unit_type_ids = serializers.SerializerMethodField()
    user_roles_editable_org_unit_type_ids = serializers.ReadOnlyField(
        source="get_user_roles_editable_org_unit_type_ids"
    )

    class Meta:
        model = Profile
        fields = [
            "id",
            "first_name",
            "user_name",
            "last_name",
            "email",
            "language",
            "user_id",
            "phone_number",
            "country_code",
            "editable_org_unit_type_ids",
            "user_roles_editable_org_unit_type_ids",
            "color",
        ]

    def get_country_code(self, obj):
        return region_code_for_number(obj.phone_number).lower() if obj.phone_number else None

    def get_editable_org_unit_type_ids(self, obj):
        try:
            editable_org_unit_type_ids = obj.annotated_editable_org_unit_types_ids
        except AttributeError:
            editable_org_unit_type_ids = [out.pk for out in obj.editable_org_unit_types.all()]

        return editable_org_unit_type_ids
