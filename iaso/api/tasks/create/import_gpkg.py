"""Task to Import a gpkg file

Done as a background task as it can take some time.
We create a ImportGPKG record so we can store the gpkg file
and a task that refer to this model
"""

import logging

from rest_framework import permissions, serializers, status
from rest_framework.exceptions import ValidationError
from rest_framework.mixins import CreateModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import HasPermission
from iaso.api.tasks import TaskSerializer
from iaso.models import DataSource, Task
from iaso.models.import_gpkg import ImportGPKG
from iaso.tasks.import_gpkg_task import import_gpkg_task
from hat.menupermissions import models as permission

logger = logging.getLogger(__name__)


class ImportGpkgSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImportGPKG
        fields = ["id", "file", "project", "data_source", "version_number", "description", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_project(self, project):
        user = self.context["request"].user
        account = user.iaso_profile.account
        if project not in account.project_set.all():
            raise ValidationError("Unauthorized project")
        return project

    def validate_data_source(self, data_source):
        user = self.context["request"].user
        account = user.iaso_profile.account
        if data_source not in DataSource.objects.filter(projects__account=account):
            raise ValidationError("Unauthorized DataSource")
        return data_source


# noinspection PyMethodMayBeStatic
class ImportGPKGViewSet(CreateModelMixin, GenericViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.SOURCES)]  # type: ignore
    serializer_class = ImportGpkgSerializer

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Create a task to queue this import
        ig: ImportGPKG = serializer.instance
        task: Task = import_gpkg_task(
            import_gpkg_id=ig.id,
            user=request.user,
        )

        # We return a different serializer than created
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )
