from rest_framework import serializers

from iaso.models import MetricType, MetricValue


class MetricTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricType
        fields = [
            "id",
            "account",
            "name",
            "category",
            "description",
            "source",
            "units",
            "unit_symbol",
            "comments",
            "legend_config",
            "legend_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "account",
            "created_at",
            "updated_at",
        ]

class MetricValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricValue
        fields = ["id", "metric_type", "org_unit", "year", "value", "string_value"]
        read_only_fields = fields

class OrgUnitIdSerializer(serializers.Serializer):
    org_unit_id = serializers.IntegerField()

    def to_representation(self, instance):
        return {"org_unit_id": instance}