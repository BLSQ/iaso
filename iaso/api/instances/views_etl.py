from django.db.models import Prefetch
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
from iaso.models import Instance, OrgUnitChangeRequest, ValidationNode


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
                    queryset=ValidationNode.objects.select_related("instance", "node", "updated_by", "created_by")
                    .only(
                        "id",
                        "status",
                        "comment",
                        "node_id",
                        "node__name",
                        "instance_id",
                        "created_at",
                        "updated_at",
                        "updated_by_id",
                        "updated_by__username",
                        "updated_by__first_name",
                        "updated_by__last_name",
                        "created_by_id",
                        "created_by__username",
                        "created_by__first_name",
                        "created_by__last_name",
                    )
                    .order_by("-updated_at"),
                    to_attr="prefeteched_validationnode_set",
                ),
                Prefetch(
                    "org_unit__orgunitchangerequest_set",
                    queryset=OrgUnitChangeRequest.objects.only("updated_at", "status", "id", "org_unit_id").order_by(
                        "-updated_at"
                    ),
                    to_attr="prefetched_org_unit_changerequest_set",
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
