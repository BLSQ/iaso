from rest_framework import permissions, serializers, viewsets
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import HasPermission
from iaso.api.tasks.serializers import TaskSerializer
from plugins.polio.models import Campaign
from plugins.polio.tasks.refresh_preparedness_data import refresh_data


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
