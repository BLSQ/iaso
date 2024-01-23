from iaso.api.tasks import ExternalTaskModelViewSet, ExternalTaskPostSerializer, ExternalTaskSerializer, TaskSerializer
from iaso.models.base import RUNNING, SKIPPED, ERRORED, SUCCESS, Task
from iaso.models.org_unit import OrgUnit
from rest_framework import permissions, serializers, filters
from hat.menupermissions import models as permission
from iaso.api.common import HasPermission
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend  # type:ignore
from django.db.models import Q
from rest_framework.decorators import action

TASK_NAME = "Refresh LQAS data"
NO_AUTHORIZED_COUNTRY_ERROR_MESSAGE = "No authorised org unit found for user"
NO_AUTHORIZED_COUNTRY_ERROR = {"country_id": NO_AUTHORIZED_COUNTRY_ERROR_MESSAGE}
LQAS_CONFIG_SLUG = "lqas-pipeline-config"


class RefreshLQASDataGetSerializer(serializers.Serializer):
    country_id = serializers.IntegerField(required=False)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context["request"]
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


class RefreshLQASDataPostSerializer(ExternalTaskPostSerializer):
    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context["request"]
        slug = validated_data.get("slug", None)
        config = validated_data.get("config", None)
        id_field = validated_data.get("id_field", None)
        error = {}
        if slug is None or slug != LQAS_CONFIG_SLUG:
            error["slug"] = f"Wrong config slug. Expected {LQAS_CONFIG_SLUG}, got {slug}"
        if config is None:
            error["config"] = "This field is mandatory"
        if id_field is None:
            error["id_field"] = "This field is mandatory"
        country_id = id_field.get("country_id", None)
        if country_id is None:
            error["id_field"] = "id_field should contain field 'country_id"
        # It seems a bit stange to limit the access on country id
        # but to launch the refresh for all countries if no id is passed
        if country_id is not None:
            user = request.user
            try:
                country_id = int(country_id)
                user_has_access = OrgUnit.objects.filter_for_user(user).filter(id=country_id).count() > 0
                if not user_has_access:
                    error["id_field"] = NO_AUTHORIZED_COUNTRY_ERROR_MESSAGE
            except:
                error["id_field"] = f"Expected int, got {country_id}"
        if error:
            raise serializers.ValidationError(error)
        res = {**validated_data}
        res["config"] = config  # is this safe?
        res["id_field"] = id_field
        return res


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
            return RefreshLQASDataPostSerializer
        return ExternalTaskSerializer

    def get_queryset(self):
        user = self.request.user
        account = user.iaso_profile.account
        queryset = Task.objects.filter(account=account).filter(external=True)
        authorized_countries = user.iaso_profile.org_units.filter(org_unit_type_id__category="COUNTRY")
        if authorized_countries.count() > 0:
            authorized_names = [f"{TASK_NAME}-{id}" for id in authorized_countries]
            queryset = queryset.filter(name__in=authorized_names)
        return queryset

    @action(detail=False, methods=["get"], serializer_class=TaskSerializer)
    def last_run_for_country(self, request):
        serializer = RefreshLQASDataGetSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        country_id = request.query_params.get("country_id", None)
        status_query = Q(status=SUCCESS) | Q(status=RUNNING) | Q(status=ERRORED)
        queryset = self.get_queryset().filter(status_query).exclude(started_at__isnull=True)
        # The filter is based on how the task name is generated by ExternalTaskPostSerializer
        query = (
            Q(name=LQAS_CONFIG_SLUG) | Q(name=f"{LQAS_CONFIG_SLUG}-{country_id}")
            if country_id is not None
            else Q(name=LQAS_CONFIG_SLUG)
        )
        queryset = queryset.filter(query).order_by("-started_at")
        if queryset.count() == 0:
            return Response({"task": {}})
        result = queryset.first()
        return Response({"task": TaskSerializer(instance=result).data})
