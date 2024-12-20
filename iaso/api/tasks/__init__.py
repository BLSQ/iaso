from datetime import datetime
from typing import Union
import logging

import django_filters
from django.utils.text import slugify
from django.shortcuts import get_object_or_404
from gql.transport.requests import RequestsHTTPTransport
from gql import Client, gql
from lazy_services import LazyService  # type: ignore
from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.models.json_config import Config
from ..common import ModelViewSet, TimestampField, UserSerializer, HasPermission
from hat.menupermissions import models as permission
from iaso.models.base import ERRORED, RUNNING, SKIPPED, KILLED, SUCCESS, QUEUED, Task
from iaso.utils.s3_client import generate_presigned_url_from_s3
from iaso.api.tasks.filters import StatusFilterBackend, StartEndDateFilterBackend, UsersFilterBackend


task_service = LazyService("BACKGROUND_TASK_SERVICE")
logger = logging.getLogger(__name__)


class TaskSerializer(serializers.ModelSerializer):
    polio_notification_import_id = serializers.SerializerMethodField()

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


class TaskSourceViewSet(ModelViewSet):
    """Task API

    GET /api/tasks/
    GET /api/tasks/<id>
    PATCH /api/tasks/<id>
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.DATA_TASKS),
    ]  # type: ignore
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
        UsersFilterBackend,
        StartEndDateFilterBackend,
        StatusFilterBackend,
    ]
    ordering_fields = [
        "name",
        "status",
        "created_by__username",
        "user__iaso_profile__phone_number",
        "created_at",
        "started_at",
        "ended_at",
    ]
    ordering = ["-created_at"]

    serializer_class = TaskSerializer
    results_key = "tasks"
    queryset = Task.objects.all()
    http_method_names = ["get", "patch", "head", "options", "trace"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        return Task.objects.select_related("created_by", "launcher").filter(account=profile.account)

    def get_permissions(self):
        if self.action in ["retrieve", "relaunch"]:
            # we handle additional permissions inside the action
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    def retrieve(self, request, *args, **kwargs):
        task = self.get_object()
        current_user = request.user

        if current_user.has_perm(permission.DATA_TASKS) or task.created_by == request.user:
            serializer = self.get_serializer(task)
            return Response(serializer.data)
        else:
            return Response(status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=["get"], url_path="presigned-url")
    def generate_presigned_url(self, request, pk=None):
        task = get_object_or_404(Task, pk=pk)

        if task.result and task.result["data"] and task.result["data"].startswith("file:"):
            s3_object_name = task.result["data"].replace("file:", "")

            try:
                response = generate_presigned_url_from_s3(s3_object_name)
            except Exception as e:
                return Response({"error": str(e)}, status=400)

            return Response({"presigned_url": response})
        else:
            raise serializers.ValidationError(
                {"presigned_url": "Could not create a presigned URL, are you sure the task generated a file?"}
            )

    @action(detail=True, methods=["patch"], url_path="relaunch")
    def relaunch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        current_user = request.user

        if current_user.has_perm(permission.DATA_TASKS) or task.created_by == request.user:
            if task.status != ERRORED:
                raise serializers.ValidationError({"status": f"You cannot relaunch a task with status {task.status}."})

            task.status = QUEUED
            task.launcher = current_user
            task.save()
            task.queue_answer = task_service.enqueue(
                module_name=task.params["module"],
                method_name=task.params["method"],
                args=task.params["args"],
                kwargs=task.params["kwargs"],
                task_id=task.id,
            )
            task.save()

            serializer = self.get_serializer(task)
            return Response(serializer.data)
        else:
            return Response(status=status.HTTP_403_FORBIDDEN)


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
            f'{validated_data["slug"]}-{list(validated_data["id_field"].values())[0]}'
            if validated_data.get("id_field", None)
            else f'{validated_data["slug"]}'
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


class ExternalTaskModelViewSet(ModelViewSet):
    def get_serializer_class(self):
        if self.request.method == "POST":
            return ExternalTaskPostSerializer
        return ExternalTaskSerializer

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        data = serializer.validated_data
        config = data.get("config", None)
        slug = data.get("slug", None)
        id_field = data.get("id_field", None)
        status = self.launch_task(slug=slug, config=config, id_field=id_field, task_id=task.pk)
        task.status = status
        task.save()
        return Response({"task": TaskSerializer(instance=task).data})

    # Override this method to use another 3rd party than OpenHexa
    # slug is the slug of the Config object
    # config is the pipeline specific config (the args of the pipeline method grouped in a dict)
    # task_id will be passed by the task decorator
    # id_field is a field to filter from to find the relevant active run, eg: a country id for lqas refresh
    def launch_task(self, slug, config={}, task_id=None, id_field=None):
        try:
            # The config Model should be moved to Iaso as well
            pipeline_config = get_object_or_404(Config, slug=slug)
            pipeline_version = pipeline_config.content["pipeline_version"]
            pipeline = pipeline_config.content["pipeline"]
            pipeline_target = pipeline_config.content["oh_pipeline_target"]
            openhexa_url = pipeline_config.content["openhexa_url"]
            openhexa_token = pipeline_config.content["openhexa_token"]
        except:
            logger.exception("Could not fetch openhexa config")
            return ERRORED

        id_field_key = ""
        id_field_value = None

        if id_field:
            try:
                id_field_key = list(id_field.keys())[0]
                id_field_value = list(id_field.values())[0]
            except:
                logger.exception(f"Bad id_field configuration.Expected non-empty dict, got {id_field}")
                return ERRORED
        run_statuses = ["queued", "success", "failed", "stopped"]
        transport = RequestsHTTPTransport(
            url=openhexa_url,
            verify=True,
            headers={"Authorization": f"Bearer {openhexa_token}"},
        )
        client = Client(transport=transport, fetch_schema_from_transport=True)
        get_runs = gql(
            """
        query pipeline {
            pipeline(id: "%s"){
                runs{
                    items{
                        run_id
                        status
                        config
                    }
                }
            }
        }
        """
            % (pipeline)
        )
        try:
            latest_runs = client.execute(get_runs)
            # Warning the query will only return the last 10 runs
            active_runs = [
                run
                for run in latest_runs["pipeline"]["runs"]["items"]
                if (run["status"] not in run_statuses)
                # Not sure this check is really solid
                and run.get("config", {}).get(id_field_key, None) == id_field_value
            ]
            # Don't create a task if there's already an ongoing run for the country
            if len(active_runs) > 0:
                logger.debug("ACTIVE RUNS", active_runs, id_field_key)
                logger.warning("Found active run for config")
                return SKIPPED
        except:
            logger.exception("Could not fetch pipeline runs")
            return ERRORED

        oh_config = {**config}
        # Target is a pipeline param on the lqas pipeline. We get it from the config i.o from the front-end to reduce risk of tarhgeting prod
        # We need a way to enforce that OpenHexa pipelines have a "target" argument and that iaso config have one as well (Serializer?)
        oh_config["target"] = pipeline_target if pipeline_target else "staging"

        if task_id:
            # task_id will be added by the task decorator
            oh_config["task_id"] = task_id
        # We can specify a version in case the latest version gets bugged
        mutation_input = (
            {"id": pipeline, "versionId": pipeline_version, "config": oh_config}
            if pipeline_version
            else {"id": pipeline, "config": oh_config}
        )
        try:
            run_mutation = gql(
                """
            mutation runPipeline($input: RunPipelineInput) {
            runPipeline(input: $input) {
                success
                run {
                id
                }
            }
            }
        """
            )
            run_result = client.execute(
                run_mutation,
                variable_values={"input": mutation_input},
            )["runPipeline"]
            # The SUCCESS state will be set by the OpenHexa pipeline
            if run_result["success"]:
                return RUNNING
            logger.info(f"Launched OpenHexa run: {run_result['id']}")
        except:
            logger.exception("Could not launch pipeline")
            return ERRORED
