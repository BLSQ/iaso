from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.core.exceptions import ObjectDoesNotExist
from django.utils.encoding import smart_str
from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import Device, DeviceLog, DeviceOwnership, DevicePosition, Project


class NestedUserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username"]
        read_only_fields = ["id", "username"]


class DeviceSerializer(serializers.ModelSerializer):
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
        read_only_fields = [
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

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.current_owner_id:
            representation["current_owner"] = {
                "id": instance.current_owner_id,
                "username": instance.current_owner_username,
            }
        return representation


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
        d, created = Device.objects.get_or_create(installation_id=device_id)
        if created:
            d.account = p.account
            d.save()

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


class GetOrCreateDeviceField(serializers.SlugRelatedField):
    """
    Extends `SlubRelatedField` in order to create the `Device` when it doesn't exist and pass validation.
    """

    def to_internal_value(self, data):
        try:
            return self._get_or_create_device(
                project=self.context["project"], user=self.context["request"].user, data=data
            )
        except ObjectDoesNotExist:
            self.fail("does_not_exist", slug_name=self.slug_field, value=smart_str(data))
        except (TypeError, ValueError):
            self.fail("invalid")

    def _get_or_create_device(self, project, user, data):
        queryset = self.get_queryset()
        device, created = queryset.get_or_create(
            **{
                self.slug_field: data,
                "account": project.account,
            }
        )
        if created and user.is_authenticated:
            device.projects.set([project])
            DeviceOwnership.objects.create(
                device=device,
                project=project,
                user=user,
            )
        return device


class DeviceLogSerializer(serializers.ModelSerializer):
    device = GetOrCreateDeviceField(queryset=Device.objects.none(), slug_field="installation_id")
    projects = serializers.SlugRelatedField(queryset=Project.objects.none(), slug_field="app_id", many=True)

    class Meta:
        model = DeviceLog
        fields = [
            "device",
            "data",
            "app_id",
            "app_version",
            "projects",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context["request"]
        self.user = request.user
        self.project = self.context["project"]
        self.fields["device"].queryset = Device.objects.all().filter(account=self.project.account)
        self.fields["projects"].child_relation.queryset = Project.objects.all().filter(account=self.project.account)
