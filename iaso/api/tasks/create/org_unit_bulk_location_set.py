from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from iaso.api.org_units import HasOrgUnitPermission
from iaso.api.tasks import TaskSerializer
from iaso.tasks.org_units_bulk_location_set import org_units_bulk_location_set


class OrgUnitsBulkLocationSet(viewsets.ViewSet):
    """Bulk update OrgUnits position from their submissions.

    will only update position if there is none at the moment"""

    permission_classes = [permissions.IsAuthenticated, HasOrgUnitPermission]

    def create(self, request):
        select_all = request.data.get("select_all", False)
        selected_ids = request.data.get("selected_ids", [])
        unselected_ids = request.data.get("unselected_ids", [])
        searches = request.data.get("searches", [])

        user = self.request.user
        app_id = self.request.query_params.get("app_id")

        # a=a  may seem redundant, but it will allow a bit more verbosity in queue and edit log
        task = org_units_bulk_location_set(
            app_id=app_id,
            select_all=select_all,
            selected_ids=selected_ids,
            unselected_ids=unselected_ids,
            searches=searches,
            user=user,
        )
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
