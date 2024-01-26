import enum
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework import filters
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import GenericReadWritePerm, ModelViewSet, Paginator
from iaso.models import OrgUnit
from plugins.polio.models import (
    DestructionReport,
    IncidentReport,
    OutgoingStockMovement,
    VaccineArrivalReport,
    VaccineRequestForm,
    VaccineStock,
)


class MovementTypeEnum(enum.Enum):
    DESTRUCTION_REPORT = "destruction_report"
    INCIDENT_REPORT = "incident_report"
    OUTGOING_STOCK_MOVEMENT = "outgoing_stock_movement"
    VACCINE_ARRIVAL_REPORT = "vaccine_arrival_report"


class VaccineStockSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name")
    country_id = serializers.IntegerField(source="country.id")
    vaccine_type = serializers.CharField(source="vaccine")
    vials_received = serializers.SerializerMethodField()
    vials_used = serializers.SerializerMethodField()
    stock_of_usable_vials = serializers.SerializerMethodField()
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


class StockManagementCustomFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, _view):
        country_id = request.GET.get("country_id")
        vaccine_type = request.GET.get("vaccine_type")

        if country_id:
            queryset = queryset.filter(country_id=country_id)
        if vaccine_type:
            queryset = queryset.filter(vaccine=vaccine_type)

        current_order = request.GET.get("order")

        if current_order:
            if current_order == "country_name":
                queryset = queryset.order_by("country__name")
            elif current_order == "-country_name":
                queryset = queryset.order_by("-country__name")
            elif current_order == "vaccine_type":
                queryset = queryset.order_by("vaccine")
            elif current_order == "-vaccine_type":
                queryset = queryset.order_by("-vaccine")

        return queryset


class VaccineStockManagementViewSet(ModelViewSet):
    permission_classes = [VaccineStockManagementReadWritePerm]
    serializer_class = VaccineStockSerializer
    http_method_names = ["get", "head", "options"]

    model = VaccineStock

    filter_backends = [SearchFilter, StockManagementCustomFilter]
    search_fields = ["vaccine", "country__name"]

    @action(detail=False, methods=["get"])
    def summary(self, request):
        vaccine_stock_id = request.GET.get("id")
        account = request.user.iaso_profile.account

        try:
            vaccine_stock = VaccineStock.objects.get(id=vaccine_stock_id, account=account)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found for "}, status=status.HTTP_404_NOT_FOUND)

        # Aggregate the data for the summary
        total_usable_vials = sum(stock.usable_vials for stock in vaccine_stocks)
        total_unusable_vials = sum(stock.unusable_vials for stock in vaccine_stocks)
        total_usable_doses = sum(stock.usable_doses for stock in vaccine_stocks)
        total_unusable_doses = sum(stock.unusable_doses for stock in vaccine_stocks)

        summary_data = {
            "country_name": vaccine_stocks.first().country.name,
            "vaccine_type": vaccine_type,
            "total_usable_vials": total_usable_vials,
            "total_unusable_vials": total_unusable_vials,
            "total_usable_doses": total_usable_doses,
            "total_unusable_doses": total_unusable_doses,
        }

        return Response(summary_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def usable_vials(self, request, pk=None):
        if pk is None:
            return Response({"error": "No VaccineStock ID provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)

        # First find the corresponding VaccineRequestForms
        vrfs = VaccineRequestForm.objects.filter(
            campaign__country=vaccine_stock.country, vaccine_type=vaccine_stock.vaccine
        )
        if not vrfs.exists():
            return Response(
                {"error": "No VaccineRequestForm found for the given VaccineStock Country and Vaccine Type"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Then find the corresponding VaccineArrivalReports
        arrival_reports = VaccineArrivalReport.objects.filter(request_form__in=vrfs)
        if not arrival_reports.exists():
            arrival_reports = []

        destruction_reports = DestructionReport.objects.filter(vaccine_stock=vaccine_stock).order_by(
            "destruction_report_date"
        )
        incident_reports = IncidentReport.objects.filter(vaccine_stock=vaccine_stock).order_by(
            "date_of_incident_report"
        )
        stock_movements = OutgoingStockMovement.objects.filter(vaccine_stock=vaccine_stock).order_by("report_date")

        results = []

        for report in arrival_reports:
            results.append(
                {
                    "date": report.arrival_report_date,
                    "action": "PO #" + report.po_number if report.po_number else "Stock Arrival",
                    "vials_in": report.vials_received,
                    "doses_in": report.doses_received,
                    "vials_out": None,
                    "doses_out": None,
                    "type": MovementTypeEnum.VACCINE_ARRIVAL_REPORT.value,
                }
            )

        for report in destruction_reports:
            results.append(
                {
                    "date": report.destruction_report_date,
                    "action": f"{report.action} ({report.lot_number})"
                    if len(report.action) > 0
                    else f"Stock Destruction ({report.lot_number})",
                    "vials_in": None,
                    "doses_in": None,
                    "vials_out": report.unusable_vials_destroyed,
                    "doses_out": "N/A",  # can't compute with current model
                    "type": MovementTypeEnum.DESTRUCTION_REPORT.value,
                }
            )

        for report in incident_reports:
            results.append(
                {
                    "date": report.date_of_incident_report,
                    "action": report.stock_correction,
                    "vials_in": None,
                    "doses_in": None,
                    "vials_out": report.unusable_vials + report.usable_vials,
                    "doses_out": "N/A",  # can't compute with current model
                    "type": MovementTypeEnum.INCIDENT_REPORT.value,
                }
            )

        for movement in stock_movements:
            if movement.usable_vials_used > 0:
                results.append(
                    {
                        "date": movement.report_date,
                        "action": "Form A - Vials Used",
                        "vials_in": None,
                        "doses_in": None,
                        "vials_out": movement.usable_vials_used,
                        "doses_out": "N/A",  # can't compute with current model
                        "type": MovementTypeEnum.OUTGOING_STOCK_MOVEMENT.value,
                    }
                )
            elif movement.unusable_vials > 0:
                results.append(
                    {
                        "date": movement.report_date,
                        "action": "Form A - Unusable Vials",
                        "vials_in": None,
                        "doses_in": None,
                        "vials_out": movement.unusable_vials,
                        "doses_out": "N/A",  # can't compute with current model
                        "type": MovementTypeEnum.OUTGOING_STOCK_MOVEMENT.value,
                    }
                )
            elif movement.missing_vials > 0:
                results.append(
                    {
                        "date": movement.report_date,
                        "action": "Form A - Missing Vials",
                        "vials_in": None,
                        "doses_in": None,
                        "vials_out": movement.missing_vials,
                        "doses_out": "N/A",  # can't compute with current model
                        "type": MovementTypeEnum.OUTGOING_STOCK_MOVEMENT.value,
                    }
                )

        paginator = Paginator()
        page = paginator.paginate_queryset(sorted(results, key=lambda x: x["date"]), request)
        if page is not None:
            return paginator.get_paginated_response(page)
        return Response({"results": results})

    @action(detail=True, methods=["get"])
    def get_unusable_vials(self, request, pk=None):
        pass

    @action(detail=True, methods=["get"])
    def get_summary(self, request, pk=None):
        pass

    def get_queryset(self):
        return (
            VaccineStock.objects.filter(account=self.request.user.iaso_profile.account)
            .prefetch_related("destructionreport_set", "incidentreport_set", "outgoingstockmovement_set")
            .distinct()
            .order_by("id")
        )
