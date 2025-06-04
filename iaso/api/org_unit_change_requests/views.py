import csv

from datetime import datetime

import django_filters

from django.db.models import Prefetch
from django.db.transaction import atomic
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from hat.audit import models as audit_models
from iaso.api.common import CONTENT_TYPE_CSV
from iaso.api.org_unit_change_requests.filters import OrgUnitChangeRequestListFilter
from iaso.api.org_unit_change_requests.pagination import OrgUnitChangeRequestPagination
from iaso.api.org_unit_change_requests.permissions import (
    HasOrgUnitsChangeRequestPermission,
    HasOrgUnitsChangeRequestReviewPermission,
)
from iaso.api.org_unit_change_requests.serializers import (
    OrgUnitChangeRequestBulkDeleteSerializer,
    OrgUnitChangeRequestBulkReviewSerializer,
    OrgUnitChangeRequestListSerializer,
    OrgUnitChangeRequestRetrieveSerializer,
    OrgUnitChangeRequestReviewSerializer,
    OrgUnitChangeRequestWriteSerializer,
)
from iaso.api.serializers import AppIdSerializer
from iaso.api.tasks.serializers import TaskSerializer
from iaso.models import Instance, OrgUnit, OrgUnitChangeRequest
from iaso.tasks.org_unit_change_requests_bulk_review import (
    org_unit_change_requests_bulk_approve,
    org_unit_change_requests_bulk_reject,
)
from iaso.utils.models.common import get_creator_name


class OrgUnitChangeRequestViewSet(viewsets.ModelViewSet):
    CSV_HEADER_COLUMNS = [
        "Id",
        "Org unit ID",
        "External reference",
        "Name",
        "Parent",
        "Org unit type",
        "Groups",
        "Created",
        "Created by",
        "Updated",
        "Updated by",
        "Name before change",
        "Name after change",
        "Name conclusion",
        "Parent 1 before change",
        "Parent 1 after change",
        "Ref Ext parent 1 before change",
        "Ref Ext parent 1 after change",
        "Ref Ext parent 1 conclusion",
        "Ref Ext parent 2 before change",
        "Ref Ext parent 2 after change",
        "Ref Ext parent 2 conclusion",
        "Ref Ext parent 3 before change",
        "Ref Ext parent 3 after change",
        "Ref Ext parent 3 conclusion",
        "Opening date before change",
        "Opening date after change",
        "Opening date conclusion",
        "Closing date before change",
        "Closing date after change",
        "Closing date conclusion",
        "Groups before change",
        "Groups after change",
        "Groups conclusion",
        "Localisation before change",
        "Localisation after change",
        "Localisation conclusion",
        "Reference submission before",
        "Reference submission after",
    ]

    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    filterset_class = OrgUnitChangeRequestListFilter
    ordering_fields = [
        "id",
        "org_unit__name",
        "org_unit__parent__name",
        "org_unit__org_unit_type__name",
        "groups",
        "created_at",
        "updated_at",
        "status",
        "created_by__username",
        "updated_by__username",
    ]
    http_method_names = ["get", "options", "patch", "post", "head", "trace"]
    pagination_class = OrgUnitChangeRequestPagination

    def get_permissions(self):
        if self.action in ["partial_update", "bulk_review", "bulk_delete"]:
            permission_classes = [HasOrgUnitsChangeRequestReviewPermission]
        else:
            permission_classes = [HasOrgUnitsChangeRequestPermission]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action in ["create"]:
            return OrgUnitChangeRequestWriteSerializer
        if self.action in ["list", "metadata"]:
            return OrgUnitChangeRequestListSerializer
        if self.action == "retrieve":
            return OrgUnitChangeRequestRetrieveSerializer
        if self.action == "partial_update":
            return OrgUnitChangeRequestReviewSerializer

    def get_queryset(self):
        org_units = OrgUnit.objects.filter_for_user(self.request.user)
        org_units_change_requests = (
            OrgUnitChangeRequest.objects.select_related(
                "created_by",
                "updated_by",
                "org_unit__parent",
                "org_unit__org_unit_type",
                "new_parent",
                "old_parent",
                "new_org_unit_type",
                "old_org_unit_type",
                "org_unit__version__data_source",
                "data_source_synchronization",
            )
            .prefetch_related(
                "org_unit__groups",
                Prefetch("org_unit__reference_instances", queryset=Instance.non_deleted_objects.select_related("form")),
                "org_unit__reference_instances__form",
                "new_groups",
                "old_groups",
                Prefetch("new_reference_instances", queryset=Instance.non_deleted_objects.select_related("form")),
                Prefetch("old_reference_instances", queryset=Instance.non_deleted_objects.select_related("form")),
                "org_unit__org_unit_type__projects",
            )
            .exclude_soft_deleted_new_reference_instances()
            .filter(org_unit__in=org_units)
            .filter_on_user_projects(self.request.user)
        )
        return org_units_change_requests

    def has_org_unit_permission(self, org_unit_to_change: OrgUnit) -> None:
        # The mobile adds `?app_id=.bar.baz` in the query params.
        app_id_serializer = AppIdSerializer(data=self.request.query_params)
        app_id_serializer.is_valid()
        app_id = app_id_serializer.validated_data.get("app_id")
        org_units_for_user = OrgUnit.objects.filter_for_user_and_app_id(self.request.user, app_id)
        if not org_units_for_user.filter(id=org_unit_to_change.pk).exists():
            raise PermissionDenied("The user is trying to create a change request for an unauthorized OrgUnit.")

    def perform_create(self, serializer):
        """
        POST to create an `OrgUnitChangeRequest`.
        """
        org_unit_to_change = serializer.validated_data["org_unit"]
        self.has_org_unit_permission(org_unit_to_change)
        serializer.validated_data["created_by"] = self.request.user
        serializer.save()

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH to approve or reject an `OrgUnitChangeRequest`.
        """
        change_request = self.get_object()

        self.has_org_unit_permission(change_request.org_unit)
        if change_request.status != change_request.Statuses.NEW:
            raise ValidationError(
                f"Status must be `{change_request.Statuses.NEW}` but current status is `{change_request.status}`."
            )

        serializer = self.get_serializer(change_request, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        status = serializer.validated_data["status"]
        rejection_comment = serializer.validated_data.get("rejection_comment", "")

        if status == change_request.Statuses.APPROVED:
            change_request.approve(
                user=self.request.user,
                approved_fields=serializer.validated_data["approved_fields"],
                rejection_comment=rejection_comment,
            )

        if status == change_request.Statuses.REJECTED:
            change_request.reject(
                user=self.request.user,
                rejection_comment=rejection_comment,
            )

        response_serializer = OrgUnitChangeRequestRetrieveSerializer(change_request)
        return Response(response_serializer.data)

    @action(detail=False, methods=["patch"])
    def bulk_review(self, request):
        serializer = OrgUnitChangeRequestBulkReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        select_all = serializer.validated_data["select_all"]
        selected_ids = serializer.validated_data["selected_ids"]
        unselected_ids = serializer.validated_data["unselected_ids"]
        status = serializer.validated_data["status"]
        rejection_comment = serializer.validated_data["rejection_comment"]

        queryset = self.filter_queryset(self.get_queryset()).filter(status=OrgUnitChangeRequest.Statuses.NEW)

        if select_all:
            queryset = queryset.exclude(pk__in=unselected_ids)
        else:
            queryset = queryset.filter(pk__in=selected_ids)

        ids = list(queryset.values_list("pk", flat=True))

        if status == OrgUnitChangeRequest.Statuses.APPROVED:
            task = org_unit_change_requests_bulk_approve(change_requests_ids=ids, user=self.request.user)
        else:
            task = org_unit_change_requests_bulk_reject(
                change_requests_ids=ids, rejection_comment=rejection_comment, user=self.request.user
            )

        return Response({"task": TaskSerializer(instance=task).data})

    @atomic
    @action(detail=False, methods=["post"])
    def bulk_delete(self, request):
        serializer = OrgUnitChangeRequestBulkDeleteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        select_all = serializer.validated_data["select_all"]
        selected_ids = serializer.validated_data["selected_ids"]
        unselected_ids = serializer.validated_data["unselected_ids"]

        queryset = self.filter_queryset(self.get_queryset())

        if select_all:
            queryset = queryset.exclude(pk__in=unselected_ids)
        else:
            queryset = queryset.filter(pk__in=selected_ids)

        now = timezone.now()
        for change_request in queryset:
            original_change_request = audit_models.serialize_instance(change_request)
            # Soft delete.
            change_request.deleted_at = now
            change_request.updated_by = request.user
            change_request.save()
            # Log changes.
            audit_models.log_modification(
                original_change_request, change_request, audit_models.ORG_UNIT_CHANGE_REQUEST_API, user=request.user
            )

        return Response({"result": "success"}, status=201)

    @action(detail=False, methods=["get"])
    def export_to_csv(self, request):
        filename = "%s--%s" % ("review-change-proposals", datetime.now().strftime("%Y-%m-%d"))

        # Optimize queryset with prefetch_related and select_related
        org_unit_changes_requests = (
            self.get_queryset()
            .select_related(
                "org_unit",
                "org_unit__parent",
                "org_unit__org_unit_type",
                "old_parent",
                "new_parent",
                "created_by",
                "updated_by",
            )
            .prefetch_related(
                "org_unit__groups",
                "old_groups",
                "new_groups",
                "org_unit__reference_instances",
                "old_reference_instances",
                "new_reference_instances",
                Prefetch(
                    "old_parent",
                    queryset=OrgUnit.objects.prefetch_related(
                        Prefetch(
                            "ancestors",
                            queryset=OrgUnit.objects.only("id", "source_ref").order_by("path"),
                            to_attr="cached_ancestors",
                        )
                    ),
                ),
                Prefetch(
                    "new_parent",
                    queryset=OrgUnit.objects.prefetch_related(
                        Prefetch(
                            "ancestors",
                            queryset=OrgUnit.objects.only("id", "source_ref").order_by("path"),
                            to_attr="cached_ancestors",
                        )
                    ),
                ),
                Prefetch(
                    "org_unit__parent",
                    queryset=OrgUnit.objects.prefetch_related(
                        Prefetch(
                            "ancestors",
                            queryset=OrgUnit.objects.only("id", "source_ref").order_by("path"),
                            to_attr="cached_ancestors",
                        )
                    ),
                ),
            )
            .order_by("org_unit__name")
        )

        filtered_org_unit_changes_requests = OrgUnitChangeRequestListFilter(
            request.GET, queryset=org_unit_changes_requests
        ).qs

        response = HttpResponse(content_type=CONTENT_TYPE_CSV)
        writer = csv.writer(response)
        writer.writerow(self.CSV_HEADER_COLUMNS)

        # Helper functions moved outside the loop
        def get_conclusion(change_request, field_name, old_value, new_value):
            field_mapping = {
                "name": "new_name",
                "parent": "new_parent",
                "ref_ext_parent_1": "new_parent",
                "ref_ext_parent_2": "new_parent",
                "ref_ext_parent_3": "new_parent",
                "opening_date": "new_opening_date",
                "closing_date": "new_closed_date",
                "groups": "new_groups",
                "localisation": "new_location",
                "reference_submission": "new_reference_instances",
            }
            requested_field = field_mapping.get(field_name)
            if requested_field not in change_request.requested_fields:
                return "same"
            if old_value == new_value:
                return "same"
            return "updated"

        def get_parent_ref_ext(parent, level):
            if not parent or not hasattr(parent, "cached_ancestors"):
                return None
            if level <= len(parent.cached_ancestors):
                return parent.cached_ancestors[level - 1].source_ref
            return None

        def get_location_str(location):
            if not location:
                return None
            return f"{location.y}, {location.x}"

        def get_reference_instance_ids(instances):
            if not instances.exists():
                return ""
            return ",".join(str(instance.id) for instance in instances.all().order_by("id"))

        for change_request in filtered_org_unit_changes_requests:
            # Basic row data - all data is already prefetched
            row = [
                change_request.id,
                change_request.org_unit_id,
                change_request.org_unit.source_ref,
                change_request.org_unit.name,
                change_request.org_unit.parent.name if change_request.org_unit.parent else None,
                change_request.org_unit.org_unit_type.name if change_request.org_unit.org_unit_type else None,
                ",".join(group.name for group in change_request.org_unit.groups.all()),
                datetime.strftime(change_request.created_at, "%Y-%m-%d"),
                get_creator_name(change_request.created_by) if change_request.created_by else None,
                datetime.strftime(change_request.updated_at, "%Y-%m-%d"),
                get_creator_name(change_request.updated_by) if change_request.updated_by else None,
            ]

            # Name changes
            name_before = change_request.old_name if change_request.kind == change_request.Kind.ORG_UNIT_CHANGE else ""
            name_after = change_request.new_name if change_request.new_name else change_request.org_unit.name
            name_conclusion = get_conclusion(change_request, "name", name_before, name_after)
            row.extend([name_before, name_after, name_conclusion])

            # Parent changes
            parent_before = change_request.old_parent.name if change_request.old_parent else ""
            parent_after = (
                change_request.new_parent.name
                if change_request.new_parent
                else change_request.org_unit.parent.name
                if change_request.org_unit.parent
                else None
            )
            row.extend([parent_before, parent_after])

            # Reference extensions for parents
            for level in range(1, 4):
                parent_before = change_request.old_parent
                parent_after = (
                    change_request.new_parent if change_request.new_parent else change_request.org_unit.parent
                )

                ref_ext_before = get_parent_ref_ext(parent_before, level)
                ref_ext_after = get_parent_ref_ext(parent_after, level)
                ref_ext_conclusion = get_conclusion(
                    change_request, f"ref_ext_parent_{level}", ref_ext_before, ref_ext_after
                )
                row.extend([ref_ext_before, ref_ext_after, ref_ext_conclusion])

            # Opening date changes
            opening_date_before = (
                change_request.old_opening_date.strftime("%Y-%m-%d") if change_request.old_opening_date else ""
            )
            opening_date_after = (
                change_request.new_opening_date.strftime("%Y-%m-%d")
                if change_request.new_opening_date
                else (
                    change_request.org_unit.opening_date.strftime("%Y-%m-%d")
                    if change_request.org_unit.opening_date
                    else None
                )
            )
            opening_date_conclusion = get_conclusion(
                change_request, "opening_date", opening_date_before, opening_date_after
            )
            row.extend([opening_date_before, opening_date_after, opening_date_conclusion])

            # Closing date changes
            closing_date_before = (
                change_request.old_closed_date.strftime("%Y-%m-%d") if change_request.old_closed_date else ""
            )
            closing_date_after = (
                change_request.new_closed_date.strftime("%Y-%m-%d")
                if change_request.new_closed_date
                else (
                    change_request.org_unit.closed_date.strftime("%Y-%m-%d")
                    if change_request.org_unit.closed_date
                    else None
                )
            )
            closing_date_conclusion = get_conclusion(
                change_request, "closing_date", closing_date_before, closing_date_after
            )
            row.extend([closing_date_before, closing_date_after, closing_date_conclusion])

            # Groups changes
            groups_before = ",".join(group.name for group in change_request.old_groups.all())
            groups_after = (
                ",".join(group.name for group in change_request.new_groups.all())
                if change_request.new_groups.exists()
                else ",".join(group.name for group in change_request.org_unit.groups.all())
            )
            groups_conclusion = get_conclusion(change_request, "groups", groups_before, groups_after)
            row.extend([groups_before, groups_after, groups_conclusion])

            # Location changes
            location_before = get_location_str(change_request.old_location)
            location_after = (
                get_location_str(change_request.new_location)
                if change_request.new_location
                else get_location_str(change_request.org_unit.location)
            )
            location_conclusion = get_conclusion(change_request, "localisation", location_before, location_after)
            row.extend([location_before, location_after, location_conclusion])

            # Reference instances changes
            reference_before = get_reference_instance_ids(change_request.old_reference_instances)
            reference_after = (
                get_reference_instance_ids(change_request.new_reference_instances)
                if change_request.new_reference_instances.exists()
                else get_reference_instance_ids(change_request.org_unit.reference_instances)
            )
            row.extend([reference_before, reference_after])

            writer.writerow(row)

        filename = filename + ".csv"
        response["Content-Disposition"] = "attachment; filename=" + filename
        return response
