from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

import iaso.api.workflows.import_export as import_export
from hat.menupermissions import models as permission
from iaso.api.common import HasPermission
from iaso.models import Workflow


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, HasPermission(permission.WORKFLOW)])  # type: ignore
def export_workflow(request, workflow_id):
    """GET /api/workflows/export/{workflow_id}/
    Exports the workflow version given by {version_id} as a JSON
    """
    workflow = Workflow.objects.get(pk=workflow_id)
    workflow_data = import_export.export_workflow(workflow)
    return Response(workflow_data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, HasPermission(permission.WORKFLOW)])  # type: ignore
def import_workflow(request):
    """POST /api/workflows/import/
    Imports the workflow version given by from a JSON body containing an export workflow.
    """
    workflow_data = request.data
    workflow = import_export.import_workflow(workflow_data, request.user.iaso_profile.account)
    return Response({"status": f"Workflow {workflow.name} imported successfully"})
