from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

from plugins.polio.api.vaccines.permissions import VaccineStockPermission
from plugins.polio.api.vaccines.stock_management.destructions.serializers import DestructionReportSerializer
from plugins.polio.api.vaccines.stock_management.subitems import VaccineStockSubitemBase
from plugins.polio.models import DestructionReport, VaccineStock
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)


@extend_schema(tags=["Polio - Destruction reports"])
class DestructionReportViewSet(VaccineStockSubitemBase):
    serializer_class = DestructionReportSerializer
    model_class = DestructionReport
    permission_classes = [
        lambda: VaccineStockPermission(
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )
    ]
    ordering_fields = ["doses_per_vial"]

    @action(detail=False, methods=["GET"])
    def check_duplicate(self, request):
        vaccine_stock_id = request.query_params.get("vaccine_stock")
        destruction_report_date = request.query_params.get("destruction_report_date")
        unusable_vials_destroyed = request.query_params.get("unusable_vials_destroyed")
        destruction_report_id = request.query_params.get("destruction_report_id")

        if not all([vaccine_stock_id, destruction_report_date, unusable_vials_destroyed]):
            return Response({"error": "Missing required parameters"}, status=status.HTTP_400_BAD_REQUEST)

        # Check if vaccine stock exists
        if not VaccineStock.objects.filter(id=vaccine_stock_id).exists():
            return Response({"error": "Vaccine stock not found"}, status=status.HTTP_404_NOT_FOUND)

        # Build the filter query
        filter_query = {
            "vaccine_stock_id": vaccine_stock_id,
            "destruction_report_date": destruction_report_date,
            "unusable_vials_destroyed": unusable_vials_destroyed,
        }

        # If editing an existing report, exclude it from the duplicate check
        if destruction_report_id:
            existing_destruction = (
                DestructionReport.objects.exclude(id=destruction_report_id).filter(**filter_query).exists()
            )
        else:
            existing_destruction = DestructionReport.objects.filter(**filter_query).exists()

        return Response({"duplicate_exists": existing_destruction})
