import logging

import django_filters

from django.shortcuts import get_object_or_404
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from lazy_services import LazyService  # type: ignore
from rest_framework import filters, permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

import iaso.permissions as core_permissions

from iaso.api.common import HasPermission, ModelViewSet
from iaso.api.tasks.filters import (
    StartEndDateFilterBackend,
    StatusFilterBackend,
    TaskTypeFilterBackend,
    UsersFilterBackend,
)
from iaso.models.base import ERRORED, QUEUED, RUNNING, SKIPPED, Task
from iaso.models.json_config import Config
from iaso.utils.s3_client import generate_presigned_url_from_s3

from .serializers import ExternalTaskPostSerializer, ExternalTaskSerializer, TaskSerializer


task_service = LazyService("BACKGROUND_TASK_SERVICE")
logger = logging.getLogger(__name__)


class TaskSourceViewSet(ModelViewSet):
    """Task API

    GET /api/tasks/
    GET /api/tasks/<id>
    GET /api/tasks/<id>/presigned-url/
    GET /api/tasks/types/
    PATCH /api/tasks/<id>
    PATCH /api/tasks/<id>/relaunch/
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(core_permissions.DATA_TASKS),
    ]  # type: ignore
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
        TaskTypeFilterBackend,
        UsersFilterBackend,
        StartEndDateFilterBackend,
        StatusFilterBackend,
    ]
    ordering_fields = [
        "name",
        "status",
        "created_by__username",
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

        if current_user.has_perm(core_permissions.DATA_TASKS) or task.created_by == request.user:
            serializer = self.get_serializer(task)
            return Response(serializer.data)
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
        raise serializers.ValidationError(
            {"presigned_url": "Could not create a presigned URL, are you sure the task generated a file?"}
        )

    @action(detail=True, methods=["patch"], url_path="relaunch")
    def relaunch(self, request, pk):
        task = get_object_or_404(Task, pk=pk)
        current_user = request.user

        if current_user.has_perm(core_permissions.DATA_TASKS) or task.created_by == request.user:
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
        return Response(status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=["get"], url_path="types")
    def types(self, _request):
        available_types = Task.objects.order_by("name").values_list("name", flat=True).distinct("name")

        return Response(available_types)


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
        pipeline_config = data.get("pipeline_config", None)
        status = self.launch_task(
            slug=slug, config=config, id_field=id_field, task_id=task.pk, pipeline_config=pipeline_config
        )
        task.status = status
        task.save()
        return Response({"task": TaskSerializer(instance=task).data})

    # Override this method to use another 3rd party than OpenHexa
    # slug is the slug of the Config object
    # config is the pipeline specific config (the args of the pipeline method grouped in a dict)
    # task_id will be passed by the task decorator
    # id_field is a field to filter from to find the relevant active run, eg: a country id for lqas refresh
    @staticmethod
    def launch_task(slug, config={}, task_id=None, id_field=None, pipeline_config=None):
        try:
            # Use provided pipeline_config if available, otherwise fetch from database
            if pipeline_config is None:
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
        # Only add target if pipeline_target is not None (some pipelines don't need it)
        if pipeline_target is not None:
            oh_config["target"] = pipeline_target

        if task_id is not None and task_id != 0:
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
