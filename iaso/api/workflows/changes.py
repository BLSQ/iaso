from django.shortcuts import get_object_or_404
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema, no_body
from rest_framework import permissions
from rest_framework import viewsets
from rest_framework.response import Response

import iaso.api.workflows.serializers as ser
import iaso.api.workflows.utils as utils
from iaso.api.common import HasPermission
from iaso.models import WorkflowChange

version_id_param = openapi.Parameter(
    name="version_id",
    in_=openapi.IN_QUERY,
    description="The workflow version id for which we create or delete a change",
    type=openapi.TYPE_STRING,
    required=True,
)


class WorkflowChangeViewSet(viewsets.ViewSet):
    """Workflow Changes API

    POST /api/workflowchanges/?version_id=16
    content {"form":36,"mapping":{"string_widget":"string_widget"}}
    Creates a New Workflow Change for Workflow Version 16 with form 36 and mapping {"string_widget":"string_widget"}


    PUT /api/workflowchanges/1/
    Updates the Workflow Change with id 1

    DELETE /api/workflowchanges/1/
    Deletes the Workflow Change with id 1

    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
    serializer_class = ser.WorkflowChangeSerializer

    @swagger_auto_schema(
        manual_parameters=[version_id_param],
        request_body=ser.WorkflowChangeCreateSerializer,
    )
    def create(self, request, *args, **kwargs):
        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))

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

    @swagger_auto_schema(request_body=no_body)
    def destroy(self, request, *args, **kwargs):
        id_to_deleted = kwargs.get("pk")

        change = get_object_or_404(WorkflowChange, pk=id_to_deleted)
        utils.validate_version_id(change.workflow_version.id, request.user)

        change.delete()
        return Response(status=204)
