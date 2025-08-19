import logging

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

    stock_item = StockItem.objects.get_or_create(org_unit=instance.org_unit, sku=rule.sku)

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
    stock_item.value = _compute_new_stock_item_value(stock_item)
    stock_item.save()


def _compute_new_stock_item_value(stock_item: StockItem):
    last_reset = (
        StockLedgerItem.objects.filter(sku=stock_item.sku, org_unit=stock_item.org_unit, impact=StockImpacts.RESET)
        .order("-created_at")
        .first()
    )
    items_since_last_reset = StockLedgerItem.objects.filter(
        sku=stock_item.sku,
        org_unit=stock_item.org_unit,
        created_at__gt=last_reset.created_at if last_reset is not None else 0,
    ).all()
    value = last_reset.value if last_reset is not None else 0
    for item in items_since_last_reset:
        if item.impact == StockImpacts.ADD:
            stock_item.value += item.value
        elif item.impact == StockImpacts.SUBTRACT:
            stock_item.value -= item.value
        elif item.impact == StockImpacts.RESET:
            raise ValueError(f"Impact `{StockImpacts.RESET}` should not be found here")
        else:
            raise ValueError(f"Unknown impact `{item.impact}`")

    return value
