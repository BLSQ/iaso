import django_filters
from rest_framework import viewsets, filters

from iaso.api.org_unit_change_request_configurations.pagination import OrgUnitChangeRequestConfigurationPagination
from iaso.api.org_unit_change_request_configurations.serializers import (
    OrgUnitChangeRequestConfigurationListSerializer,
    OrgUnitChangeRequestConfigurationRetrieveSerializer,
    OrgUnitChangeRequestConfigurationWriteSerializer,
)
from iaso.models import OrgUnitChangeRequestConfiguration


class OrgUnitChangeRequestConfigurationViewSet(viewsets.ModelViewSet):
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    ordering_fields = [
        "id",
        "uuid",
        "project__name",
        "org_unit_type__name",
        "org_units_editable",
        "created_at",
        "updated_at",
        "created_by__username",
        "updated_by__username",
    ]
    # http_method_names = ["get", "options", "patch", "post", "head", "trace"]
    http_method_names = ["get", "post", "options", "trace", "head"]
    pagination_class = OrgUnitChangeRequestConfigurationPagination

    def get_queryset(self):
        print("*** get queryset ***")
        return (
            OrgUnitChangeRequestConfiguration.objects.order_by("id")
            .select_related("project", "org_unit_type", "created_by", "updated_by")
            .prefetch_related(
                "possible_types",
                "possible_parent_types",
                "group_sets",
                "editable_reference_forms",
                "other_groups",
            )
        )

    def get_serializer_class(self):
        print("*** get serializer class ***")
        if self.action == "create":
            return OrgUnitChangeRequestConfigurationWriteSerializer
        if self.action in ["list", "metadata"]:
            return OrgUnitChangeRequestConfigurationListSerializer
        if self.action == "retrieve":
            return OrgUnitChangeRequestConfigurationRetrieveSerializer
        # if self.action == "partial_update":
        #     return OrgUnitChangeRequestReviewSerializer
