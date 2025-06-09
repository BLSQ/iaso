from rest_framework import permissions, serializers, viewsets
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import HasPermission
from iaso.api.tasks.serializers import TaskSerializer
from plugins.active_list.tasks.export_entities_to_records import export_entities_to_records


class ExportEntitiesToRecordsSerializer(serializers.Serializer):
    """Serializer for export_entities_to_records task - no parameters needed"""


class ExportEntitiesToRecordsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.REGISTRY_WRITE)]  # type: ignore
    serializer_class = ExportEntitiesToRecordsSerializer

    def create(self, request):
        """Launch the export_entities_to_records task"""
        serializer = ExportEntitiesToRecordsSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        task = export_entities_to_records(
            user=request.user,
        )
        return Response({"task": TaskSerializer(instance=task).data})
