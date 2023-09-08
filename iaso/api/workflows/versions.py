from django.db.models import Q
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg.utils import no_body, swagger_auto_schema
from rest_framework import filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

import iaso.api.workflows.serializers as ser
import iaso.api.workflows.utils as utils

from hat.menupermissions import models as permission
from iaso.api.common import HasPermission, ModelViewSet
from iaso.models import WorkflowVersion


class WorkflowVersionViewSet(ModelViewSet):
    """Workflow API
    GET /api/workflowversions/
    GET /api/workflowversions/{version_id}/
    If version_id is provided returns the detail of this workflow version.
    Else returns a paginated list of all the workflow versions.
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.WORKFLOW)]  # type: ignore
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ["name", "created_at", "updated_at", "id", "status"]
    serializer_class = ser.WorkflowVersionDetailSerializer
    results_key = "workflow_versions"
    remove_results_key_if_paginated = False
    model = WorkflowVersion
    lookup_url_kwarg = "version_id"
    filterset_fields = {"workflow__entity_type": ["exact"], "status": ["exact"], "id": ["exact"]}
    http_method_names = ["get", "post", "patch", "delete"]

    @swagger_auto_schema(request_body=no_body)
    @action(detail=True, methods=["post"])
    def copy(self, request, **kwargs):
        """POST /api/workflowversions/{version_id}/copy
        Creates a new workflow version by copying the exiting version given by {version_id}
        """

        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))
        wv_orig = WorkflowVersion.objects.get(pk=version_id)
        new_vw = utils.make_deep_copy_with_relations(wv_orig)
        serialized_data = ser.WorkflowVersionSerializer(new_vw).data
        return Response(serialized_data)

    @swagger_auto_schema(request_body=ser.WorkflowPartialUpdateSerializer)
    def partial_update(self, request, *args, **kwargs):
        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))
        wv_orig = get_object_or_404(WorkflowVersion, pk=version_id)

        serializer = ser.WorkflowPartialUpdateSerializer(data=request.data, context={"request": request}, partial=True)
        serializer.is_valid(raise_exception=True)
        res = serializer.update(wv_orig, serializer.validated_data)
        serialized_data = ser.WorkflowVersionSerializer(res).data
        return Response(serialized_data)

    @swagger_auto_schema(request_body=ser.WorkflowPostSerializer)
    def create(self, request, *args, **kwargs):
        """POST /api/workflowversions/
        Create a new empty and DRAFT workflow version for the workflow connected to Entity Type 'entity_type_id'
        """
        serializer = ser.WorkflowPostSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        res = serializer.save()
        serialized_data = ser.WorkflowVersionSerializer(res).data
        return Response(serialized_data)

    def get_queryset(self):
        search = self.request.query_params.get("search", None)
        """Always filter the base queryset by account"""
        queryset = WorkflowVersion.objects.filter_for_user(self.request.user).order_by("pk")
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(id__icontains=search))

        return queryset
