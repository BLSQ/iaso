from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from iaso.api.common import parse_comma_separated_numeric_values
from iaso.api.tasks.serializers import TaskSerializer
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION
from iaso.tasks.profiles_bulk_update import profiles_bulk_update


class HasBulkUpdatePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()) or request.user.has_perm(
            CORE_USERS_MANAGED_PERMISSION.full_name()
        )


class ProfilesBulkUpdate(viewsets.ViewSet):
    """Bulk update Profiles"""

    permission_classes = [permissions.IsAuthenticated, HasBulkUpdatePermission]

    def create(self, request):
        select_all = request.data.get("select_all", False)
        selected_ids = request.data.get("selected_ids") or []
        unselected_ids = request.data.get("unselected_ids") or []
        projects_ids_added = request.data.get("projects_ids_added") or []
        projects_ids_removed = request.data.get("projects_ids_removed") or []
        roles_id_added = request.data.get("roles_id_added") or []
        roles_id_removed = request.data.get("roles_id_removed") or []
        location_ids_added = request.data.get("location_ids_added") or []
        location_ids_removed = request.data.get("location_ids_removed") or []
        language = request.data.get("language", None)
        teams_id_added = request.data.get("teams_id_added") or []
        teams_id_removed = request.data.get("teams_id_removed") or []
        organization = request.data.get("organization", None)

        search = request.data.get("search", None)
        perms = request.data.get("permissions", None)
        location = request.data.get("location", None)
        org_unit_type = request.data.get("orgUnitTypes", None)
        parent_ou = request.data.get("ouParent", None) == "true"
        children_ou = request.data.get("ouChildren", None) == "true"
        projects = request.data.get("projects", None)
        user_roles = request.data.get("user_roles", None)
        teams = request.data.get("teams", None)

        if projects:
            projects = parse_comma_separated_numeric_values(projects, "projects")
        if teams:
            teams = parse_comma_separated_numeric_values(teams, "teams")
        if user_roles:
            user_roles = parse_comma_separated_numeric_values(user_roles, "user_roles")

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
            organization=organization,
            search=search,
            perms=perms,
            location=location,
            org_unit_type=org_unit_type,
            parent_ou=parent_ou,
            children_ou=children_ou,
            projects=projects,
            user=user,
            user_roles=user_roles,
            teams=teams,
        )
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
