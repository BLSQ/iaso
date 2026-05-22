from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import (
    Form,
    OrgUnit,
    OrgUnitType,
    StockItemRule,
    StockKeepingUnit,
    StockLedgerItem,
    StockRulesVersion,
)


class StockKeepingUnitMobileSerializer(serializers.ModelSerializer):
    org_unit_types = serializers.PrimaryKeyRelatedField(many=True, queryset=OrgUnitType.objects.all())
    forms = serializers.PrimaryKeyRelatedField(many=True, queryset=Form.objects.all())
    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = StockKeepingUnit
        fields = [
            "id",
            "name",
            "short_name",
            "org_unit_types",
            "forms",
            "display_unit",
            "display_precision",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class StockItemRuleMobileSerializer(serializers.ModelSerializer):
    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = StockItemRule
        fields = [
            "id",
            "version_id",
            "sku_id",
            "form_id",
            "question",
            "impact",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class StockRulesVersionMobileSerializer(serializers.ModelSerializer):
    rules = StockItemRuleMobileSerializer(many=True)
    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = StockRulesVersion
        fields = [
            "name",
            "status",
            "rules",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class StockLedgerItemMobileSerializer(serializers.ModelSerializer):
    org_unit = serializers.PrimaryKeyRelatedField(queryset=OrgUnit.objects.all())
    sku = serializers.PrimaryKeyRelatedField(queryset=StockKeepingUnit.objects.all())
    form_name = serializers.SerializerMethodField()
    created_at = TimestampField()
    created_by = serializers.CharField(source="created_by.username")

    class Meta:
        model = StockLedgerItem
        fields = [
            "id",
            "org_unit",
            "sku",
            "submission_id",
            "form_name",
            "question",
            "value",
            "impact",
            "created_at",
            "created_by",
        ]
        read_only_fields = ["created_at", "created_by"]

    @staticmethod
    def get_form_name(obj):
        return obj.submission.form.name if obj.submission and obj.submission.form else None
