from copy import deepcopy

from rest_framework import serializers

from iaso.api.stocks.serializers import StockLedgerItemWriteSerializer
from iaso.api.stocks.use_cases import compute_new_stock_item_value
from iaso.models import Project, StockItem, StockItemRule, StockRulesVersion, StockRulesVersionsStatus


COPY_OF_PREFIX = "Copy of "


def make_deep_copy_with_relations(orig_version: StockRulesVersion, request) -> StockRulesVersion:
    new_version = deepcopy(orig_version)
    new_version.id = None

    new_version.name = COPY_OF_PREFIX + orig_version.name
    if len(new_version.name) > StockRulesVersion.NAME_MAX_LENGTH:
        new_version.name = f"Copy of version {new_version.id}"
    new_version.status = StockRulesVersionsStatus.DRAFT
    new_version.updated_by = request.user
    new_version.save()

    for rule in StockItemRule.objects.filter(version=orig_version):
        new_rule = deepcopy(rule)
        new_rule.id = None
        new_rule.version = new_version
        new_rule.updated_by = request.user
        new_rule.save()

    return new_version


def import_stock_ledger_items(user, app_id, data, queryset):
    project = Project.objects.get_for_user_and_app_id(user, app_id)
    for item in data:
        if queryset.filter(id=item["id"]).exists():
            continue
        serializer = StockLedgerItemWriteSerializer(data=item)
        serializer.is_valid(raise_exception=True)
        sku = serializer.validated_data.get("sku")
        if sku.account != user.iaso_profile.account:
            raise serializers.ValidationError("User doesn't have access to this SKU")
        submission = serializer.validated_data["submission"]
        if submission.project != project:
            raise serializers.ValidationError(
                "You can only create StockLedgerItem on the same project as the submission"
            )
        serializer.validated_data["created_at"] = submission.created_at
        serializer.validated_data["created_by"] = user
        serializer.save()

        org_unit = serializer.validated_data["org_unit"]
        sku = serializer.validated_data["sku"]
        stock_item, _ = StockItem.objects.get_or_create(org_unit=org_unit, sku=sku)
        stock_item.value = compute_new_stock_item_value(stock_item)
        stock_item.updated_by = user
        stock_item.save()
