from datetime import datetime
from typing import Union

from django.utils.text import slugify
from rest_framework import serializers

from iaso.api.common import TimestampField, UserSerializer
from iaso.models.base import ERRORED, KILLED, RUNNING, SUCCESS
from iaso.models.task import Task, TaskLog


class TaskSerializer(serializers.ModelSerializer):
    polio_notification_import_id = serializers.SerializerMethodField()

    class Meta:
        model = Task

        # Do not include the params, it can contain sensitive information such as passwords
        fields = [
            "id",
            "created_at",
            "started_at",
            "ended_at",
            "progress_value",
            "end_value",
            "created_by",
            "launcher",
            "result",
            "status",
            "name",
            "should_be_killed",
            "progress_message",
            "polio_notification_import_id",
        ]

        read_only_fields = ["launcher_name"]

    created_by = UserSerializer(read_only=True)
    launcher = UserSerializer(read_only=True)
    ended_at = TimestampField(read_only=True)
    created_at = TimestampField(read_only=True)
    started_at = TimestampField(read_only=True)

    def get_polio_notification_import_id(self, obj: Task) -> Union[int, None]:
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


class ExternalTaskSerializer(TaskSerializer):
    def update(self, task, validated_data):
        has_progress_message = validated_data.get("progress_message", None) is not None
        has_status = validated_data.get("status", None) is not None
        has_progress_value = validated_data.get("progress_value", None) is not None
        has_end_value = validated_data.get("end_value", None) is not None
        if (has_status or has_progress_value or has_progress_message or has_end_value) and not task.external:
            raise serializers.ValidationError({"external": "Cannot modify non external tasks"})
        if validated_data.get("should_be_killed", None) is not None:
            task.should_be_killed = validated_data["should_be_killed"]
            if validated_data["should_be_killed"]:
                task.status = KILLED
        if has_status:
            task.status = validated_data["status"]
            if (
                validated_data["status"] == SUCCESS
                or validated_data["status"] == ERRORED
                or validated_data["status"] == KILLED
            ):
                task.ended_at = datetime.now()
        if has_progress_message:
            task.progress_message = validated_data["progress_message"]
        if has_progress_value:
            task.progress_value = validated_data["progress_value"]
        if has_end_value:
            task.end_value = validated_data["end_value"]
        task.save()
        return task


class ExternalTaskPostSerializer(serializers.Serializer):
    slug = serializers.CharField()
    config = data = serializers.JSONField()
    id_field = data = serializers.JSONField()

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context["request"]
        slug = request.data.get("slug", None)
        config = request.data.get("config", None)
        id_field = request.data.get("id_field", {})
        error = {}

        if slug is None:
            error["slug"] = "This field is mandatory"

        id_field_count = len(id_field.keys())
        if id_field_count > 1:
            error["non_field_errors"] = f"id_field should only have one property, got {id_field_count}"

        if error:
            raise serializers.ValidationError(error)

        res = {**validated_data}
        res["slug"] = slugify(slug)
        res["config"] = config
        res["id_field"] = id_field
        return res

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        name = (
            f"{validated_data['slug']}-{list(validated_data['id_field'].values())[0]}"
            if validated_data.get("id_field", None)
            else f"{validated_data['slug']}"
        )
        task = Task.objects.create(
            created_by=user,
            launcher=user,
            account=user.iaso_profile.account,
            name=name,
            status=RUNNING,
            external=True,
            started_at=datetime.now(),
            should_be_killed=False,
        )
        task.save()
        return task


class TaskLogSerializer(serializers.Serializer):
    created_at = TimestampField()
    message = serializers.CharField()

    class Meta:
        model = TaskLog
        fields = ["created_at", "message"]
        read_only_fields = ["created_at", "message"]
