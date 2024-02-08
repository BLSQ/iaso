from rest_framework import viewsets, permissions, status
from rest_framework.response import Response

from iaso.api.tasks import TaskSerializer
from iaso.tasks.export_mobile_app_setup_for_user import export_mobile_app_setup_for_user


class HasPermission(permissions.BasePermission):
    def has_permission(self, request, _view):
        return request.user.is_superuser


class ExportMobileSetupViewSet(viewsets.ViewSet):
    """Export mobile app setup"""

    permission_classes = [permissions.IsAuthenticated, HasPermission]

    def create(self, request):
        print(request.data)
        user_id = request.data.get("user_id", None)
        project_id = request.data.get("project_id", None)

        user_id = 315
        project_id = 2

        current_user = self.request.user

        task = export_mobile_app_setup_for_user(
            user_id=user_id,
            project_id=project_id,
            user=current_user,
        )

        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
