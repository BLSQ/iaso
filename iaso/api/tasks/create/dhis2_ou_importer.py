import logging

from rest_framework import viewsets, permissions, serializers
from rest_framework.response import Response

from iaso.api.common import HasPermission
from iaso.api.tasks import TaskSerializer
from iaso.models import DataSource
from iaso.tasks.dhis2_ou_importer import dhis2_ou_importer

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
    description = serializers.CharField(max_length=200, required=False, allow_null=True)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context["request"]
        user = request.user
        account = user.iaso_profile.account

        try:
            source = (
                DataSource.objects.filter(projects__in=account.project_set.all()).distinct().get(id=attrs["source_id"])
            )
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

        return validated_data


# noinspection PyMethodMayBeStatic
class Dhis2OuImporterViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission("menupermissions.iaso_sources")]  # type: ignore
    serializer_class = Dhis2OuImporterSerializer

    def create(self, request):
        serializer = Dhis2OuImporterSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        source_version_number = data.get("source_version_number", None)
        update_mode = source_version_number is not None

        # TODO: investigate: the task parameter (of dhis2_ou_importer) is not passed (which is allowed by the signature), but on the other hand the code seems to assume it's not None...
        task = dhis2_ou_importer(
            source_id=data["source_id"],
            source_version_number=source_version_number,
            force=data.get("force", False),
            validate=data.get("validate_status", False),
            continue_on_error=data.get("continue_on_error", False),
            url=data.get("dhis2_url", None),
            login=data.get("dhis2_login", None),
            password=data.get("dhis2_password", None),
            update_mode=update_mode,
            user=request.user,
            description=data.get("description", ""),
        )
        return Response({"task": TaskSerializer(instance=task).data})
