from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Profile, Project, UserRole


class RelatedProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]


class NestedUserRoleSerializer(ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ["id", "name"]

    @extend_schema_field(serializers.CharField())
    def get_name(self, obj):
        head, sep, tail = obj.group.name.partition("_")
        return tail if sep else obj.group.name


class ProfileListSerializer(ModelSerializer):
    first_name = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)
    last_name = serializers.SerializerMethodField(read_only=True)
    email = serializers.SerializerMethodField(read_only=True)
    phone_number = serializers.CharField(source="phone_number.as_e164", read_only=True)
    user_roles = NestedUserRoleSerializer(many=True, read_only=True)
    projects = RelatedProjectSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "user_id",
            "first_name",
            "user_name",
            "last_name",
            "email",
            "phone_number",
            "user_roles",
            "projects",
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

    @extend_schema_field(serializers.EmailField)
    def get_email(self, obj):
        return self._get_user_infos(obj).email
