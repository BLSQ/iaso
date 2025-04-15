from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from iaso.api.instances import HasInstanceBulkPermission
from iaso.api.org_units import HasCreateOrgUnitPermission
from iaso.api.tasks.serializers import TaskSerializer
from iaso.tasks.instance_reference_bulk_link import instance_reference_bulk_link


class InstanceReferenceBulkLinkViewSet(viewsets.ViewSet):
    """Bulk link or unlink reference Instances to/from their related OrgUnit."""

    permission_classes = [permissions.IsAuthenticated, HasInstanceBulkPermission, HasCreateOrgUnitPermission]

    def create(self, request):
        raw_select_all = request.data.get("select_all", True)
        select_all = raw_select_all not in [False, "false", "False", "0", 0]
        selected_ids = request.data.get("selected_ids", [])
        unselected_ids = request.data.get("unselected_ids", [])
        actions = request.data.get("actions", [])
        actions_to_perform = ["link","unlink"]
        
        is_action = all(item in actions_to_perform for item in actions)
        if not is_action:
            raise Exception("Invalid actions provided. Some actions are not in the list of allowed actions.")
        
        user = self.request.user

        task = instance_reference_bulk_link(
            actions=actions, select_all=select_all, selected_ids=selected_ids, unselected_ids=unselected_ids, user=user
        )
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
