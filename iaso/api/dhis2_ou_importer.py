from rest_framework.response import Response

from ..tasks.dhis2_ou_importer import dhis2_ou_importer
from .tasks import TaskSerializer
from ..models import DataSource, SourceVersion, Task, OrgUnit
from rest_framework import viewsets, permissions, serializers
from .common import HasPermission
from django.shortcuts import get_object_or_404
import logging

logger = logging.getLogger(__name__)


class Dhis2OuImporterSerializer(serializers.Serializer):
    source_id = serializers.IntegerField(required=True)
    source_version_number = serializers.IntegerField(required=True)
    dhis2_url = serializers.CharField(max_length=200, required=False)
    dhis2_login = serializers.CharField(max_length=200, required=False)
    dhis2_password = serializers.CharField(max_length=200, required=False)
    force = serializers.BooleanField(required=False, default=False)
    validate_status = serializers.BooleanField(required=False, default=False)
    continue_on_error = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):

        validated_data = super().validate(attrs)
        request = self.context["request"]
        user = request.user
        account = user.iaso_profile.account

        possible_data_sources = (
            DataSource.objects.filter(projects__in=account.project_set.all()).distinct().values_list("id", flat=True)
        )
        possible_data_sources = list(possible_data_sources)
        force = attrs["force"]
        source_id = attrs["source_id"]

        existing_version = list(
            SourceVersion.objects.filter(data_source_id=source_id, number=attrs["source_version_number"]).distinct()
        )
        if len(existing_version) > 0:
            source_version = SourceVersion.objects.get(data_source_id=source_id, number=attrs["source_version_number"])
            if source_version:
                version_count = OrgUnit.objects.filter(version=source_version).count()
                if version_count > 0 and not force:
                    raise serializers.ValidationError(
                        "This is going to delete %d org units records. Use the force parameter to proceed"
                        % version_count
                    )

        if validated_data["source_id"] not in possible_data_sources:
            raise serializers.ValidationError("Unauthorized source_id")

        return validated_data


class Dhis2OuImporterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_sources")]
    serializer_class = Dhis2OuImporterSerializer

    def create(self, request):
        data = request.data
        serializer = Dhis2OuImporterSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        source_id = data["source_id"]
        source_version_number = data["source_version_number"]
        force = data.get("force", False)
        validate_status = data.get("validate_status", False)
        continue_on_error = data.get("continue_on_error", False)
        dhis2_url = data.get("dhis2_url", None)
        dhis2_login = data.get("dhis2_login", None)
        dhis2_password = data.get("dhis2_password", None)

        task = dhis2_ou_importer(
            source_id,
            source_version_number,
            force,
            validate_status,
            continue_on_error,
            dhis2_url,
            dhis2_login,
            dhis2_password,
            user=request.user,
        )
        return Response({"task": TaskSerializer(instance=task).data})
