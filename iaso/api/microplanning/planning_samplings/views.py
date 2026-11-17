from django.db.models import Q
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from hat.audit.audit_mixin import AuditMixin
from iaso.api.common import ModelViewSet, ReadOnlyOrHasPermission
from iaso.api.microplanning.planning_samplings.serializers.list import PlanningSamplingResultListSerializer
from iaso.api.microplanning.planning_samplings.serializers.read import PlanningSamplingResultReadSerializer
from iaso.api.microplanning.planning_samplings.serializers.write import PlanningSamplingResultWriteSerializer
from iaso.models.microplanning import PlanningSamplingResult
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION


@extend_schema(tags=["Micro plannings", "Planning samplings"])
class PlanningSamplingResultViewSet(AuditMixin, ModelViewSet):
    """List/create sampling results scoped by planning."""

    include_results_key_if_not_paginated = False
    http_method_names = ["get", "post", "head", "options"]
    permission_classes = [IsAuthenticated, ReadOnlyOrHasPermission(CORE_PLANNING_WRITE_PERMISSION)]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = [
        "id",
        "created_at",
        "pipeline_id",
        "pipeline_version",
        "pipeline_name",
        "task_id",
        "group_id",
        "planning_id",
    ]

    def get_serializer_class(self):
        if self.action == "create":
            return PlanningSamplingResultWriteSerializer
        return PlanningSamplingResultReadSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            PlanningSamplingResult.objects.filter(
                Q(planning__deleted_at__isnull=True) & Q(planning__project__account=user.iaso_profile.account)
            )
            .select_related("planning", "created_by", "group", "task")
            .prefetch_related("group__org_units")
        )

    def list(self, request, *args, **kwargs):
        query_serializer = PlanningSamplingResultListSerializer(data=request.query_params, context={"request": request})
        query_serializer.is_valid(raise_exception=True)
        planning = query_serializer.validated_data["planning_id"]

        queryset = self.filter_queryset(self.get_queryset().filter(planning=planning))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        read_serializer = PlanningSamplingResultReadSerializer(serializer.instance, context={"request": request})
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
