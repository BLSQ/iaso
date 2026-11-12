from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer, TimestampField
from iaso.models import Device


class NestedUserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
        read_only_fields = ["id", "username"]


class ListDeviceSerializer(ModelSerializer):
    last_synced_at = TimestampField(read_only=True, allow_null=True)
    first_synced_at = TimestampField(read_only=True, allow_null=True)
    last_app_version_id = serializers.CharField(read_only=True, allow_null=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    current_owner = serializers.SerializerMethodField()
    instance_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Device
        fields = [
            "installation_id",
            "last_synced_at",
            "first_synced_at",
            "last_app_version_id",
            "current_owner",
            "instance_count",
            "test_device",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    @extend_schema_field(NestedUserSerializer(allow_null=True))
    def get_current_owner(self, obj: Device) -> dict | None:
        if getattr(obj, "current_owner_id", None):
            return NestedUserSerializer(
                instance={"id": obj.current_owner_id, "username": obj.current_owner_username}
            ).data
        return None


class DetailsDeviceSerializer(ModelSerializer):
    last_synced_at = TimestampField(read_only=True, allow_null=True)
    first_synced_at = TimestampField(read_only=True, allow_null=True)
    last_app_version_id = serializers.CharField(read_only=True, allow_null=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
    current_owner = NestedUserSerializer(read_only=True, allow_null=True)
    instance_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Device
        fields = [
            "installation_id",
            "last_synced_at",
            "first_synced_at",
            "last_app_version_id",
            "current_owner",
            "instance_count",
            "test_device",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.current_owner_id:
            representation["current_owner"] = {
                "id": instance.current_owner_id,
                "username": instance.current_owner_username,
            }
        return representation
