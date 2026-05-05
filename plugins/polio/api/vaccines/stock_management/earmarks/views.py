from django.db.models import Q
from drf_spectacular.utils import extend_schema

from plugins.polio.api.vaccines.permissions import VaccineStockEarmarkPermission
from plugins.polio.api.vaccines.stock_management.earmarks.filters import EarmarkedStockFilter
from plugins.polio.api.vaccines.stock_management.earmarks.serializers import EarmarkedStockSerializer
from plugins.polio.api.vaccines.stock_management.subitems import VaccineStockSubitemEdit
from plugins.polio.models import EarmarkedStock
from plugins.polio.permissions import (
    POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
    POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
)


@extend_schema(tags=["Polio - EAR marked stocks"])
class EarmarkedStockViewSet(VaccineStockSubitemEdit):
    serializer_class = EarmarkedStockSerializer
    model_class = EarmarkedStock
    filterset_class = EarmarkedStockFilter
    permission_classes = [
        lambda: VaccineStockEarmarkPermission(
            admin_perm=POLIO_VACCINE_STOCK_EARMARKS_ADMIN_PERMISSION,
            non_admin_perm=POLIO_VACCINE_STOCK_EARMARKS_NONADMIN_PERMISSION,
            read_only_perm=POLIO_VACCINE_STOCK_EARMARKS_READ_ONLY_PERMISSION,
        )
    ]
    ordering_fields = ["doses_per_vial"]

    def get_queryset(self):
        return (
            EarmarkedStock.objects.filter(vaccine_stock__account=self.request.user.iaso_profile.account)
            .select_related("vaccine_stock", "campaign", "round")
            .filter(Q(temporary_campaign_name="") & Q(round__on_hold=False) | ~Q(temporary_campaign_name=""))
        )
