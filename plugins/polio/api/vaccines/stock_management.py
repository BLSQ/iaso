import enum
from typing import Union

from django.db.models import QuerySet
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
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
    DOSES_PER_VIAL,
)


class MovementTypeEnum(enum.Enum):
    DESTRUCTION_REPORT = "destruction_report"
    INCIDENT_REPORT = "incident_report"
    OUTGOING_STOCK_MOVEMENT = "outgoing_stock_movement"
    VACCINE_ARRIVAL_REPORT = "vaccine_arrival_report"


class VaccineStockCalculator:
    def __init__(self, vaccine_stock: VaccineStock):
        if not isinstance(vaccine_stock, VaccineStock):
            raise TypeError("vaccine_stock must be a VaccineStock object")

        self.vaccine_stock = vaccine_stock
        self.arrival_reports = VaccineArrivalReport.objects.filter(
            request_form__campaign__country=vaccine_stock.country, request_form__vaccine_type=vaccine_stock.vaccine
        )
        self.destruction_reports = DestructionReport.objects.filter(vaccine_stock=vaccine_stock).order_by(
            "destruction_report_date"
        )
        self.incident_reports = IncidentReport.objects.filter(vaccine_stock=vaccine_stock).order_by(
            "date_of_incident_report"
        )
        self.stock_movements = OutgoingStockMovement.objects.filter(vaccine_stock=vaccine_stock).order_by("report_date")

    def get_doses_per_vial(self):
        return DOSES_PER_VIAL[self.vaccine_stock.vaccine]

    def get_vials_received(self):
        return sum(report.vials_received for report in self.arrival_reports)

    def get_vials_used(self):
        return sum(movement.usable_vials_used for movement in self.stock_movements)

    def get_stock_of_usable_vials(self):
        return self.get_vials_received() - self.get_vials_used()

    def get_stock_of_unusable_vials(self):
        return (
            # sum(report.unusable_vials_destroyed for report in self.destruction_reports) +
            sum(report.unusable_vials for report in self.incident_reports)
            + sum(movement.unusable_vials for movement in self.stock_movements)
        )

    def get_vials_destroyed(self):
        return sum(report.unusable_vials_destroyed for report in self.destruction_reports)


class VaccineStockListSerializer(serializers.ListSerializer):
    @staticmethod
    def calculate_for_instance(instance):
        instance.calculator = VaccineStockCalculator(instance)

    def to_representation(self, data):
        """
        List of object instances -> List of dicts of primitive datatypes.
        """
        # Calculate once for each instance
        for instance in data:
            self.calculate_for_instance(instance)
        return [VaccineStockSerializer(instance).data for instance in data]


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
        list_serializer_class = VaccineStockListSerializer

    def get_vials_received(self, obj):
        return obj.calculator.get_vials_received()

    def get_vials_used(self, obj):
        return obj.calculator.get_vials_used()

    def get_stock_of_usable_vials(self, obj):
        return obj.calculator.get_stock_of_usable_vials()

    def get_stock_of_unusable_vials(self, obj):
        return obj.calculator.get_stock_of_unusable_vials()

    def get_vials_destroyed(self, obj):
        return obj.calculator.get_vials_destroyed()


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
    """
    ViewSet for managing Vaccine Stock data.

    This ViewSet provides actions to retrieve and manage stock information
    for vaccines, including summaries of usable and unusable vials, and
    detailed movements such as arrivals, destructions, and incidents.

    Available endpoints :

    GET /api/polio/vaccine/vaccine_stock/
    Return a list of summary informations for a VaccineStock. (Used by the Vaccine Stock list view)

    GET /api/polio/vaccine/vaccine_stock/{id}/
    Return a specific item from the previous list.

    GET /api/polio/vaccine/vaccine_stock/{id}/summary/
    Return a summary of vaccine stock for a given VaccineStock ID (Used on detail page)

    GET /api/polio/vaccine/vaccine_stock/{id}/usable_vials/
    Return a detailed list of movements for usable vials associated with a given VaccineStock ID.

    GET /api/polio/vaccine/vaccine_stock/{id}/unusable_vials/
    Return a detailed list of movements for unusable vials associated with a given VaccineStock ID.


    """

    permission_classes = [VaccineStockManagementReadWritePerm]
    serializer_class = VaccineStockSerializer
    http_method_names = ["get", "head", "options"]

    model = VaccineStock

    filter_backends = [SearchFilter, StockManagementCustomFilter]
    search_fields = ["vaccine", "country__name"]

    # We need to override this method to add the calculator on the instance
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if isinstance(instance, VaccineStock):
            instance.calculator = VaccineStockCalculator(instance)
        else:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        """
        Retrieve a summary of vaccine stock for a given VaccineStock ID.

        The summary includes the country name, vaccine type, total usable and unusable vials,
        and corresponding doses.
        """
        if pk is None:
            return Response({"error": "No VaccineStock ID provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found for "}, status=status.HTTP_404_NOT_FOUND)

        calculator = VaccineStockCalculator(vaccine_stock)

        summary_data = {
            "country_name": vaccine_stock.country.name,
            "vaccine_type": vaccine_stock.vaccine,
            "total_usable_vials": calculator.get_stock_of_usable_vials(),
            "total_unusable_vials": calculator.get_stock_of_unusable_vials(),
            "total_usable_doses": calculator.get_stock_of_usable_vials() * calculator.get_doses_per_vial(),
            "total_unusable_doses": calculator.get_stock_of_unusable_vials() * calculator.get_doses_per_vial(),
        }

        return Response(summary_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def usable_vials(self, request, pk=None):
        """
        Retrieve a detailed list of movements for usable vials associated with a given VaccineStock ID.

        This includes information on stock arrivals, destructions, incidents, and outgoing stock movements.
        Each movement is timestamped and includes the number of vials and doses affected.
        """
        if pk is None:
            return Response({"error": "No VaccineStock ID provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)

        calc = VaccineStockCalculator(vaccine_stock)

        # First find the corresponding VaccineRequestForms
        vrfs = VaccineRequestForm.objects.filter(
            campaign__country=vaccine_stock.country, vaccine_type=vaccine_stock.vaccine
        )
        if not vrfs.exists():
            arrival_reports = []
        else:
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
                    "doses_out": report.unusable_vials_destroyed * calc.get_doses_per_vial(),
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
                    "doses_out": (report.unusable_vials + report.usable_vials) * calc.get_doses_per_vial(),
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
                        "doses_out": movement.usable_vials_used * calc.get_doses_per_vial(),
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
                        "doses_out": movement.unusable_vials * calc.get_doses_per_vial(),
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
                        "doses_out": movement.missing_vials * calc.get_doses_per_vial(),
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
        """
        Retrieve a detailed list of movements for unusable vials associated with a given VaccineStock ID.

        This includes information on outgoing stock movements and incident reports
        that resulted in unusable vials, with each movement timestamped and including
        the number of vials and doses affected.
        """
        if pk is None:
            return Response({"error": "No VaccineStock ID provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)

        calc = VaccineStockCalculator(vaccine_stock)

        # Get all OutgoingStockMovements and IncidentReports for the VaccineStock
        outgoing_movements = OutgoingStockMovement.objects.filter(vaccine_stock=vaccine_stock)
        incident_reports = IncidentReport.objects.filter(vaccine_stock=vaccine_stock)

        # Prepare the results list
        results = []

        # Add unusable vials from OutgoingStockMovements
        for movement in outgoing_movements:
            if movement.unusable_vials > 0:
                results.append(
                    {
                        "date": movement.report_date,
                        "action": "Outgoing Movement",
                        "vials_in": None,
                        "doses_in": None,
                        "vials_out": movement.unusable_vials,
                        "doses_out": movement.unusable_vials * calc.get_doses_per_vial(),
                        "type": MovementTypeEnum.OUTGOING_STOCK_MOVEMENT.value,
                    }
                )

        # Add unusable vials from IncidentReports
        for report in incident_reports:
            if report.unusable_vials > 0:
                results.append(
                    {
                        "date": report.date_of_incident_report,
                        "action": report.get_stock_correction_display(),
                        "vials_in": None,
                        "doses_in": None,
                        "vials_out": report.unusable_vials,
                        "doses_out": report.unusable_vials * calc.get_doses_per_vial(),
                        "type": MovementTypeEnum.INCIDENT_REPORT.value,
                    }
                )

        paginator = Paginator()
        page = paginator.paginate_queryset(sorted(results, key=lambda x: x["date"]), request)
        if page is not None:
            return paginator.get_paginated_response(page)
        return Response({"results": results})

    def get_queryset(self):
        """
        Get the queryset for VaccineStock objects.

        The queryset is filtered by the account of the logged-in user and includes
        related destruction reports, incident reports, and outgoing stock movements.
        It is ordered by the VaccineStock ID.
        """
        return (
            VaccineStock.objects.filter(account=self.request.user.iaso_profile.account)
            .prefetch_related("destructionreport_set", "incidentreport_set", "outgoingstockmovement_set")
            .distinct()
            .order_by("id")
        )
