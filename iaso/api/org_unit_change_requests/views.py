from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.mixins import CreateModelMixin, ListModelMixin, RetrieveModelMixin, UpdateModelMixin
from rest_framework import viewsets

from django.utils import timezone
from rest_framework.response import Response

from iaso.api.org_unit_change_requests.filters import OrgUnitChangeRequestListFilter
from iaso.api.org_unit_change_requests.permissions import HasOrgUnitsChangeRequestPermission
from iaso.api.org_unit_change_requests.serializers import (
    OrgUnitChangeRequestListSerializer,
    OrgUnitChangeRequestRetrieveSerializer,
    OrgUnitChangeRequestReviewSerializer,
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
        """
        POST can be used by both the web and the mobile.
        """
        org_unit_to_change = serializer.validated_data["org_unit"]
        self.validate_org_unit_to_change(org_unit_to_change)
        serializer.validated_data["created_by"] = self.request.user
        serializer.save()

    def perform_update(self, serializer):
        """
        PUT can be used by both the web and the mobile.
        """
        org_unit_to_change = serializer.validated_data.get("org_unit")
        if org_unit_to_change:
            self.validate_org_unit_to_change(org_unit_to_change)
        serializer.validated_data["updated_by"] = self.request.user
        serializer.validated_data["updated_at"] = timezone.now()
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH is used to approve or reject an `OrgUnitChangeRequest`.
        """
        change_request = self.get_object()
        self.validate_org_unit_to_change(change_request.org_unit)
        if change_request.status != change_request.Statuses.NEW:
            raise ValidationError(f"Status of the change to be patched is not `{change_request.Statuses.NEW}`.")

        serializer = OrgUnitChangeRequestReviewSerializer(change_request, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data["status"] == change_request.Statuses.APPROVED:
            change_request.approve(
                user=self.request.user,
                approved_fields=serializer.validated_data["approved_fields"],
            )

        if serializer.validated_data["status"] == change_request.Statuses.REJECTED:
            change_request.reject(
                user=self.request.user,
                rejection_comment=serializer.validated_data["rejection_comment"],
            )

        response_serializer = OrgUnitChangeRequestRetrieveSerializer(change_request)
        return Response(response_serializer.data)
