from rest_framework import serializers, status, viewsets
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import GenericReadWritePerm, ModelViewSet
from iaso.models import OrgUnit
from plugins.polio.models import (
    DestructionReport,
    IncidentReport,
    OutgoingStockMovement,
    VaccineArrivalReport,
    VaccineStock,
)


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
        stock_movements = OutgoingStockMovement.objects.filter(vaccine_stock=obj)
        return (
            sum(report.unusable_vials_destroyed for report in destruction_reports)
            + sum(report.unusable_vials for report in incident_reports)
            + sum(movement.unusable_vials for movement in stock_movements)
        )

    def get_vials_destroyed(self, obj):
        destruction_reports = DestructionReport.objects.filter(vaccine_stock=obj)
        return sum(report.unusable_vials_destroyed for report in destruction_reports)


class VaccineStockManagementReadWritePerm(GenericReadWritePerm):
    read_perm = permission.POLIO_VACCINE_STOCK_MANAGEMENT_READ
    write_perm = permission.POLIO_VACCINE_STOCK_MANAGEMENT_WRITE


class VaccineStockManagementViewSet(ModelViewSet):
    permission_classes = [VaccineStockManagementReadWritePerm]
    serializer_class = VaccineStockSerializer
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        return (
            VaccineStock.objects.filter(account=self.request.user.iaso_profile.account)
            .prefetch_related("destructionreport_set", "incidentreport_set", "outgoingstockmovement_set")
            .distinct()
            .order_by("id")
        )
