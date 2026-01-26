from rest_framework import serializers

from iaso.models import MetricType, MetricValue


class MetricTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricType
        fields = [
            "id",
            "account",
            "code",
            "name",
            "category",
            "description",
            "source",
            "units",
            "unit_symbol",
            "comments",
            "legend_config",
            "legend_type",
            "origin",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "account",
            "created_at",
            "updated_at",
        ]


class MetricTypeWriteSerializer(serializers.ModelSerializer):
    code = serializers.CharField(required=True, allow_blank=False)
    name = serializers.CharField(required=True, allow_blank=False)
    category = serializers.CharField(required=True, allow_blank=False)
    description = serializers.CharField(required=False, allow_blank=True)
    units = serializers.CharField(required=False, allow_blank=True)
    unit_symbol = serializers.CharField(required=False, allow_blank=True)
    origin = serializers.CharField(required=False, allow_blank=True)
    legend_type = serializers.CharField(required=True, allow_blank=False)

    class Meta:
        model = MetricType
        fields = [
            "code",
            "name",
            "category",
            "description",
            "units",
            "unit_symbol",
            "legend_type",
            "origin",
        ]

    def validate_code(self, value):
        instance = getattr(self, "instance", None)
        if instance is not None:
            if instance.code != value:
                raise serializers.ValidationError("codeImmutable", code="code_immutable")

        user = self.context["request"].user
        account = user.iaso_profile.account
        if MetricType.objects.filter(account=account, code=value).exclude(pk=getattr(instance, "pk", None)).exists():
            raise serializers.ValidationError("uniqueCode", code="unique_code")
        return value


class MetricValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = MetricValue
        fields = ["id", "metric_type", "org_unit", "year", "value", "string_value"]
        read_only_fields = fields


class OrgUnitIdSerializer(serializers.Serializer):
    org_unit_id = serializers.IntegerField()

    def to_representation(self, instance):
        return {"org_unit_id": instance}
