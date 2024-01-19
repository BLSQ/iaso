import logging
from django.shortcuts import get_object_or_404
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport
from datetime import datetime
from iaso.api.tasks import ExternalTaskSerializer, TaskSerializer
from iaso.models.base import RUNNING, SKIPPED, ERRORED, SUCCESS, Task
from iaso.models.org_unit import OrgUnit
from rest_framework import permissions, serializers, filters
from hat.menupermissions import models as permission
from iaso.api.common import ExternalTaskModelViewSet, HasPermission
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend  # type:ignore
from django.db.models import Q
from rest_framework.decorators import action

from plugins.polio.models import Config

logger = logging.getLogger(__name__)
TASK_NAME = "Refresh LQAS data"
NO_AUTHORIZED_COUNTRY_ERROR = {"country_id": "No authorised org unit found for user"}


class RefreshLQASDataSerializer(serializers.Serializer):
    country_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context["request"]
        country_id = request.data.get("country_id", None)
        if request.method == "GET":
            country_id = request.query_params.get("country_id", None)
        # It seems a bit stange to limit the access on country id
        # but to launch the refresh for all countries if no id is passed
        if country_id is not None:
            user = request.user
            country_id = int(country_id)
            user_has_access = OrgUnit.objects.filter_for_user(user).filter(id=country_id).count() > 0
            if not user_has_access:
                raise serializers.ValidationError(NO_AUTHORIZED_COUNTRY_ERROR)
        return validated_data


class CustomTaskSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")
        if search:
            query = (
                Q(name__icontains=search)
                | Q(status__icontains=search)
                | Q(launcher__first_name__icontains=search)
                | Q(launcher__username__icontains=search)
                | Q(launcher__last_name__icontains=search)
            )
            return queryset.filter(query)

        return queryset


class RefreshLQASDataViewset(ExternalTaskModelViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.POLIO, permission.POLIO_CONFIG)]  # type: ignore
    http_method_names = ["get", "post", "patch"]
    model = Task
    filter_backends = [
        filters.OrderingFilter,
        CustomTaskSearchFilterBackend,
        DjangoFilterBackend,
    ]
    filterset_fields = {"created_at": ["gte"], "ended_at": ["exact"], "started_at": ["gte"], "status": ["exact"]}
    ordering_fields = ["created_at", "ended_at", "name", "started_at", "status"]
    ordering = ["-started_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return RefreshLQASDataSerializer
        return ExternalTaskSerializer
    
    def get_task_name(self, data):
        country_id = data.get("country_id", None)
        return f"{TASK_NAME}-{country_id}" if country_id is not None else TASK_NAME

    def get_queryset(self):
        user = self.request.user
        account = user.iaso_profile.account
        queryset = Task.objects.filter(account=account).filter(external=True)
        authorized_countries = user.iaso_profile.org_units.filter(org_unit_type_id__category="COUNTRY")
        if authorized_countries.count() > 0:
            authorized_names = [f"{TASK_NAME}-{id}" for id in authorized_countries]
            queryset = queryset.filter(name__in=authorized_names)
        return queryset

    # def create(self, request):
    #     serializer = RefreshLQASDataSerializer(data=request.data, context={"request": request})
    #     serializer.is_valid(raise_exception=True)
    #     user = request.user
    #     data = serializer.validated_data
    #     started_at = datetime.now()
    #     country_id = data.get("country_id", None)
    #     name = f"{TASK_NAME}-{country_id}" if country_id is not None else TASK_NAME
    #     task = Task.objects.create(
    #         launcher=user,
    #         account=user.iaso_profile.account,
    #         name=name,
    #         status=RUNNING,
    #         external=True,
    #         started_at=started_at,
    #         should_be_killed=False,
    #     )
    #     status = self.refresh_lqas_data(country_id, task.id)
    #     task.status = status
    #     task.save()
    #     return Response({"task": TaskSerializer(instance=task).data})

    def refresh_lqas_data(self, country_id=None, task_id=None):
        try:
            pipeline_config = get_object_or_404(Config, slug="lqas-pipeline-config")
        except:
            logger.exception("Could not fetch openhexa config")
            return ERRORED
        lqas_pipeline_version = pipeline_config.content["lqas_pipeline_version"]
        oh_pipeline_target = pipeline_config.content["oh_pipeline_target"]
        lqas_pipeline = pipeline_config.content["lqas_pipeline"]
        openhexa_url = pipeline_config.content["openhexa_url"]
        openhexa_token = pipeline_config.content["openhexa_token"]

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
            % (lqas_pipeline)
        )
        try:
            latest_runs = client.execute(get_runs)
            # Warning the query will only return the last 10 runs
            active_runs = [
                run
                for run in latest_runs["pipeline"]["runs"]["items"]
                if (run["status"] not in ["queued", "success", "failed"])
                and run.get("config", {}).get("country_id", None) == country_id
            ]
            # Don't create a task if there's already an ongoing run for the country
            if len(active_runs) > 0:
                logger.debug("ACTIVE RUNS", active_runs, country_id)
                logger.warning("Found active run for config")
                return SKIPPED
        except:
            logger.exception("Could not fetch pipeline runs")
            return ERRORED

        config = {"target": oh_pipeline_target}

        if country_id:
            config["country_id"] = country_id
        if task_id:
            config["task_id"] = task_id
        # We can specify a version in the env in case the latest version gets bugged
        mutation_input = (
            {"id": lqas_pipeline, "version": int(lqas_pipeline_version), "config": config}
            if lqas_pipeline_version
            else {"id": lqas_pipeline, "config": config}
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

    @action(detail=False, methods=["get"], serializer_class=TaskSerializer)
    def last_run_for_country(self, request):
        serializer = RefreshLQASDataSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        country_id = request.query_params.get("country_id", None)
        status_query = Q(status=SUCCESS) | Q(status=RUNNING) | Q(status=ERRORED)
        queryset = self.get_queryset().filter(status_query).exclude(started_at__isnull=True)
        query = Q(name=TASK_NAME) | Q(name=f"{TASK_NAME}-{country_id}") if country_id is not None else Q(name=TASK_NAME)
        queryset = queryset.filter(query).order_by("-started_at")
        if queryset.count() == 0:
            return Response({"task": {}})
        result = queryset.first()
        return Response({"task": TaskSerializer(instance=result).data})
