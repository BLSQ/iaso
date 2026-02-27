from phonenumbers import region_code_for_number
from rest_framework import serializers

from iaso.api.profiles.serializers.retrieve import NestedOrgUnitSerializer
from iaso.models import Profile, Project, UserRole


class RelatedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "color"]


class NestedUserRoleSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ["id", "name"]

    def get_name(self, obj):
        head, sep, tail = obj.group.name.partition("_")
        return tail if sep else obj.group.name


class ProfileListSerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField(read_only=True)
    user_name = serializers.SerializerMethodField(read_only=True)
    last_name = serializers.SerializerMethodField(read_only=True)
    email = serializers.SerializerMethodField(read_only=True)

    country_code = serializers.SerializerMethodField()
    phone_number = serializers.CharField(source="phone_number.as_e164", read_only=True)

    editable_org_unit_type_ids = serializers.SerializerMethodField()
    user_roles_editable_org_unit_type_ids = serializers.ReadOnlyField(
        source="get_user_roles_editable_org_unit_type_ids"
    )
    user_roles = NestedUserRoleSerializer(source="get_ordered_user_roles", many=True, read_only=True)
    projects = RelatedProjectSerializer(many=True, read_only=True)
    user_permissions = serializers.SerializerMethodField()
    is_staff = serializers.BooleanField(source="user.is_staff", read_only=True)
    is_superuser = serializers.BooleanField(source="user.is_superuser", read_only=True)
    org_units = NestedOrgUnitSerializer(many=True, source="get_ordered_org_units")

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
            "user_roles",
            "color",
            "projects",
            "user_permissions",
            "is_staff",
            "is_superuser",
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

    def get_country_code(self, obj):
        return region_code_for_number(obj.phone_number).lower() if obj.phone_number else None

    def get_editable_org_unit_type_ids(self, obj):
        try:
            editable_org_unit_type_ids = obj.annotated_editable_org_unit_types_ids
        except AttributeError:
            editable_org_unit_type_ids = [out.pk for out in obj.editable_org_unit_types.all()]

        return editable_org_unit_type_ids

    def get_user_permissions(self, obj):
        return list(obj.user.user_permissions.filter(codename__startswith="iaso_").values_list("codename", flat=True))
