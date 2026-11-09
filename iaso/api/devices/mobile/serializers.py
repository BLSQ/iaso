from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.api.devices.mobile.serializer_fields import GetOrCreateDeviceField
from iaso.models import Device, DeviceLog, Project


class DeviceLogCreateSerializer(ModelSerializer):
    device = GetOrCreateDeviceField(queryset=Device.objects.none(), slug_field="installation_id", write_only=True)
    projects = serializers.SlugRelatedField(
        queryset=Project.objects.none(), slug_field="app_id", many=True, write_only=True
    )

    class Meta:
        model = DeviceLog
        fields = [
            "id",
            "device",
            "data",
            "app_id",
            "app_version",
            "projects",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "data": {"write_only": True},
            "app_id": {"write_only": True},
            "app_version": {"write_only": True},
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = self.context.get("user", None)
        self.project = self.context.get("project", None)
        if self.project and self.project.account:
            self.fields["device"].queryset = Device.objects.all().filter(account=self.project.account)
            self.fields["projects"].child_relation.queryset = Project.objects.all().filter(account=self.project.account)
