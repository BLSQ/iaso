from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.common import ModelSerializer, TimestampField
from iaso.models import Group, Task
from iaso.models.microplanning import PlanningSamplingResult


User = get_user_model()


class SamplingTaskSerializer(ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "name", "status"]


class PlanningSamplingReadNestedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username"]
        ref_name = "MicroplanningNestedUser"


class SamplingGroupSerializer(serializers.ModelSerializer):
    org_unit_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ["id", "name", "org_unit_count"]

    @extend_schema_field(serializers.IntegerField)
    def get_org_unit_count(self, group: Group) -> int:
        return len(group.org_units.all())


class PlanningSamplingResultReadSerializer(ModelSerializer):
    planning = serializers.PrimaryKeyRelatedField(read_only=True)
    group_id = serializers.IntegerField(read_only=True, allow_null=True)
    task_id = serializers.IntegerField(read_only=True, allow_null=True)
    created_at = TimestampField(read_only=True)
    created_by_details = PlanningSamplingReadNestedUserSerializer(source="created_by", read_only=True)
    group_details = SamplingGroupSerializer(source="group", read_only=True)
    task_details = SamplingTaskSerializer(source="task", read_only=True)

    class Meta:
        model = PlanningSamplingResult
        fields = [
            "id",
            "planning",
            "task_id",
            "task_details",
            "pipeline_id",
            "pipeline_version",
            "group_id",
            "pipeline_name",
            "group_details",
            "parameters",
            "created_at",
            "created_by",
            "created_by_details",
        ]
        read_only_fields = [
            "id",
            "planning",
            "created_at",
            "created_by",
            "created_by_details",
            "group_details",
            "task_details",
        ]
