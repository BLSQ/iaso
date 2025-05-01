from django.contrib.auth.password_validation import validate_password
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import HasPermission
from iaso.api.tasks.serializers import TaskSerializer
from iaso.tasks.export_mobile_app_setup_for_user import export_mobile_app_setup_for_user


class ExportMobileSetupSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    project_id = serializers.IntegerField(required=True)
    password = serializers.CharField(required=True)

    def validate_password(self, password):
        validate_password(password)


class ExportMobileSetupViewSet(viewsets.ViewSet):
    """Export mobile app setup"""

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.MOBILE_APP_OFFLINE_SETUP),
    ]

    def create(self, request):
        serializer = ExportMobileSetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_id = request.data.get("user_id", None)
        project_id = request.data.get("project_id", None)
        password = request.data.get("password", None)

        current_user = self.request.user

        task = export_mobile_app_setup_for_user(
            user_id=user_id,
            project_id=project_id,
            password=password,
            user=current_user,
        )

        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
