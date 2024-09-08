from hat.audit.audit_logger import AuditLogger
from rest_framework import serializers
from django.contrib.auth.models import User
from hat.audit.models import PROFILE_API, Modification
from iaso.models.base import Profile, UserRole
from iaso.models.org_unit import OrgUnit
from iaso.models.project import Project
from django.utils import timezone


# class NestedOrgUnitSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = OrgUnit
#         fields = ["id", "name"]


# class NestedProjectSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Project
#         fields = ["id", "name"]


# class NestedUserRoleSerializer(serializers.ModelSerializer):
#     name = serializers.SerializerMethodField()

#     class Meta:
#         model = UserRole
#         fields = ["id", "name"]

#     def get_name(self, user_role):
#         return user_role.remove_user_role_name_prefix(user_role.group.name)


class NestedUserAuditSerializer(serializers.ModelSerializer):
    user_permissions = serializers.SerializerMethodField()
    # TODO remove this line when soft delete implemented
    deleted_at = serializers.SerializerMethodField()

    class Meta:
        model = User
        # We're serializing the password to be able to determine if it has been changed. but we remove them before saving the log itself
        # DO NOT reuse this serializer if you're going to send the payload to the front-end
        fields = ["id", "username", "first_name", "last_name", "email", "user_permissions", "password", "deleted_at"]

    def get_user_permissions(self, user):
        return [permission.codename for permission in user.user_permissions.all()]

    # TODO delete this method when user soft delete is implemented
    def get_deleted_at(self, user):
        return None


class ProfileAuditFieldsSerializer(serializers.ModelSerializer):
    user = NestedUserAuditSerializer()
    # user_roles = NestedUserRoleSerializer(many=True)
    # projects = NestedProjectSerializer(many=True)
    # org_units = NestedOrgUnitSerializer(many=True)
    # TODO remove this line when soft delete implemented
    deleted_at = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            "account",
            "language",
            "user",
            "user_roles",
            "projects",
            "phone_number",
            "dhis2_id",
            "org_units",
            "home_page",
            "deleted_at",
        ]

    # TODO delete this method when user soft delete is implemented
    def get_deleted_at(self, profile):
        return None


class ProfileAuditSerializer(serializers.ModelSerializer):
    fields = serializers.SerializerMethodField(method_name="get_custom_fields")

    class Meta:
        model = Profile
        fields = ["pk", "fields"]

    def get_custom_fields(self, profile):
        return ProfileAuditFieldsSerializer(profile).data


class ProfileAuditLogger(AuditLogger):
    serializer = ProfileAuditSerializer
    default_source = PROFILE_API

    def log_modification(self, instance, old_data_dump, request_user, source=None):
        source = source if source else self.default_source
        if not old_data_dump:
            old_data_dump = []
        new_value = self.serialize_instance(instance)
        password_updated = (
            old_data_dump[0]["fields"]["user"]["password"] != new_value[0]["fields"]["user"]["password"]
            if old_data_dump
            else True
        )
        if old_data_dump:
            del old_data_dump[0]["fields"]["user"]["password"]
        del new_value[0]["fields"]["user"]["password"]
        new_value[0]["fields"]["user"]["password_updated"] = password_updated
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
        del past_value[0]["fields"]["user"]["password"]
        new_value = self.serialize_instance(instance)
        del new_value[0]["fields"]["user"]["password"]
        now = timezone.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        new_value[0]["fields"]["user"]["deleted_at"] = now
        new_value[0]["fields"]["deleted_at"] = now
        new_value[0]["fields"]["user"]["password_updated"] = False

        Modification.objects.create(
            user=request_user,
            past_value=past_value,
            new_value=new_value,
            content_object=instance,
            source=source,
        )
