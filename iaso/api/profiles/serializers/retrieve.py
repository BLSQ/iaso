from django.conf import settings
from django.contrib.auth import get_user_model
from phonenumbers.phonenumberutil import region_code_for_number
from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import Account, DataSource, OrgUnit, Profile, Project, SourceVersion, UserRole


class RelatedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "app_id", "color"]


class NestedDataSourceSerializer(serializers.ModelSerializer):
    """
    Mimic DataSource as_dict method
    I removed the versions as it doesn't make any sense to have it in there (this nested serializer is used in the related version serializer)
    """

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    url = serializers.CharField(source="credentials__url", read_only=True)
    # versions = serializers.SerializerMethodField()

    class Meta:
        model = DataSource
        fields = [
            "name",
            "description",
            "id",
            "url",
            "created_at",
            "updated_at",
            # "versions",
            "tree_config_status_fields",
        ]

    # def get_versions(self, obj):
    #     versions = SourceVersion.objects.filter(data_source_id=obj.id)
    #     return [v.as_dict_without_data_source() for v in versions]


class NestedDefaultVersionSerializer(serializers.ModelSerializer):
    """
    Mimic SourceVersion as_dict method
    """

    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    data_source = NestedDataSourceSerializer(read_only=True)

    class Meta:
        model = SourceVersion
        fields = ["data_source", "number", "description", "id", "created_at", "updated_at"]


class NestedDefaultVersionExtendedSerializer(NestedDefaultVersionSerializer):
    pass


class NestedAccountSerializer(serializers.ModelSerializer):
    """
    Mimic account as_dict method
    """

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
    """
    Mimic UserRole as_dict method
    """

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
    """
    Mimics project as_dict method
    """

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
    first_name = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    user_permissions = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(source="user.is_staff", read_only=True)
    is_superuser = serializers.BooleanField(source="user.is_superuser", read_only=True)
    user_roles = serializers.PrimaryKeyRelatedField(source="get_ordered_user_roles", many=True, read_only=True)
    user_roles_permissions = NestedUserRoleSerializer(many=True, read_only=True, source="get_ordered_user_roles")

    country_code = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source="phone_number.as_e164", read_only=True)

    projects = NestedProjectSerializer(many=True, read_only=True, source="get_ordered_projects")

    other_accounts = NestedAccountSerializer(
        many=True, read_only=True, source="user.tenant_user.get_other_accounts"
    )  # todo: Account as_dict

    editable_org_unit_type_ids = serializers.SerializerMethodField()
    user_roles_editable_org_unit_type_ids = serializers.ListField(
        source="get_user_roles_editable_org_unit_type_ids", read_only=True
    )
    account = NestedAccountExtendedSerializer(read_only=True)  # todo : Account.as_small_dict
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

    # todo : cache this ?
    def _get_user_infos(self, obj):
        user = obj.user
        if hasattr(user, "tenant_user") and user.tenant_user:
            return user.tenant_user.main_user
        return user

    def get_user_name(self, obj):
        return self._get_user_infos(obj).username

    def get_last_name(self, obj):
        return self._get_user_infos(obj).last_name

    def get_first_name(self, obj):
        return self._get_user_infos(obj).first_name

    def get_email(self, obj):
        return self._get_user_infos(obj).email

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

    def get_country_code(self, obj):
        return region_code_for_number(obj.phone_number).lower() if obj.phone_number else None

    def get_editable_org_unit_type_ids(self, obj):
        try:
            editable_org_unit_type_ids = obj.annotated_editable_org_unit_types_ids
        except AttributeError:
            editable_org_unit_type_ids = [out.pk for out in obj.editable_org_unit_types.all()]

        return editable_org_unit_type_ids
