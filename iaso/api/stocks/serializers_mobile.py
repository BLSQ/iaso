from rest_framework import serializers

from iaso.api.common import TimestampField
from iaso.models import (
    OrgUnitType,
    StockItemRule,
    StockKeepingUnit,
    StockRulesVersion,
)


class StockKeepingUnitMobileSerializer(serializers.ModelSerializer):
    org_unit_types = serializers.PrimaryKeyRelatedField(many=True, queryset=OrgUnitType.objects.all())
    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = StockKeepingUnit
        fields = [
            "id",
            "name",
            "short_name",
            "org_unit_types",
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
