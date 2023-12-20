from typing import Union

from rest_framework import permissions, serializers

from iaso.models import Task
from iaso.models.base import KILLED
from ..common import ModelViewSet, TimestampField, UserSerializer, HasPermission
from hat.menupermissions import models as permission


class TaskSerializer(serializers.ModelSerializer):
    polio_notification_id = serializers.SerializerMethodField()

    class Meta:
        model = Task

        # Do not include the params, it can contains sensitive information such as passwords
        fields = [
            "id",
            "created_at",
            "started_at",
            "ended_at",
            "progress_value",
            "end_value",
            "launcher",
            "result",
            "status",
            "name",
            "should_be_killed",
            "progress_message",
            "polio_notification_id",
        ]

        read_only_fields = ["launcher_name"]

    launcher = UserSerializer(read_only=True)
    ended_at = TimestampField(read_only=True)
    created_at = TimestampField(read_only=True)
    started_at = TimestampField(read_only=True)

    def get_polio_notification_id(self, obj: Task) -> Union[int, None]:
        if obj.name == "create_polio_notifications_async":
            return obj.params.get("kwargs", {}).get("pk")
        return None

    def update(self, task, validated_data):
        if validated_data["should_be_killed"] is not None:
            task.should_be_killed = validated_data["should_be_killed"]
            if task.external:
                task.status = KILLED
            task.save()
        return task


class TaskSourceViewSet(ModelViewSet):
    """Task API

    GET /api/tasks/
    GET /api/tasks/<id>
    PATCH /api/tasks/<id>
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.DATA_TASKS)]  # type: ignore
    serializer_class = TaskSerializer
    results_key = "tasks"
    queryset = Task.objects.all()
    http_method_names = ["get", "patch", "head", "options", "trace"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        order = self.request.query_params.get("order", "created_at").split(",")
        return Task.objects.filter(account=profile.account).order_by(*order)
