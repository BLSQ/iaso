from django.utils import timezone
from rest_framework import serializers

from hat.audit.audit_logger import AuditLogger
from hat.audit.models import PROFILE_API, Modification
from iaso.models.base import Profile


class ProfileAuditSerializer(serializers.ModelSerializer):
    fields = serializers.SerializerMethodField(method_name="get_custom_fields")

    class Meta:
        model = Profile
        fields = ["pk", "fields"]

    def get_custom_fields(self, profile):
        return self.ProfileAuditFieldsSerializer(profile).data

    # This serializer should only be used with ProfileAuditSerializer
    class ProfileAuditFieldsSerializer(serializers.ModelSerializer):
        user = serializers.SerializerMethodField()
        username = serializers.SerializerMethodField()
        last_name = serializers.SerializerMethodField()
        first_name = serializers.SerializerMethodField()
        email = serializers.SerializerMethodField()
        user_permissions = serializers.SerializerMethodField()
        password = serializers.SerializerMethodField()
        # TODO remove this line when soft delete implemented
        deleted_at = serializers.SerializerMethodField()

        class Meta:
            model = Profile
            fields = [
                "account",
                "language",
                "user",
                "email",
                "organization",
                "first_name",
                "last_name",
                "username",
                "user_roles",
                "user_permissions",
                # We're serializing the password to be able to determine if it has been changed. but we remove them before saving the log itself
                "password",
                "projects",
                "phone_number",
                "dhis2_id",
                "org_units",
                "home_page",
                "deleted_at",
            ]

        # TODO delete this method when User soft delete is implemented
        def get_deleted_at(self, profile):
            return None

        def get_user(self, profile):
            return profile.user.pk

        def get_email(self, profile):
            return profile.user.email

        def get_username(self, profile):
            return profile.user.username

        def get_first_name(self, profile):
            return profile.user.first_name

        def get_last_name(self, profile):
            return profile.user.last_name

        def get_user_permissions(self, profile):
            return [permission.codename for permission in profile.user.user_permissions.all()]

        # THIS SERIALIZER SHOULD ONLY BE USED WITH PROFILEAUDITLOGGER
        # The logger will compare the old and new password then delete the field and return a boolean indicating whether the password changed or not
        def get_password(self, profile):
            return profile.user.password


class ProfileAuditLogger(AuditLogger):
    serializer = ProfileAuditSerializer
    default_source = PROFILE_API

    def log_modification(self, instance, old_data_dump, request_user, source=None):
        source = source if source else self.default_source
        if not old_data_dump:
            old_data_dump = []
        new_value = self.serialize_instance(instance)
        password_updated = (
            old_data_dump[0]["fields"]["password"] != new_value[0]["fields"]["password"] if old_data_dump else True
        )
        if old_data_dump:
            del old_data_dump[0]["fields"]["password"]
        del new_value[0]["fields"]["password"]
        new_value[0]["fields"]["password_updated"] = password_updated
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
        del past_value[0]["fields"]["password"]
        new_value = self.serialize_instance(instance)
        del new_value[0]["fields"]["password"]
        now = timezone.now().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        new_value[0]["fields"]["deleted_at"] = now
        new_value[0]["fields"]["password_updated"] = False

        Modification.objects.create(
            user=request_user,
            past_value=past_value,
            new_value=new_value,
            content_object=instance,
            source=source,
        )
