from drf_spectacular.utils import extend_schema

from plugins.polio.api.vaccines.permissions import VaccineStockPermission
from plugins.polio.api.vaccines.stock_management.incidents.serializers import IncidentReportSerializer
from plugins.polio.api.vaccines.stock_management.subitems import VaccineStockSubitemBase
from plugins.polio.models import IncidentReport
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
    POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
)


@extend_schema(tags=["Polio - Inicdent reports"])
class IncidentReportViewSet(VaccineStockSubitemBase):
    serializer_class = IncidentReportSerializer
    model_class = IncidentReport
    permission_classes = [
        lambda: VaccineStockPermission(
            admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_WRITE_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_MANAGEMENT_READ_ONLY_PERMISSION,
        )
    ]
    ordering_fields = ["doses_per_vial"]
