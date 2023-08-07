from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema, no_body
from rest_framework import filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

import iaso.api.workflows.serializers as ser
import iaso.api.workflows.utils as utils
from iaso.api.common import ModelViewSet, HasPermission
from iaso.models import WorkflowFollowup
from hat.menupermissions import models as permission

workflow_version_id_param = openapi.Parameter(
    name="workflow_version_id",
    in_=openapi.IN_QUERY,
    description="The workflow version id for which we create a followup",
    type=openapi.TYPE_STRING,
    required=True,
)


class WorkflowFollowupViewSet(ModelViewSet):
    """Workflow Followup API

    For all these endpoints, the workflow version should be in draft status otherwise additions/modifications will be refused

    POST /api/workflowfollowups/?version_id={workflow_version_id}
    Creates one new followup for WorkflowVersion {workflow_version_id} with the followup body data
    {
        "order": Int,
        "condition": JsonLogic String (Escaped), // Can be either "true" or "{...}"
        "form_ids": Int[], // Can not be empty or null
    }

    POST /api/workflowfollowups/bulkupdate/
    Modify one or more followup
    id and at least one of the other fields must be provided
    the array cannot be empty or null and must contain at least one followup
    [
      {
          "id": String,
          "order": Int,
          "condition": JsonLogic String (Escaped),
          "form_ids": String[],
      },
    ]

    DELETE /api/workflowfollowups/{followup_id}/
    Will delete the followup with id {followup_id}
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.WORKFLOW)]  # type: ignore
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ["order"]
    serializer_class = ser.WorkflowVersionDetailSerializer
    results_key = "workflow_followups"
    remove_results_key_if_paginated = False
    model = WorkflowFollowup
    lookup_url_kwarg = "followup_id"
    filterset_fields = {"workflow_version": ["exact"]}
    http_method_names = ["post", "delete"]

    @swagger_auto_schema(
        manual_parameters=[workflow_version_id_param], request_body=ser.WorkflowFollowupCreateSerializer
    )
    def create(self, request, *args, **kwargs):
        version_id = request.query_params.get("version_id", kwargs.get("version_id", None))
        utils.validate_version_id(version_id, request.user)
        serializer = ser.WorkflowFollowupCreateSerializer(
            data=request.data, context={"request": request, "version_id": version_id}
        )
        serializer.is_valid(raise_exception=True)
        res = serializer.save()
        serialized_data = ser.WorkflowFollowupSerializer(res).data
        return Response(serialized_data)

    @swagger_auto_schema(request_body=ser.WorkflowFollowupModifySerializer(many=True))
    @action(detail=False, methods=["post"], url_path="bulkupdate")
    def bulk_update(self, request, *args, **kwargs):
        modifs = []

        for followup in request.data:
            if "id" not in followup:
                return Response("id is required for bulk update", status=400)
            else:
                followup_orig = WorkflowFollowup.objects.get(id=followup["id"])
                serializer = ser.WorkflowFollowupModifySerializer(
                    data=followup, context={"request": request}, partial=True
                )
                serializer.is_valid(raise_exception=True)
                res = serializer.update(followup_orig, serializer.validated_data)
                modifs.append(res)

        resp = ser.WorkflowFollowupSerializer(modifs, many=True).data
        return Response(resp)

    @swagger_auto_schema(request_body=no_body)
    def destroy(self, request, *args, **kwargs):
        followup_id = request.query_params.get("followup_id", kwargs.get("followup_id", None))
        wf = WorkflowFollowup.objects.get(pk=followup_id)
        wf.delete()
        return Response(status=204)
