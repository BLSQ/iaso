from hat.audit.audit_logger import AuditLogger
from rest_framework import serializers
from django.contrib.auth.models import User
from hat.audit.models import PROFILE_API, Modification
from iaso.models.base import Profile


# We only ever serialize in one direction :model --> json
class NestedUserAuditSerializer(serializers.ModelSerializer):
    user_permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "user_permissions"]

    # TODO optimize DB queries
    def get_user_permissions(self, user):
        return [permission.codename for permission in user.user_permissions.all()]


class ProfileAuditSerializer(serializers.ModelSerializer):
    user = NestedUserAuditSerializer()
    user_roles = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ["language", "user", "user_roles", "projects", "phone_number", "dhis2_id", "org_units", "home_page"]

    # TODO optimize DB queries
    def get_user_roles(self, profile):
        return [user_role.remove_user_role_name_prefix(user_role.group.name) for user_role in profile.user_roles.all()]


class ProfileAuditLogger(AuditLogger):
    serializer = ProfileAuditSerializer
    default_source = PROFILE_API

    # TODO handle password
    def log_modification(self, instance, old_data_dump, request_user, source=None):
        source = source if source else self.default_source
        if not old_data_dump:
            old_data_dump = []
        Modification.objects.create(
            user=request_user,
            past_value=old_data_dump,
            new_value=self.serialize_instance(instance),
            content_object=instance,
            source=source,
        )
