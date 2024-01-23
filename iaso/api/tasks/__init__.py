from typing import Union
from django.shortcuts import get_object_or_404
import logging
from rest_framework import permissions, serializers
from datetime import datetime
from rest_framework.response import Response
from iaso.models import Task
from ..common import ModelViewSet, TimestampField, UserSerializer, HasPermission
from hat.menupermissions import models as permission
from iaso.models.base import ERRORED, RUNNING, SKIPPED, KILLED, SUCCESS, Task
from plugins.polio.models import Config
from gql.transport.requests import RequestsHTTPTransport
from gql import Client, gql
from django.utils.text import slugify


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
            "launcher",
            "result",
            "status",
            "name",
            "should_be_killed",
            "progress_message",
            "polio_notification_import_id",
        ]

        read_only_fields = ["launcher_name"]

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

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.DATA_TASKS)]  # type: ignore
    serializer_class = TaskSerializer
    results_key = "tasks"
    queryset = Task.objects.all()
    http_method_names = ["get", "patch", "head", "options", "trace"]

    def get_queryset(self):
        profile = self.request.user.iaso_profile
        order = self.request.query_params.get("order", "created_at").split(",")
        return Task.objects.filter(account=profile.account).order_by(*order)


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
        id_field = request.data.get("id_field", None)
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
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(data=request.data, context={"request": request})
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
                if (run["status"] not in ["queued", "success", "failed"])
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
            {"id": pipeline, "version": int(pipeline_version), "config": oh_config}
            if pipeline_version
            else {"id": pipeline, "config": config}
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
        except:
            logger.exception("Could not launch pipeline")
            return ERRORED
