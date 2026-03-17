from django.shortcuts import get_object_or_404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import permissions
from rest_framework.response import Response

import iaso.api.workflows.serializers as ser
import iaso.api.workflows.utils as utils

from iaso.api.common import HasPermission, ModelViewSet
from iaso.models import WorkflowChange
from iaso.permissions.core_permissions import CORE_WORKFLOW_PERMISSION


version_id_param = OpenApiParameter(
    name="version_id",
    location=OpenApiParameter.QUERY,
    description="The workflow version id for which we create or delete a change",
    type=OpenApiTypes.STR,
    required=True,
)


class WorkflowChangeViewSet(ModelViewSet):
    """Workflow Changes API

    GET /api/mappingversions/?version_id=16order=-id

    POST /api/workflowchanges/?version_id=16
    content {"form":36,"mapping":{"string_widget":"string_widget"}}
    Creates a New Workflow Change for Workflow Version 16 with form 36 and mapping {"string_widget":"string_widget"}


    PUT /api/workflowchanges/1/
    Updates the Workflow Change with id 1

    DELETE /api/workflowchanges/1/
    Deletes the Workflow Change with id 1

    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(CORE_WORKFLOW_PERMISSION)]
    serializer_class = ser.WorkflowChangeSerializer
    http_method_names = ["get", "post", "delete", "put"]

    @extend_schema(
        parameters=[version_id_param],
        request=ser.WorkflowChangeCreateSerializer,
    )
    def get_queryset(self):
        orders = self.request.query_params.get("order", "updated_at").split(",")
        queryset = WorkflowChange.objects
        version_id = self.request.query_params.get("version_id")
        if version_id:
            queryset = queryset.filter(workflow_version__id=version_id)
        queryset = queryset.order_by(*orders)
        return queryset

    def create(self, request, *args, **kwargs):
        version_id = request.query_params.get("version_id", kwargs.get("version_id"))

        utils.validate_version_id(version_id, request.user)

        serializer = ser.WorkflowChangeCreateSerializer(
            data=request.data, context={"request": request, "version_id": version_id}
        )

        serializer.is_valid(raise_exception=True)
        res = serializer.save()

        return_data = ser.WorkflowChangeSerializer(res).data

        return Response(return_data)

    def update(self, request, *args, **kwargs):
        orig_change = WorkflowChange.objects.get(id=kwargs["pk"])

        serializer = ser.WorkflowChangeCreateSerializer(
            data=request.data, context={"request": request, "version_id": orig_change.workflow_version.id}, partial=True
        )

        serializer.is_valid(raise_exception=True)

        serializer.update(orig_change, serializer.validated_data)

        return Response(serializer.data, status=200)

    @extend_schema(request=None)
    def destroy(self, request, *args, **kwargs):
        id_to_deleted = kwargs.get("pk")

        change = get_object_or_404(WorkflowChange, pk=id_to_deleted)
        utils.validate_version_id(change.workflow_version.id, request.user)

        change.delete()
        return Response(status=204)
