from django.db.models import F, Prefetch, Q, Window
from django.db.models.functions import Lag
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework.filters import OrderingFilter
from rest_framework.viewsets import GenericViewSet

from iaso.api.common.mixin import CustomPaginationListModelMixin
from iaso.api.instances.filters import ETLInstanceFilter
from iaso.api.instances.pagination import ETLInstancePagination
from iaso.api.instances.permissions import HasInstanceETLPermission
from iaso.api.instances.serializers import ETLInstanceListSerializer
from iaso.api.permission_checks import AuthenticationEnforcedPermission
from iaso.models import Instance, ValidationNode
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus


@extend_schema(tags=["ETL"])
class ETLInstanceViewSet(CustomPaginationListModelMixin, GenericViewSet):
    permission_classes = [AuthenticationEnforcedPermission, HasInstanceETLPermission]
    serializer_class = ETLInstanceListSerializer
    pagination_class = ETLInstancePagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ETLInstanceFilter
    ordering = "id"

    def get_queryset(self):
        return (
            Instance.objects.filter_for_user(user=self.request.user)
            .filter_on_user_projects(user=self.request.user)
            .select_related("form", "org_unit", "org_unit__org_unit_type")
            .prefetch_related(
                Prefetch(
                    "validationnode_set",
                    queryset=ValidationNode.objects.select_related("instance")
                    .only("created_at", "updated_at", "status", "instance_id", "instance__general_validation_status")
                    .order_by("-created_at"),
                    to_attr="prefetched_validation_nodes",
                ),
                Prefetch(
                    "validationnode_set",
                    queryset=(
                        ValidationNode.objects.filter(
                            Q(status=ValidationNodeStatus.SUBMISSION) | Q(status=ValidationNodeStatus.NEW_VERSION)
                        )
                        .only("created_at", "status", "instance_id", "instance__general_validation_status")
                        .select_related("instance")
                        .annotate(
                            next_created_at=Window(
                                expression=Lag("created_at"),
                                partition_by=[F("instance_id")],
                                order_by=F("created_at").desc(),
                            )
                        )
                        .order_by("-created_at")
                    ),
                    to_attr="prefetched_submission_nodes",
                ),
            )
            .only(
                "id",
                "json",
                "general_validation_status",
                "file",
                "form_id",
                "org_unit__name",
                "org_unit__id",
                "org_unit__parent_id",
                "org_unit__org_unit_type__name",
                "org_unit__org_unit_type_id",
                "org_unit__validation_status",
                "org_unit__location",
                "org_unit__created_at",
                "org_unit__updated_at",
                "org_unit__aliases",
            )
        )
