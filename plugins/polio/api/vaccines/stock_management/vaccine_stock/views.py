from datetime import date
from tempfile import NamedTemporaryFile

from django.http import HttpResponse
from django.utils.dateparse import parse_date
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import SearchFilter
from rest_framework.response import Response

from iaso.api.common import CONTENT_TYPE_XLSX, ModelViewSet, Paginator
from iaso.models import OrgUnit
from iaso.models.json_config import Config
from plugins.polio.api.vaccines.common import sort_results
from plugins.polio.api.vaccines.export_utils import download_xlsx_stock_variants
from plugins.polio.api.vaccines.permissions import VaccineStockPermission
from plugins.polio.api.vaccines.stock_management.vaccine_stock.filters import StockManagementCustomFilter
from plugins.polio.api.vaccines.stock_management.vaccine_stock.serializers import (
    VaccineStockCreateSerializer,
    VaccineStockSerializer,
)
from plugins.polio.models import VaccineStock
from plugins.polio.models.base import DOSES_PER_VIAL_CONFIG_SLUG, VaccineStockCalculator
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)


@extend_schema(tags=["Polio - Vaccine stock management"])
class VaccineStockManagementViewSet(ModelViewSet):
    """
    ViewSet for managing Vaccine Stock data.

    This ViewSet provides actions to retrieve and manage stock information
    for vaccines, including summaries of usable and unusable vials, and
    detailed movements such as arrivals, destructions, and incidents.

    Available endpoints :

    GET /api/polio/vaccine/vaccine_stock/
    Return a list of summary informations for a VaccineStock. (Used by the Vaccine Stock list view)

    POST /api/polio/vaccine/vaccine_stock/
    Add a new VaccineStock.

    GET /api/polio/vaccine/vaccine_stock/{id}/
    Return a specific item from the previous list.

    DELETE /api/polio/vaccine/vaccine_stock/{id}/
    Delete a vaccine stock. All related OutgoingMovements, IncidentReports and Destructions will also be deleted.

    GET /api/polio/vaccine/vaccine_stock/{id}/summary/
    Return a summary of vaccine stock for a given VaccineStock ID (Used on detail page)

    GET /api/polio/vaccine/vaccine_stock/{id}/usable_vials/
    Return a detailed list of movements for usable vials associated with a given VaccineStock ID.

    GET /api/polio/vaccine/vaccine_stock/{id}/unusable_vials/
    Return a detailed list of movements for unusable vials associated with a given VaccineStock ID.



    """

    permission_classes = [
        lambda: VaccineStockPermission(
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )
    ]
    serializer_class = VaccineStockSerializer
    http_method_names = ["get", "head", "options", "post", "delete"]

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

    def create(self, request):
        """
        Add a new VaccineStock.

        This endpoint is used to add a new VaccineStock to the database.
        The request body should include the country ID and vaccine type.
        """
        serializer = VaccineStockCreateSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def summary(self, _, pk=None):
        """
        Retrieve a summary of vaccine stock for a given VaccineStock ID.

        The summary includes the country name, vaccine type, total usable and unusable vials,
        and corresponding doses.
        """
        if pk is None:
            return Response(
                {"error": "No VaccineStock ID provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response(
                {"error": "VaccineStock not found for "},
                status=status.HTTP_404_NOT_FOUND,
            )

        calculator = VaccineStockCalculator(vaccine_stock)

        _, total_usable_doses = calculator.get_total_of_usable_vials()
        (
            total_unusable_vials,
            total_unusable_doses,
        ) = calculator.get_total_of_unusable_vials()
        (
            _,
            total_earmarked_doses,
        ) = calculator.get_total_of_earmarked()

        summary_data = {
            "country_id": vaccine_stock.country.id,
            "country_name": vaccine_stock.country.name,
            "vaccine_type": vaccine_stock.vaccine,
            "total_usable_doses": total_usable_doses,
            "total_earmarked_doses": total_earmarked_doses,
            "total_unusable_doses": total_unusable_doses,
            "total_unusable_vials": total_unusable_vials,
        }

        return Response(summary_data, status=status.HTTP_200_OK)

    @action(
        detail=True,
        methods=["get"],
    )
    def usable_vials(self, request, pk=None):
        """
        Retrieve a detailed list of movements for usable vials associated with a given VaccineStock ID.

        This includes information on stock arrivals, destructions, incidents, and outgoing stock movements.
        Each movement is timestamped and includes the number of vials and doses affected.
        """
        if pk is None:
            return Response(
                {"error": "No VaccineStock ID provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)

        end_date = request.query_params.get("end_date", None)
        if end_date:
            parsed_end_date = parse_date(end_date)
            if not parsed_end_date:
                raise ValidationError("The 'end_date' query parameter is not a valid date.")

        calc = VaccineStockCalculator(vaccine_stock)
        results = calc.get_list_of_usable_vials(end_date)
        results = sort_results(request, results)

        export_xlsx = request.query_params.get("export_xlsx", False)

        if export_xlsx:
            today = date.today().isoformat()
            filename = f"{today}-{vaccine_stock.country.name}-{vaccine_stock.vaccine}-stock-card-export"
            workbook = download_xlsx_stock_variants(
                request,
                filename,
                results,
                {
                    "Unusable": lambda: calc.get_list_of_unusable_vials(end_date),
                    "Earmarked": lambda: calc.get_list_of_earmarked(end_date),
                },
                vaccine_stock,
                "Usable",
            )
            with NamedTemporaryFile() as tmp:
                workbook.save(tmp.name)
                tmp.seek(0)
                stream = tmp.read()

            response = HttpResponse(stream, content_type=CONTENT_TYPE_XLSX)
            response["Content-Disposition"] = "attachment; filename=%s" % filename + ".xlsx"
            return response

        paginator = Paginator()
        page = paginator.paginate_queryset(results, request)
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
            return Response(
                {"error": "No VaccineStock ID provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            vaccine_stock = self.get_queryset().get(id=pk)
        except VaccineStock.DoesNotExist:
            return Response({"error": "VaccineStock not found"}, status=status.HTTP_404_NOT_FOUND)

        end_date = request.query_params.get("end_date", None)
        if end_date:
            parsed_end_date = parse_date(end_date)
            if not parsed_end_date:
                raise ValidationError("The 'end_date' query parameter is not a valid date.")

        calc = VaccineStockCalculator(vaccine_stock, end_date)
        results = calc.get_list_of_unusable_vials()
        results = sort_results(request, results)

        export_xlsx = request.query_params.get("export_xlsx", False)

        if export_xlsx:
            today = date.today().isoformat()
            filename = f"{today}-{vaccine_stock.country.name}-{vaccine_stock.vaccine}-stock-card-export"
            workbook = download_xlsx_stock_variants(
                request,
                filename,
                results,
                {
                    "Usable": lambda: calc.get_list_of_usable_vials(),
                    "Earmarked": lambda: calc.get_list_of_earmarked(),
                },
                vaccine_stock,
                "Unusable",
            )
            with NamedTemporaryFile() as tmp:
                workbook.save(tmp.name)
                tmp.seek(0)
                stream = tmp.read()

            response = HttpResponse(stream, content_type=CONTENT_TYPE_XLSX)
            response["Content-Disposition"] = "attachment; filename=%s" % filename + ".xlsx"
            return response

        paginator = Paginator()
        page = paginator.paginate_queryset(results, request)
        if page is not None:
            return paginator.get_paginated_response(page)
        return Response({"results": results})

    def get_serializer_class(self):
        if self.action == "create":
            return VaccineStockCreateSerializer
        return VaccineStockSerializer

    def get_queryset(self):
        """
        Get the queryset for VaccineStock objects.

        The queryset is filtered by the account of the logged-in user and includes
        related destruction reports, incident reports, and outgoing stock movements.
        It is ordered by the VaccineStock ID.
        """

        accessible_org_units = OrgUnit.objects.filter_for_user_and_app_id(
            self.request.user, self.request.query_params.get("app_id")
        )
        accessible_org_units_ids = accessible_org_units.values_list("id", flat=True)

        return (
            VaccineStock.objects.filter(
                account=self.request.user.iaso_profile.account,
                country__id__in=accessible_org_units_ids,
            )
            .prefetch_related(
                "destructionreport_set",
                "incidentreport_set",
                "outgoingstockmovement_set",
                "earmarked_stocks",
            )
            .distinct()
            .order_by("id")
        )

    @action(detail=False, methods=["get"])
    def doses_options(self, request):
        """_summary_
        Uses the VaccineArrivalReports as source of truth for available dose_per_vial values and returns a list of dropdown options with available values
        """
        stock_id = request.GET.get("stockId", None)
        if not stock_id:
            return Response("stock id not provided", status=status.HTTP_400_BAD_REQUEST)
        try:
            stock_id = int(stock_id)
        except:
            return Response("stock id must be a number", status=status.HTTP_400_BAD_REQUEST)

        vaccine_stock = VaccineStock.objects.filter(id=stock_id).first()
        if not vaccine_stock:
            return Response(status=status.HTTP_404_NOT_FOUND)

        vaccine = vaccine_stock.vaccine
        try:
            config = Config.objects.get(slug=DOSES_PER_VIAL_CONFIG_SLUG)
        except Config.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        options = config.content[vaccine]
        calculator = VaccineStockCalculator(vaccine_stock)
        doses_available = calculator.get_usable_stock_by_vaccine_presentation()
        unusable_doses = calculator.get_unusable_stock_by_vaccine_presentation()
        results = []
        for option in options:
            results.append(
                {
                    "label": str(option),
                    "value": option,
                    "doses_available": doses_available[str(option)],
                    "unusable_doses": unusable_doses[str(option)],
                }
            )
        return Response({"results": results}, status=status.HTTP_200_OK)


class EmbeddedVaccineStockManagementViewset(VaccineStockManagementViewSet):
    """
    Publicly available version of the VaccineStockManagement API
    Used for embedding a view in RRT's website.
    We don't just change the existing API, because inside iaso, we still need to restrict some access based on user country.
    """

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ["get", "head", "options"]
