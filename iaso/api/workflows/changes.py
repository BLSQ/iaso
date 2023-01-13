from iaso.models import WorkflowChange
from iaso.api.common import HasPermission
from rest_framework import viewsets
from drf_yasg.utils import swagger_auto_schema, no_body

from drf_yasg import openapi

from rest_framework import permissions
import iaso.api.workflows.utils as utils
import iaso.api.workflows.serializers as ser

from rest_framework.response import Response

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

    DELETE /api/workflowchanges/?version_id=16&form_id=36


    """

    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_workflows")]  # type: ignore
    serializer_class = ser.WorkflowChangeSerializer

    @swagger_auto_schema(
        manual_parameters=[version_id_param],
        request_body=ser.WorkflowChangeCreateSerializer,
    )
    def create(self, request, *args, **kwargs):
        version_id = request.query_params.get(
            "version_id", kwargs.get("version_id", None)
        )

        utils.validate_version_id(version_id, request.user)

        serializer = ser.WorkflowChangeCreateSerializer(
            data=request.data, context={"request": request, "version_id": version_id}
        )
        serializer.is_valid(raise_exception=True)
        res = serializer.save()
        # serialized_data = ser.WorkflowFollowupSerializer(res).data
        # return Response(serialized_data)

        return Response("ok")

    @swagger_auto_schema(request_body=no_body)
    def destroy(self, request, *args, **kwargs):
        pass
