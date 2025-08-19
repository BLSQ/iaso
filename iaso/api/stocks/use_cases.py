import logging

from datetime import datetime

from django.db.models import Case, F, Sum, When

from iaso.models import (
    Instance,
    StockImpacts,
    StockItem,
    StockItemRule,
    StockLedgerItem,
    StockRulesVersionsStatus,
)


logger = logging.getLogger(__name__)


def apply_stock_management_to_instance(instance: Instance):
    if instance.form is None:
        return
    if instance.org_unit is None:
        return
    if instance.project is None or instance.project.account is None:
        return

    rules = (
        StockItemRule.objects.select_related("sku")
        .prefetch_related("sku__sku_children_parent")
        .filter(
            form=instance.form,
            sku__account=instance.project.account,
            sku__org_unit_types__in=instance.org_unit.org_unit_type,
            version__status=StockRulesVersionsStatus.PUBLISHED,
        )
        .order("order")
        .all()
    )
    for rule in rules:
        try:
            _apply_rule_to_instance(instance, rule)
        except ValueError as error:
            logger.exception(error)


def _apply_rule_to_instance(instance: Instance, rule: StockItemRule):
    try:
        value = int(instance.json[rule.question])
    except ValueError as error:
        logger.exception(error)
        return

    stock_item, _ = StockItem.objects.get_or_create(org_unit=instance.org_unit, sku=rule.sku)

    if stock_item.created_by is None:
        stock_item.created_by = instance.created_by
    stock_item.updated_by = instance.created_by

    StockLedgerItem.objects.create(
        sku=rule.sku,
        org_unit=instance.org_unit,
        submission=instance,
        question=rule.question,
        value=value,
        impact=rule.impact,
        created_at=instance.created_at,
        created_by=instance.created_by,
    )
    stock_item.value = compute_new_stock_item_value(stock_item)
    stock_item.save()


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
