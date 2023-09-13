import logging
from beanstalk_worker import task_decorator
import os
import json
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from datetime import datetime
from hat import settings
from iaso.api.tasks import TaskSerializer
from iaso.models.base import RUNNING, SKIPPED, KILLED, Task
from iaso.models.org_unit import OrgUnit
from rest_framework import viewsets, permissions, serializers
from hat.menupermissions import models as permission
from iaso.api.common import HasPermission, ModelViewSet
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.sites.models import Site

logger = logging.getLogger(__name__)
TASK_NAME = "Refresh LQAS data"


class RefreshLQASDataSerializer(serializers.Serializer):
    country_id = serializers.IntegerField()

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context["request"]
        # It seems a bit stange to limit the access on country id
        # but to launch the refresh for all countries if no id is passed
        if request.data["country_id"] is not None:
            user = request.user
            country_id = int(request.data["country_id"])
            user_has_access = OrgUnit.objects.filter_for_user(user).filter(id=country_id).count() > 0
            if not user_has_access:
                raise serializers.ValidationError({"country_id": "No authorised org unit found for user"})
        return validated_data


class ExternalTaskSerializer(TaskSerializer):
    def update(self, task, validated_data):
        has_progress_message = validated_data.get("progress_message", None) is not None
        has_status = validated_data.get("status", None) is not None
        has_progress_value = validated_data.get("progress_value", None) is not None
        has_end_value = validated_data.get("end_value", None) is not None
        if (has_status or has_progress_value or has_progress_message or has_end_value) and not task.external:
            raise serializers.ValidationError({"external": "Cannot modify non external tasks"})
        if has_status:
            task.status = validated_data["status"]
        if validated_data.get("should_be_killed", None) is not None:
            task.should_be_killed = validated_data["should_be_killed"]
            if validated_data["should_be_killed"]:
                task.status = KILLED
        if has_progress_message:
            task.progress_message = validated_data["progress_message"]
        if has_progress_value:
            task.progress_value = validated_data["progress_value"]
        if has_end_value:
            task.end_value = validated_data["end_value"]
        task.save()
        print("VALIDATED", validated_data)
        return task


class RefreshLQASDataViewset(ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.POLIO, permission.POLIO_CONFIG)]
    http_method_names = ["get", "post", "patch"]
    model = Task

    def get_serializer_class(self):
        if self.request.method == "POST":
            return RefreshLQASDataSerializer
        return ExternalTaskSerializer

    def get_queryset(self):
        return Task.objects.all()

    def create(self, request):
        serializer = RefreshLQASDataSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        data = serializer.validated_data
        started_at = datetime.now()
        country_id = data.get("country_id", None)
        name = f"{TASK_NAME}-{country_id}" if country_id is not None else TASK_NAME
        task = Task.objects.create(
            launcher=user,
            account=user.iaso_profile.account,
            name=name,
            status=RUNNING,
            external=True,
            started_at=started_at,
            should_be_killed=False,
        )
        status = self.refresh_lqas_data(country_id, task.id)
        task.status = status
        task.save()
        return Response({"task": TaskSerializer(instance=task).data})

    def refresh_lqas_data(self, country_id=None, task_id=None):
        transport = RequestsHTTPTransport(
            url=settings.OPENHEXA_URL,
            verify=True,
            headers={"Authorization": f"Bearer {settings.OPENHEXA_TOKEN}"},
        )
        client = Client(transport=transport, fetch_schema_from_transport=True)
        get_runs = gql(
            """
        query pipeline {
            pipeline(id: "e5b9a3bb-a22c-461f-b000-4dfa8d1cc445"){
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
        )
        latest_runs = client.execute(get_runs)
        # Warning the query will only return the last 10 runs
        active_runs = [
            run
            for run in latest_runs["pipeline"]["runs"]["items"]
            if (run["status"] != "queued" and run["status"] != "success" and run["status"] != "failed")
            and run.get("config", {}).get("country_id", None) == country_id
        ]
        if len(active_runs) > 0:
            logger.debug("ACTIVE RUNS", active_runs, country_id)
            logger.warning("Found active run for config")
            return SKIPPED

        config = {"target": settings.OH_PIPELINE_TARGET}

        if country_id:
            config["country_id"] = country_id
        if task_id:
            config["task_id"] = task_id
        mutation_input = (
            {"id": settings.LQAS_PIPELINE, "version": settings.LQAS_PIPELINE_VERSION, "config": config}
            if settings.LQAS_PIPELINE_VERSION
            else {"id": settings.LQAS_PIPELINE, "config": config}
        )
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
        if run_result["success"]:
            return RUNNING
