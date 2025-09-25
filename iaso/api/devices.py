from rest_framework import permissions, serializers

from iaso.models import Device, DeviceOwnership, Instance
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION

from .common import HasPermission, ModelViewSet, TimestampField


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = ["id", "imei", "test_device", "last_owner", "synched_at", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    last_owner = serializers.SerializerMethodField()
    synched_at = serializers.SerializerMethodField()
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    @staticmethod
    def get_synched_at(obj: Device):
        # updated_at field is better compared to created_at
        instance = Instance.objects.filter(device__id=obj.id).order_by("-updated_at").first()
        return instance.source_created_at.timestamp() if instance and instance.source_created_at else None

    @staticmethod
    def get_last_owner(obj: Device):
        owner = DeviceOwnership.objects.filter(device__id=obj.id).order_by("-created_at").first()
        return owner.user.iaso_profile.as_short_dict() if owner else None


class DevicesViewSet(ModelViewSet):
    f"""Iaso Devices API

    This API is restricted to authenticated users having the "{CORE_FORMS_PERMISSION}" or "{CORE_SUBMISSIONS_PERMISSION}" permissions.

    GET /api/devices/
    GET /api/devices/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION),
    ]
    serializer_class = DeviceSerializer
    results_key = "devices"
    queryset = Device.objects.all()
    http_method_names = ["get"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        devices = Device.objects.filter(projects__account=profile.account)
        return devices.order_by("created_at")
