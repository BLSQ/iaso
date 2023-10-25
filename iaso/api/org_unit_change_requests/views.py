from rest_framework.exceptions import PermissionDenied
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework import viewsets

from django.utils import timezone

from iaso.api.org_unit_change_requests.filters import OrgUnitChangeRequestListFilter
from iaso.api.org_unit_change_requests.permissions import HasOrgUnitsChangeRequestPermission
from iaso.api.org_unit_change_requests.serializers import (
    OrgUnitChangeRequestListSerializer,
    OrgUnitChangeRequestRetrieveSerializer,
    OrgUnitChangeRequestWriteSerializer,
)
from iaso.api.serializers import AppIdSerializer
from iaso.models import OrgUnitChangeRequest, OrgUnit


class OrgUnitChangeRequestViewSet(
    CreateModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin, viewsets.GenericViewSet
):
    permission_classes = [HasOrgUnitsChangeRequestPermission]
    filterset_class = OrgUnitChangeRequestListFilter

    def get_serializer_class(self):
        if self.action in ["create", "update"]:
            return OrgUnitChangeRequestWriteSerializer
        if self.action == "list":
            return OrgUnitChangeRequestListSerializer
        if self.action == "retrieve":
            return OrgUnitChangeRequestRetrieveSerializer

    def get_queryset(self):
        org_units = OrgUnit.objects.filter_for_user(self.request.user)
        org_units_change_requests = OrgUnitChangeRequest.objects.select_related(
            "created_by",
            "updated_by",
            "org_unit__parent",
            "org_unit__org_unit_type",
            "new_parent",
            "new_org_unit_type",
        ).prefetch_related(
            "org_unit__groups",
            "new_groups",
            "new_reference_instances",
        )
        return org_units_change_requests.filter(org_unit__in=org_units)

    def get_app_id(self) -> str:
        """
        The mobile adds `?app_id=.bar.baz` in the query params.
        """
        app_id_serializer = AppIdSerializer(data=self.request.query_params)
        app_id_serializer.is_valid()
        return app_id_serializer.validated_data.get("app_id")

    def validate_org_unit_to_change(self, org_unit_to_change: OrgUnit) -> None:
        app_id = self.get_app_id()
        org_units = OrgUnit.objects.filter_for_user_and_app_id(self.request.user, app_id)
        if org_unit_to_change not in org_units:
            raise PermissionDenied("The user is trying to create a change request for an unauthorized OrgUnit.")

    def perform_create(self, serializer):
        org_unit_to_change = serializer.validated_data["org_unit"]
        self.validate_org_unit_to_change(org_unit_to_change)
        serializer.validated_data["created_by"] = self.request.user
        serializer.save()

    def perform_update(self, serializer):
        org_unit_to_change = serializer.validated_data.get("org_unit")
        if org_unit_to_change:
            self.validate_org_unit_to_change(org_unit_to_change)
        serializer.validated_data["updated_by"] = self.request.user
        serializer.validated_data["updated_at"] = timezone.now()
        serializer.save()
