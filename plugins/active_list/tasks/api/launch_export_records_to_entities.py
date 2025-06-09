from rest_framework import permissions, serializers, viewsets
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import HasPermission
from iaso.api.tasks.serializers import TaskSerializer
from plugins.active_list.tasks.export_records_to_entities import export_records_to_entities


class ExportRecordsToEntitiesSerializer(serializers.Serializer):
    """Serializer for export_records_to_entities task - no parameters needed"""


class ExportRecordsToEntitiesViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.REGISTRY_WRITE)]  # type: ignore
    serializer_class = ExportRecordsToEntitiesSerializer

    def create(self, request):
        """Launch the export_records_to_entities task"""
        serializer = ExportRecordsToEntitiesSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        task = export_records_to_entities(
            user=request.user,
        )
        return Response({"task": TaskSerializer(instance=task).data})
