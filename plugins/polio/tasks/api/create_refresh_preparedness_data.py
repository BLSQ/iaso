import logging
from plugins.polio.models import Campaign
from plugins.polio.tasks.refresh_preparedness_data import refresh_data

from rest_framework import viewsets, permissions, serializers
from rest_framework.response import Response

from iaso.api.common import HasPermission
from iaso.api.tasks import TaskSerializer
from iaso.models import DataSource
from iaso.tasks.dhis2_ou_importer import dhis2_ou_importer
from hat.menupermissions import models as permission

logger = logging.getLogger(__name__)


class RefreshPreparednessLaucherSerializer(serializers.Serializer):
    obr_name = serializers.CharField(max_length=200, required=True)

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        request = self.context["request"]
        user = request.user
        try:
            Campaign.objects.filter_for_user(user).get(obr_name=attrs["obr_name"])
        except Campaign.DoesNotExist:
            raise serializers.ValidationError("Invalid campaign name")
        return validated_data


# noinspection PyMethodMayBeStatic
class RefreshPreparednessLaucherViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.POLIO, permission.POLIO_CONFIG)]  # type: ignore
    serializer_class = RefreshPreparednessLaucherSerializer

    def create(self, request):
        serializer = RefreshPreparednessLaucherSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        task = refresh_data(campaigns=[data["obr_name"]], user=request.user)
        return Response({"task": TaskSerializer(instance=task).data})
