from rest_framework import permissions, serializers, viewsets
from rest_framework.response import Response

from iaso.api.common import HasPermission
from iaso.api.tasks.serializers import TaskSerializer
from plugins.polio import permissions as polio_permissions
from plugins.polio.tasks.archive_vaccine_stock_for_rounds import archive_vaccine_stock_for_rounds


class ArchiveVaccineStockSerializer(serializers.Serializer):
    date = serializers.DateField(required=False)
    campaign = serializers.CharField(required=False)  # campaign obr_name
    country = serializers.IntegerField(required=False, default=None)
    vaccine = serializers.CharField(max_length=200, required=False, default=None)  # TODO add choices


class ArchiveVaccineStockViewSet(viewsets.ViewSet):
    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(polio_permissions.POLIO_VACCINE_STOCK_MANAGEMENT_WRITE),
    ]  # type: ignore
    serializer_class = ArchiveVaccineStockSerializer

    def create(self, request):
        data = request.data
        serializer = ArchiveVaccineStockSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        date = data.get("date", None)
        campaign = data.get("campaign", None)
        country = data.get("country", None)
        vaccine = data.get("vaccine", None)

        task = archive_vaccine_stock_for_rounds(
            date=date,
            campaign=campaign,
            country=country,
            vaccine=vaccine,
            user=request.user,
        )
        return Response({"task": TaskSerializer(instance=task).data})
