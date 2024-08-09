from iaso.api.forms import FormSerializer
from iaso.models.forms import Form
from iaso.models.org_unit import OrgUnit
from .common import ModelViewSet, HasPermission, TimestampField
from rest_framework import serializers, permissions
from django.db.models import Prefetch
from django.db.models import Count

from iaso.models import Device, DeviceOwnership, Instance
from .common import ModelViewSet, HasPermission, TimestampField
from hat.menupermissions import models as permission


class FormSerializerForDevices(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "name"]
        read_only_fields = ["id", "name"]


class OrgUnitSerializerForDevices(serializers.ModelSerializer):
    class Meta:
        model = OrgUnit
        fields = ["id", "name"]


class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = [
            "id",
            "imei",
            "test_device",
            "last_owner",
            "synched_at",
            "created_at",
            "updated_at",
            "first_use",
            "forms_imported",
            "org_units_visited",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    last_owner = serializers.SerializerMethodField()
    synched_at = serializers.SerializerMethodField()
    first_use = serializers.SerializerMethodField()
    forms_imported = serializers.SerializerMethodField()
    org_units_visited = serializers.SerializerMethodField()
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    @staticmethod
    def get_synched_at(obj: Device):
        # updated_at field is better compared to created_at
        instance = Instance.objects.filter(device__id=obj.id).order_by("updated_at").first()
        return instance.source_created_at.timestamp() if instance and instance.source_created_at else None

    @staticmethod
    def get_last_owner(obj: Device):
        owner = DeviceOwnership.objects.filter(device__id=obj.id).order_by("-created_at").first()
        return owner.user.iaso_profile.as_short_dict() if owner else None

    def get_first_use(self, obj):
        instance = obj.instances.filter(device__id=obj.id).order_by("-updated_at").first()
        return instance.source_created_at.timestamp() if instance and instance.source_created_at else None

    # FIX ME: filtering on projects and user should be more robust
    def get_forms_imported(self, obj):
        profile = self.context.get("request").user.iaso_profile
        instances = Instance.objects.filter(device__id=obj.id)
        # For some reason this filters out deleted forms
        forms = (
            Form.objects.filter(instances__in=instances)
            .exclude(deleted_at__isnull=False)
            .filter(projects__account=profile.account)
            .distinct()
        )
        return {"forms": FormSerializerForDevices(forms, many=True).data, "count": forms.count()}

    def get_org_units_visited(self, obj):
        user = self.context.get("request").user
        instances = Instance.objects.filter(device__id=obj.id).exclude(form__deleted_at__isnull=False)
        org_units = OrgUnit.objects.filter(instances__in=instances).filter_for_user(user).distinct()
        return {"org_units": OrgUnitSerializerForDevices(org_units, many=True).data, "count": org_units.count()}


class DevicesViewSet(ModelViewSet):
    f"""Iaso Devices API

    This API is restricted to authenticated users having the "{permission.FORMS}" or "{permission.SUBMISSIONS}" permissions.

    GET /api/devices/
    GET /api/devices/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.FORMS, permission.SUBMISSIONS),  # type: ignore
    ]
    serializer_class = DeviceSerializer
    results_key = "devices"
    http_method_names = ["get"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        devices = Device.objects.filter(projects__account=profile.account)
        return devices.order_by("created_at")
