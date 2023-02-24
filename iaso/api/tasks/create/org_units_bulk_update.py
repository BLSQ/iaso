from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from iaso.api.org_units import HasOrgUnitPermission
from iaso.api.tasks import TaskSerializer
from iaso.tasks.org_units_bulk_update import org_units_bulk_update


class OrgUnitsBulkUpdate(viewsets.ViewSet):
    """Bulk update OrgUnits"""

    permission_classes = [permissions.IsAuthenticated, HasOrgUnitPermission]

    def create(self, request):
        select_all = request.data.get("select_all", None)
        validation_status = request.data.get("validation_status", None)
        org_unit_type_id = request.data.get("org_unit_type", None)
        groups_ids_added = request.data.get("groups_added", None)
        groups_ids_removed = request.data.get("groups_removed", None)
        selected_ids = request.data.get("selected_ids", [])
        unselected_ids = request.data.get("unselected_ids", [])
        searches = request.data.get("searches", [])

        user = self.request.user
        app_id = self.request.query_params.get("app_id")

        # a=a is a bit redundant, but it will allow a bit more verbosity in queue and edit log
        task = org_units_bulk_update(
            app_id=app_id,
            select_all=select_all,
            selected_ids=selected_ids,
            unselected_ids=unselected_ids,
            searches=searches,
            org_unit_type_id=org_unit_type_id,
            groups_ids_added=groups_ids_added,
            groups_ids_removed=groups_ids_removed,
            validation_status=validation_status,
            user=user,
        )
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
