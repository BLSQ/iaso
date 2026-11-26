from collections import defaultdict
from decimal import Decimal, InvalidOperation
from logging import getLogger
from typing import Any, Optional

from django.db import transaction
from django.db.models import Exists, OuterRef
from django.db.models.functions import Coalesce

from beanstalk_worker import task_decorator
from iaso.api.stocks.use_cases import compute_new_stock_item_value
from iaso.models import (
    Instance,
    StockItem,
    StockItemRule,
    StockKeepingUnit,
    StockLedgerItem,
    StockRulesVersion,
    Task,
)
from iaso.utils.dates import get_beginning_of_day, get_end_of_day


logger = getLogger(__name__)

BATCH_SIZE = 500
PROGRESS_REPORT_INTERVAL = 100


def _parse_question_value(raw_value: Any) -> Optional[int]:
    """
    Parse an Instance.json question value into a non-zero integer.

    Returns None if the value is missing, empty, None, or 0 (so no ledger item
    should be created). Raises ValueError if the value cannot be represented as
    an integer.
    """
    if raw_value is None or isinstance(raw_value, bool):
        return None

    if isinstance(raw_value, int):
        return raw_value if raw_value != 0 else None

    if isinstance(raw_value, str):
        stripped = raw_value.strip()
        if not stripped:
            return None
        try:
            decimal_value = Decimal(stripped)
        except InvalidOperation as exc:
            raise ValueError(f"Non-numeric value: {raw_value!r}") from exc
    elif isinstance(raw_value, (float, Decimal)):
        try:
            decimal_value = Decimal(str(raw_value))
        except InvalidOperation as exc:
            raise ValueError(f"Non-numeric value: {raw_value!r}") from exc
    else:
        raise ValueError(f"Unsupported value type {type(raw_value).__name__}: {raw_value!r}")

    if not decimal_value.is_finite():
        raise ValueError(f"Non-finite value: {raw_value!r}")

    if decimal_value == 0.0:
        return None

    int_value = int(decimal_value)
    if decimal_value != int_value:
        raise ValueError(f"Non-integer value: {raw_value!r}")

    return int_value


@task_decorator(task_name="apply_stock_rules")
def apply_stock_rules(
    sku_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    *,
    task: Task,
):
    """
    Background task that applies the currently published stock rules set for a
    given StockKeepingUnit across eligible Instances (optionally bounded by
    [start_date, end_date]) that do not yet have any StockLedgerItem attached
    for that SKU.
    """
    task.report_progress_and_stop_if_killed(progress_message="Validating parameters and loading published stock rules")

    start_dt = get_beginning_of_day(start_date, "start_date") if start_date else None
    end_dt = get_end_of_day(end_date, "end_date") if end_date else None
    if start_dt and end_dt and start_dt > end_dt:
        raise ValueError("'end_date' must be greater than or equal to 'start_date'.")

    sku = (
        StockKeepingUnit.objects.filter(account_id=task.account_id, deleted_at=None)
        .prefetch_related("org_unit_types", "projects")
        .get(id=sku_id)
    )

    published_version = (
        StockRulesVersion.objects.filter(account_id=sku.account_id, deleted_at=None).filter_published().first()
    )
    if published_version is None:
        raise ValueError(f"No published StockRulesVersion found for account {sku.account_id}.")

    org_unit_type_ids = list(sku.org_unit_types.values_list("id", flat=True))
    if not org_unit_type_ids:
        task.report_success(message=f"SKU {sku.id} has no org unit types configured; 0 stock ledger items created.")
        return

    project_ids = list(sku.projects.values_list("id", flat=True))
    if not project_ids:
        task.report_success(message=f"SKU {sku.id} has no projects configured; 0 stock ledger items created.")
        return

    rules = list(published_version.rules.filter(sku=sku).order_by("order", "id"))
    if not rules:
        task.report_success(
            message=f"Published rules version {published_version.id} has no rules for SKU {sku.id}; 0 stock ledger items created."
        )
        return

    rules_by_form_id: dict[int, list[StockItemRule]] = defaultdict(list)
    for rule in rules:
        rules_by_form_id[rule.form_id].append(rule)

    existing_ledger_subquery = StockLedgerItem.objects.filter(
        submission_id=OuterRef("pk"),
        sku_id=sku.id,
    )
    instances_qs = (
        Instance.non_deleted_objects.filter(
            project_id__in=project_ids,
            project__account_id=sku.account_id,
            org_unit__org_unit_type_id__in=org_unit_type_ids,
            form_id__in=rules_by_form_id.keys(),
            json__isnull=False,
        )
        .exclude(device__test_device=True)
        .annotate(creation_timestamp=Coalesce("source_created_at", "created_at"))
        .filter(~Exists(existing_ledger_subquery))
        .only(
            "id",
            "form_id",
            "org_unit_id",
            "created_by_id",
            "created_at",
            "source_created_at",
            "json",
        )
        .order_by("creation_timestamp", "id")
    )
    if start_dt:
        instances_qs = instances_qs.filter(creation_timestamp__gte=start_dt)
    if end_dt:
        instances_qs = instances_qs.filter(creation_timestamp__lte=end_dt)

    total_instances = instances_qs.count()
    if total_instances == 0:
        task.report_success(message="0 eligible instances found; 0 stock ledger items created.")
        return

    task.report_progress_and_stop_if_killed(
        progress_value=0,
        end_value=total_instances,
        progress_message=f"Processing {total_instances} eligible instances",
    )

    created_ledger_count = 0
    invalid_values_count = 0
    affected_org_unit_ids: set[int] = set()
    ledger_batch: list[StockLedgerItem] = []

    with transaction.atomic():
        for index, instance in enumerate(instances_qs.iterator(chunk_size=BATCH_SIZE), start=1):
            if index % PROGRESS_REPORT_INTERVAL == 0:
                task.report_progress_and_stop_if_killed(
                    progress_value=index,
                    end_value=total_instances,
                    progress_message=f"Processed {index}/{total_instances} instances ({created_ledger_count} ledger items created)",
                )

            instance_json = instance.json
            if not isinstance(instance_json, dict) or not instance_json:
                continue

            created_by_id = instance.created_by_id or task.launcher_id
            if created_by_id is None:
                raise ValueError(
                    f"Cannot create StockLedgerItem for instance {instance.id}: "
                    "neither instance.created_by nor task.launcher is set."
                )

            ledger_created_at = instance.source_created_at_with_fallback

            for rule in rules_by_form_id[instance.form_id]:
                raw_value = instance_json.get(rule.question)
                try:
                    parsed_value = _parse_question_value(raw_value)
                except ValueError as exc:
                    invalid_values_count += 1
                    logger.warning(
                        "Skipping invalid value for SKU %s, rule %s (question=%r) on instance %s: %s",
                        sku.id,
                        rule.id,
                        rule.question,
                        instance.id,
                        exc,
                    )
                    continue

                if parsed_value is None:
                    continue

                ledger_batch.append(
                    StockLedgerItem(
                        sku=sku,
                        org_unit_id=instance.org_unit_id,
                        rule=rule,
                        submission=instance,
                        question=rule.question,
                        value=parsed_value,
                        impact=rule.impact,
                        created_by_id=created_by_id,
                        created_at=ledger_created_at,
                    )
                )
                affected_org_unit_ids.add(instance.org_unit_id)

                if len(ledger_batch) >= BATCH_SIZE:
                    StockLedgerItem.objects.bulk_create(ledger_batch, batch_size=BATCH_SIZE)
                    created_ledger_count += len(ledger_batch)
                    ledger_batch.clear()

        if ledger_batch:
            StockLedgerItem.objects.bulk_create(ledger_batch, batch_size=BATCH_SIZE)
            created_ledger_count += len(ledger_batch)
            ledger_batch.clear()

        if affected_org_unit_ids:
            task.report_progress_and_stop_if_killed(
                progress_value=total_instances,
                end_value=total_instances,
                progress_message=f"Recomputing stock balances for {len(affected_org_unit_ids)} org units",
            )
            for org_unit_id in sorted(affected_org_unit_ids):
                stock_item, _ = StockItem.objects.get_or_create(org_unit_id=org_unit_id, sku=sku)
                stock_item.value = compute_new_stock_item_value(stock_item)
                stock_item.save()

    summary = (
        f"Processed {total_instances} instances, created {created_ledger_count} stock ledger items, "
        f"updated {len(affected_org_unit_ids)} stock items"
    )
    if invalid_values_count:
        summary += f" ({invalid_values_count} invalid question values skipped)"

    task.report_success(message=summary)
