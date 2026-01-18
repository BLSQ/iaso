import logging

from datetime import datetime

from django.db.models import Case, F, Sum, When

from iaso.models import (
    StockImpacts,
    StockItem,
    StockLedgerItem,
)


logger = logging.getLogger(__name__)


def compute_new_stock_item_value(stock_item: StockItem):
    """
    Calculates the current stock balance for a given StockItem
    """
    queryset = StockLedgerItem.objects.filter(sku=stock_item.sku, org_unit=stock_item.org_unit)
    last_reset = queryset.filter(impact=StockImpacts.RESET).order_by("-created_at").only("created_at").first()

    start_date = last_reset.created_at if last_reset else datetime.fromtimestamp(0)

    stock_balance = queryset.filter(created_at__gte=start_date).aggregate(
        balance=Sum(
            Case(
                When(impact=StockImpacts.SUBTRACT, then=-F("value")),
                default=F("value"),
            )
        )
    )

    return stock_balance["balance"] if stock_balance["balance"] else 0
