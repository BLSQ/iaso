from rest_framework.response import Response

from iaso.tasks.dhis2_ou_importer import dhis2_ou_importer
from iaso.api.tasks import TaskSerializer
from iaso.models import DataSource, SourceVersion
from rest_framework import viewsets, permissions, serializers
from iaso.api.common import HasPermission
import logging

logger = logging.getLogger(__name__)


class Dhis2OuImporterSerializer(serializers.Serializer):
    source_id = serializers.IntegerField(required=True)
    source_version_number = serializers.IntegerField(required=False, default=None, allow_null=True)
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

        try:
            source = DataSource.objects.filter(projects__in=account.project_set.all()).get(id=attrs["source_id"])
        except DataSource.DoesNotExist:
            raise serializers.ValidationError("Unauthorized source_id")
        dhis2_url = attrs.get("dhis2_url", None)
        dhis2_login = attrs.get("dhis2_login", None)
        dhis2_password = attrs.get("dhis2_password", None)
        if not (
            (dhis2_url and dhis2_login and dhis2_password)
            or source.credentials
            and (source.credentials.url and source.credentials.login and source.credentials.password)
        ):
            raise serializers.ValidationError("No valid credentials exist for this source, please provide them")

        source_id = attrs["source_id"]
        if "source_version_number" in attrs:
            versions = SourceVersion.objects.filter(data_source_id=source_id, number=attrs["source_version_number"])
            for version in versions:
                version_count = version.orgunit_set.all().count()
                if version_count > 0:
                    raise serializers.ValidationError(f"A non empty version exists with {version_count} orgunits")
        return validated_data


# noinspection PyMethodMayBeStatic
class Dhis2OuImporterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_sources")]
    serializer_class = Dhis2OuImporterSerializer

    def create(self, request):
        serializer = Dhis2OuImporterSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        source_version_number = data.get("source_version_number", None)
        update_mode = source_version_number is not None

        task = dhis2_ou_importer(
            source_id=data["source_id"],
            source_version_number=source_version_number,
            force=data.get("force", False),
            validate_status=data.get("validate_status", False),
            continue_on_error=data.get("continue_on_error", False),
            dhis2_url=data.get("dhis2_url", None),
            dhis2_login=data.get("dhis2_login", None),
            dhis2_password=data.get("dhis2_password", None),
            update_mode=update_mode,
            user=request.user,
        )
        return Response({"task": TaskSerializer(instance=task).data})
