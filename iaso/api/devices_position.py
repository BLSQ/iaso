from django.contrib.gis.geos import Point
from rest_framework import permissions, serializers
from rest_framework.exceptions import PermissionDenied

from .common import ModelViewSet, TimestampField, safe_api_import
from iaso.models import Device, DevicePosition, Project


class DevicePositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DevicePosition
        fields = [
            "id",
            "uuid",
            "device_id",
            "latitude",
            "longitude",
            "altitude",
            "accuracy",
            "captured_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    device_id = serializers.PrimaryKeyRelatedField(
        source="device", queryset=Device.objects.all()
    )
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    altitude = serializers.FloatField()
    accuracy = serializers.FloatField()
    captured_at = TimestampField()
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        validated_data["location"] = Point(
            x=validated_data.pop("longitude"),
            y=validated_data.pop("latitude"),
            z=validated_data.pop("altitude"),
            srid=4326,
        )

        return validated_data


class DevicesPositionViewSet(ModelViewSet):
    """Iaso Devices position API

    This API is open to anonymous users (if the project allows it).

    GET /api/iasodevicesownership/
    """

    permission_classes = [
        permissions.AllowAny,
    ]

    http_method_names = ["post", "head", "options", "trace"]
    results_key = "devicesposition"
    queryset = DevicePosition.objects.all()

    @safe_api_import("devicesposition", fallback_status=201)
    def create(self, api_import, request, *args, **kwargs):
        # TODO: attach api_import to device_position
        # TODO: move all this stuff in an authentication backend
        app_id = request.query_params.get("app_id", "org.bluesquarehub.iaso")

        if not request.user.is_anonymous:
            project = Project.objects.filter(app_id=app_id).first()
            if project and project.needs_authentication:
                if (
                    not request.user
                    or request.user.iaso_profile.account.id != project.account.id
                ):
                    raise PermissionDenied("User permissions problem")
        elif app_id is not None:
            project = Project.objects.get(app_id=app_id)
            if project.needs_authentication:
                raise PermissionDenied("User permissions problem")

        return super().create(request, *args, **kwargs)

    def get_serializer(self, *args, **kwargs):
        """Override serializer getter to force many to True: device positions are created in bulk"""

        return DevicePositionSerializer(*args, many=True, **kwargs)
