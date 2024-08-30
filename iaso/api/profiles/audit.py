from hat.audit.audit_logger import AuditLogger
from rest_framework import serializers
from django.contrib.auth.models import User
from hat.audit.models import PROFILE_API, Modification
from iaso.models.base import Profile, UserRole
from iaso.models.org_unit import OrgUnit
from iaso.models.project import Project


class NestedOrgUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]


class NestedProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name"]


class NestedUserRoleSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ["id", "name"]

    def get_name(self, user_role):
        return user_role.remove_user_role_name_prefix(user_role.group.name)


class NestedUserAuditSerializer(serializers.ModelSerializer):
    user_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        # We're serializing the password to be able to determine if it has been changed. but we remove them before saving the log itself
        # DO NOT reuse this serializer if you're going to send the payload to the front-end
        fields = ["id", "username", "first_name", "last_name", "email", "user_permissions", "password"]

    def get_user_permissions(self, user):
        return [permission.codename for permission in user.user_permissions.all()]


class ProfileAuditSerializer(serializers.ModelSerializer):
    user = NestedUserAuditSerializer()
    user_roles = NestedUserRoleSerializer(many=True)
    projects = NestedProjectSerializer(many=True)
    org_units = NestedOrgUnitSerializer(many=True)

    class Meta:
        model = Profile
        fields = ["language", "user", "user_roles", "projects", "phone_number", "dhis2_id", "org_units", "home_page"]


class ProfileAuditLogger(AuditLogger):
    serializer = ProfileAuditSerializer
    default_source = PROFILE_API

    def log_modification(self, instance, old_data_dump, request_user, source=None):
        source = source if source else self.default_source
        if not old_data_dump:
            old_data_dump = []
        new_value = self.serialize_instance(instance)
        password_updated = (
            old_data_dump[0]["user"]["password"] != new_value[0]["user"]["password"] if old_data_dump else True
        )
        if old_data_dump:
            del old_data_dump[0]["user"]["password"]
        del new_value[0]["user"]["password"]
        new_value[0]["user"]["password_updated"] = password_updated
        Modification.objects.create(
            user=request_user,
            past_value=old_data_dump,
            new_value=new_value,
            content_object=instance,
            source=source,
        )

    def log_hard_deletion(self, instance, request_user, source=None):
        source = source if source else self.default_source
        past_value = self.serialize_instance(instance)
        del past_value[0]["user"]["password"]
        Modification.objects.create(
            user=request_user,
            past_value=past_value,
            new_value=[],
            content_object=instance,
            source=source,
        )
