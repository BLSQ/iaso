# export const mockVaccineStockList = {
#     count: 5,
#     page: 1,
#     pages: 1,
#     limit: 20,
#     has_next: false,
#     has_previous: false,
#     results: [
#         {
#             id:1 // The id of the VaccineStock, so we can pass it in the url for the details view
#             country_name: 'CAMEROON',
#             country_id: 29685,
#             vaccine_type: 'bOPV', // from list of vaccines
#             vials_received: 1000,
#             vials_used: 500,
#             stock_of_usable_vials: 300,
#             leftover_ratio: 15,
#             stock_of_unusable_vials: 150,
#             vials_destroyed: 50,
#         },
#     ],
# }

from rest_framework import viewsets, serializers, status
from rest_framework.response import Response
from plugins.polio.models import (
    VaccineStock,
    OutgoingStockMovement,
    DestructionReport,
    IncidentReport,
    VaccineArrivalReport,
)
from iaso.models import OrgUnit
from iaso.api.common import ModelViewSet


class VaccineStockSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name")
    country_id = serializers.IntegerField(source="country.id")
    vaccine_type = serializers.CharField(source="vaccine")
    vials_received = serializers.SerializerMethodField()
    vials_used = serializers.SerializerMethodField()
    stock_of_usable_vials = serializers.SerializerMethodField()
    leftover_ratio = serializers.SerializerMethodField()
    stock_of_unusable_vials = serializers.SerializerMethodField()
    vials_destroyed = serializers.SerializerMethodField()

    class Meta:
        model = VaccineStock
        fields = [
            "id",
            "country_name",
            "country_id",
            "vaccine_type",
            "vials_received",
            "vials_used",
            "stock_of_usable_vials",
            "leftover_ratio",
            "stock_of_unusable_vials",
            "vials_destroyed",
        ]

    def get_vials_received(self, obj):
        arrival_reports = VaccineArrivalReport.objects.filter(
            request_form__campaign__country=obj.country, request_form__vaccine_type=obj.vaccine
        )
        return sum(report.doses_received // report.doses_per_vial for report in arrival_reports)

    def get_vials_used(self, obj):
        stock_movements = OutgoingStockMovement.objects.filter(vaccine_stock=obj)
        return sum(movement.usable_vials_used for movement in stock_movements)

    def get_stock_of_usable_vials(self, obj):
        return self.get_vials_received(obj) - self.get_vials_used(obj)

    def get_leftover_ratio(self, obj):
        # Assuming leftover_ratio is the percentage of vials_used out of vials_received
        vials_received = self.get_vials_received(obj)
        vials_used = self.get_vials_used(obj)
        return (vials_used / vials_received * 100) if vials_received else 0

    def get_stock_of_unusable_vials(self, obj):
        destruction_reports = DestructionReport.objects.filter(vaccine_stock=obj)
        incident_reports = IncidentReport.objects.filter(vaccine_stock=obj)
        return sum(report.unusable_vials_destroyed for report in destruction_reports) + sum(
            report.unusable_vials for report in incident_reports
        )

    def get_vials_destroyed(self, obj):
        destruction_reports = DestructionReport.objects.filter(vaccine_stock=obj)
        return sum(report.unusable_vials_destroyed for report in destruction_reports)


class VaccineStockManagementViewSet(ModelViewSet):
    queryset = VaccineStock.objects.all()
    serializer_class = VaccineStockSerializer
    http_method_names = ["get", "head", "options"]
