from django.contrib.auth import get_user_model
from django.db.models import Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import OrgUnit, Profile, Project


class NestedProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "app_id", "color"]


class NestedOrgUnitSerializer(ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]
        read_only_fields = fields


class ProfileRetrieveCurrentSerializer(ModelSerializer):
    """
        Mandatory for mobile
        data class ProfileDto(
        @Json(name = "id") val id: String,
        @Json(name = "first_name") val firstName: String,
        @Json(name = "last_name") val lastName: String,
        @Json(name = "user_name") val userName: String,
        @Json(name = "email") val email: String,
        @Json(name = "phone_number") val phoneNumber: String? = null,
        @Json(name = "organization") val organization: String? = null,
    )

    """

    first_name = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(source="user.is_staff", read_only=True)
    is_superuser = serializers.BooleanField(source="user.is_superuser", read_only=True)
    projects = NestedProjectSerializer(many=True, read_only=True)
    org_units = NestedOrgUnitSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "first_name",
            "user_name",
            "last_name",
            "email",
            "permissions",
            "is_staff",
            "is_superuser",
            "language",
            "organization",
            "user_id",
            "phone_number",
            "projects",
            "org_units",
        ]
        read_only_fields = fields

    def _get_user_infos(self, obj):
        user = obj.user
        if hasattr(user, "tenant_user") and user.tenant_user:
            return user.tenant_user.main_user
        return user

    @extend_schema_field(serializers.CharField)
    def get_user_name(self, obj):
        return self._get_user_infos(obj).username

    @extend_schema_field(serializers.CharField(allow_blank=True))
    def get_last_name(self, obj):
        return self._get_user_infos(obj).last_name

    @extend_schema_field(serializers.CharField(allow_blank=True))
    def get_first_name(self, obj):
        return self._get_user_infos(obj).first_name

    @extend_schema_field(serializers.EmailField(allow_blank=True))
    def get_email(self, obj):
        return self._get_user_infos(obj).email

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_permissions(self, obj):
        permissions_active_modules = [p.codename for p in obj.account.permissions_from_active_modules]

        user_group_permissions = [
            permission.split(".")[1]
            for permission in obj.user.get_group_permissions()
            if permission.split(".")[1].startswith("iaso_") and permission.split(".")[1] in permissions_active_modules
        ]
        user_permissions = list(
            obj.user.user_permissions.filter(
                Q(codename__startswith="iaso_") & Q(codename__in=permissions_active_modules)
            ).values_list("codename", flat=True)
        )
        all_permissions = user_group_permissions + user_permissions
        permissions = list(set(all_permissions))
        return permissions


class ProfileUserFallbackRetrieveSerializer(ModelSerializer):
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

    @extend_schema_field({"type": "array", "items": {}})
    def get_projects(self, obj):
        # constant field : intentional
        return []

    @extend_schema_field(OpenApiTypes.NONE)
    def get_account(self, obj):
        # constant field : intentional
        return None
