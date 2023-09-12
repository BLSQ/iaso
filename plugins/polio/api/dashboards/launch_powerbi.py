from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers, status, viewsets
from rest_framework.response import Response

from iaso.utils.powerbi import launch_dataset_refresh


class PowerBIRefreshSerializer(serializers.Serializer):
    group_id = serializers.UUIDField()
    data_set_id = serializers.UUIDField()


@swagger_auto_schema()
class LaunchPowerBIRefreshViewSet(viewsets.ViewSet):
    serializer_class = PowerBIRefreshSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        data_set_id = serializer.validated_data["data_set_id"]
        group_id = serializer.validated_data["group_id"]
        # Perform actions using uuid1 and uuid2
        response_data = {"message": f"Received data_set_id: {data_set_id}, group_id: {group_id}"}
        launch_dataset_refresh(group_id, data_set_id)

        return Response(response_data, status=status.HTTP_201_CREATED)
