from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from iaso.api.profiles import HasProfilePermission
from iaso.api.tasks import TaskSerializer
from iaso.tasks.profiles_bulk_update import profiles_bulk_update


class ProfilesBulkUpdate(viewsets.ViewSet):
    """Bulk update Profiles"""

    permission_classes = [permissions.IsAuthenticated, HasProfilePermission]

    def create(self, request):
        select_all = request.data.get("select_all", False)
        selected_ids = request.data.get("selected_ids", [])
        unselected_ids = request.data.get("unselected_ids", [])
        projects_ids_added = request.data.get("projects_ids_added", None)
        projects_ids_removed = request.data.get("projects_ids_removed", None)
        role_id_added = request.data.get("role_id_added", None)
        role_id_removed = request.data.get("role_id_removed", None)
        location_ids = request.data.get("location_ids", None)
        language = request.data.get("language", None)

        user = self.request.user

        task = profiles_bulk_update(
            select_all=select_all,
            selected_ids=selected_ids,
            unselected_ids=unselected_ids,
            projects_ids_added=projects_ids_added,
            projects_ids_removed=projects_ids_removed,
            role_id_added=role_id_added,
            role_id_removed=role_id_removed,
            location_ids=location_ids,
            language=language,
            user=user,
        )
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
