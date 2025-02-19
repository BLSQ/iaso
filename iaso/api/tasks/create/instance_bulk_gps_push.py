from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from iaso.api.instances import HasInstanceBulkPermission
from iaso.api.org_units import HasCreateOrgUnitPermission
from iaso.api.tasks.serializers import TaskSerializer
from iaso.tasks.instance_bulk_gps_push import instance_bulk_gps_push


class InstanceBulkGpsPushViewSet(viewsets.ViewSet):
    """Bulk push gps location from Instances to their related OrgUnit.

    This task will override existing location on OrgUnits and might set `None` if the Instance doesn't have any location.
    """

    permission_classes = [permissions.IsAuthenticated, HasInstanceBulkPermission, HasCreateOrgUnitPermission]

    def create(self, request):
        raw_select_all = request.data.get("select_all", True)
        select_all = raw_select_all not in [False, "false", "False", "0", 0]
        selected_ids = request.data.get("selected_ids", [])
        unselected_ids = request.data.get("unselected_ids", [])

        user = self.request.user

        task = instance_bulk_gps_push(
            select_all=select_all, selected_ids=selected_ids, unselected_ids=unselected_ids, user=user
        )
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
