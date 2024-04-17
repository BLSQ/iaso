from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from iaso.api.tasks import TaskSerializer
from iaso.tasks.profiles_bulk_update import profiles_bulk_update
from hat.menupermissions import models as permission


class HasBulkUpdatePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm(permission.USERS_ADMIN) or request.user.has_perm(permission.USERS_MANAGED)


class ProfilesBulkUpdate(viewsets.ViewSet):
    """Bulk update Profiles"""

    permission_classes = [permissions.IsAuthenticated, HasBulkUpdatePermission]

    def create(self, request):
        select_all = request.data.get("select_all", False)
        selected_ids = request.data.get("selected_ids", [])
        unselected_ids = request.data.get("unselected_ids", [])
        projects_ids_added = request.data.get("projects_ids_added", None)
        projects_ids_removed = request.data.get("projects_ids_removed", None)
        roles_id_added = request.data.get("roles_id_added", None)
        roles_id_removed = request.data.get("roles_id_removed", None)
        location_ids_added = request.data.get("location_ids_added", None)
        location_ids_removed = request.data.get("location_ids_removed", None)
        language = request.data.get("language", None)
        teams_id_added = request.data.get("teams_id_added", None)
        teams_id_removed = request.data.get("teams_id_removed", None)

        search = request.data.get("search", None)
        perms = request.data.get("permissions", None)
        location = request.data.get("location", None)
        org_unit_type = request.data.get("orgUnitTypes", None)
        parent_ou = request.data.get("ouParent", None) == "true"
        children_ou = request.data.get("ouChildren", None) == "true"
        projects = request.data.get("projects", None)
        user_roles = request.data.get("userRoles", None)

        user = self.request.user

        task = profiles_bulk_update(
            select_all=select_all,
            selected_ids=selected_ids,
            unselected_ids=unselected_ids,
            projects_ids_added=projects_ids_added,
            projects_ids_removed=projects_ids_removed,
            roles_id_added=roles_id_added,
            roles_id_removed=roles_id_removed,
            teams_id_added=teams_id_added,
            teams_id_removed=teams_id_removed,
            location_ids_added=location_ids_added,
            location_ids_removed=location_ids_removed,
            language=language,
            search=search,
            perms=perms,
            location=location,
            org_unit_type=org_unit_type,
            parent_ou=parent_ou,
            children_ou=children_ou,
            projects=projects,
            user=user,
            user_roles=user_roles,
        )
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
