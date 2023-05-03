from django.contrib.gis.geos import Point
from rest_framework import permissions, serializers

from iaso.models import Device, DevicePosition, Project, DeviceOwnership
from .common import ModelViewSet, TimestampField, safe_api_import


class DevicePositionSerializer(serializers.Serializer):
    device_id = serializers.CharField(allow_blank=False)
    transport = serializers.CharField()
    uuid = serializers.UUIDField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    altitude = serializers.FloatField()
    accuracy = serializers.FloatField()
    captured_at = TimestampField()

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        validated_data["location"] = Point(
            x=validated_data.pop("longitude"),
            y=validated_data.pop("latitude"),
            z=validated_data.pop("altitude"),
            srid=4326,
        )

        return validated_data

    def create(self, validated_data):
        request = self.context["request"]

        device_id = validated_data.pop("device_id")
        p = Project.objects.get_for_user_and_app_id(request.user, request.query_params.get("app_id"))
        d, created = Device.objects.get_or_create(imei=device_id)

        if created and not request.user.is_anonymous:
            DeviceOwnership.objects.get_or_create(device=d, project=p, user=request.user)
        uuid = validated_data["uuid"]
        positions = DevicePosition.objects.filter(uuid=uuid)
        if not positions.exists():
            dp = DevicePosition()
            dp.device = d
            dp.uuid = uuid
            dp.location = validated_data.get("location")
            dp.accuracy = validated_data.get("accuracy")
            dp.captured_at = validated_data.get("captured_at")
            dp.transport = validated_data.get("transport")
            dp.save()
        else:
            dp = positions.first()
        return dp


class DevicesPositionViewSet(ModelViewSet):
    """Iaso Devices position API

    This API is open to anonymous users on write (if the project allows it).

    GET /api/devicespositions/
    GET /api/devicesposition/ [Deprecated] will be removed in the future
    POST /api/devicespositions/
    POST /api/devicesposition/ [Deprecated] will be removed in the future
    """

    permission_classes = [permissions.AllowAny]

    http_method_names = ["get", "post", "head", "options", "trace"]
    results_key = "devicesposition"
    queryset = DevicePosition.objects.all()
    serializer_class = DevicePositionSerializer

    @safe_api_import("devicesposition", fallback_status=201)
    def create(self, api_import, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get("data", {}), list):
            kwargs["many"] = True

        return super().get_serializer(*args, **kwargs)
