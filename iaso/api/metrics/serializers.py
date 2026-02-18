import pandas as pd

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.api.metrics.utils import REQUIRED_METRIC_VALUES_HEADERS, get_missing_headers
from iaso.models import MetricType, MetricValue
from iaso.models.org_unit import OrgUnit
from iaso.utils.org_units import get_valid_org_units_with_geography
from iaso.utils.serializer.json_schema_field import JSONSchemaField


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
    name = serializers.CharField(required=True, allow_blank=False)
    category = serializers.CharField(required=True, allow_blank=False)
    description = serializers.CharField(required=False, allow_blank=True)
    units = serializers.CharField(required=False, allow_blank=True)
    unit_symbol = serializers.CharField(required=False, allow_blank=True, max_length=2)
    origin = serializers.ChoiceField(choices=MetricType.MetricTypeOrigin, required=False, allow_blank=True)
    legend_type = serializers.ChoiceField(choices=MetricType.LegendType, required=True, allow_blank=False)
    legend_config = JSONSchemaField(schema=MetricType.LEGEND_CONFIG_SCHEMA, allow_null=False, write_only=True)

    class Meta:
        model = MetricType
        fields = [
            "name",
            "category",
            "description",
            "units",
            "unit_symbol",
            "legend_type",
            "origin",
            "legend_config",
        ]

    def validate(self, data):
        legend_type = data.get("legend_type")
        legend_config = data.get("legend_config")

        scale_count = len(legend_config.get("domain", [])) if legend_config else 0
        if legend_type == MetricType.LegendType.THRESHOLD:
            if scale_count < 2:
                raise serializers.ValidationError(_("Threshold legend type requires at least two scale items."))
            if scale_count > 9:
                raise serializers.ValidationError(_("Threshold legend type allows a maximum of nine scale items."))
        elif legend_type == MetricType.LegendType.LINEAR:
            if scale_count != 2:
                raise serializers.ValidationError(_("Linear legend type requires exactly two scale items."))
        elif legend_type == MetricType.LegendType.ORDINAL:
            if scale_count < 2:
                raise serializers.ValidationError(_("Ordinal legend type requires at least two scale items."))
            if scale_count > 4:
                raise serializers.ValidationError(_("Ordinal legend type allows a maximum of four scale items."))

        return data


class MetricTypeCreateSerializer(MetricTypeWriteSerializer):
    code = serializers.CharField(required=True, allow_blank=False)

    class Meta(MetricTypeWriteSerializer.Meta):
        fields = MetricTypeWriteSerializer.Meta.fields + ["code"]

    def create(self, validated_data):
        account = self.context["request"].user.iaso_profile.account
        instance = super().create({**validated_data, "account": account})
        instance.save()
        return instance

    def validate_code(self, value):
        if any(char.isspace() for char in value):
            raise serializers.ValidationError("Code must not contain whitespace.", code="no_whitespace")

        instance = getattr(self, "instance", None)

        user = self.context["request"].user
        account = user.iaso_profile.account
        if MetricType.objects.filter(account=account, code=value).exclude(pk=getattr(instance, "pk", None)).exists():
            raise serializers.ValidationError("uniqueCode", code="unique_code")
        return value


class MetricValueSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    year = serializers.IntegerField(required=False, allow_null=True)
    value = serializers.FloatField(required=False, allow_null=True)
    string_value = serializers.CharField(required=False, allow_null=True)
    metric_type = serializers.PrimaryKeyRelatedField(queryset=MetricType.objects.none())
    org_unit = serializers.PrimaryKeyRelatedField(queryset=OrgUnit.objects.none(), allow_null=False)

    class Meta:
        model = MetricValue
        fields = ["id", "metric_type", "org_unit", "year", "value", "string_value"]
        read_only_fields = fields

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            account = user.iaso_profile.account
            self.fields["metric_type"].queryset = MetricType.objects.filter(account=account)
            self.fields["org_unit"].queryset = get_valid_org_units_with_geography(account)


class ImportMetricValuesSerializer(serializers.Serializer):
    file = serializers.FileField(required=True)

    def validate_file(self, value):
        if not value.name.endswith(".csv"):
            raise serializers.ValidationError(_("The file must be a CSV."))

        df = pd.read_csv(value)

        header_errors = get_missing_headers(df, REQUIRED_METRIC_VALUES_HEADERS)
        if header_errors:
            message = _("The CSV must contain '{missing_headers}' columns.").format(
                missing_headers=", ".join(header_errors)
            )
            raise serializers.ValidationError(message, code="missing_required_headers")

        # Verify that we have at least one metric type column
        if len(df.columns) <= len(REQUIRED_METRIC_VALUES_HEADERS):
            raise serializers.ValidationError(_("The CSV must contain at least one metric type column."))

        # Verify that metric type columns correspond to existing MetricTypes
        metric_type_codes = set(df.columns) - set(REQUIRED_METRIC_VALUES_HEADERS)
        user = self.context.get("request").user
        account = user.iaso_profile.account
        existing_metric_types = MetricType.objects.filter(account=account, code__in=metric_type_codes).values_list(
            "code", "id", "legend_config"
        )
        missing_metric_types = metric_type_codes - set(mt[0] for mt in existing_metric_types)
        if missing_metric_types:
            raise serializers.ValidationError(
                _("The following metric types do not exist: ") + ", ".join(missing_metric_types)
            )

        existing_metric_types_map = {mt[0]: mt[1] for mt in existing_metric_types}

        if df.shape[0] == 0:
            raise serializers.ValidationError(_("The CSV must contain at least one value row."))

        org_unit_ids = df["ADM2_ID"].tolist()
        matching_org_unit_ids = (
            get_valid_org_units_with_geography(account).filter(id__in=org_unit_ids).values_list("id", flat=True)
        )
        missing_org_unit_ids = set(org_unit_ids) - set(matching_org_unit_ids)
        if missing_org_unit_ids:
            raise serializers.ValidationError(
                _("The following org unit IDs do not exist: ") + ", ".join(str(ou_id) for ou_id in missing_org_unit_ids)
            )

        # Prepare metric values but don't save yet
        metric_values = []
        for index, row in df.iterrows():
            org_unit_id = row["ADM2_ID"]
            for code in metric_type_codes:
                value = row.get(code)
                if pd.isna(value):
                    continue
                metric_type_id = existing_metric_types_map[code]
                mv = MetricValue(org_unit_id=org_unit_id, metric_type_id=metric_type_id)
                try:
                    # Parse the value as a float
                    mv.value = float(value)
                except ValueError:
                    mv.value = None
                    mv.string_value = value
                metric_values.append(mv)

        self.context["metric_values"] = metric_values

        # Do we want to validate all values already here?

        return value


class OrgUnitIdSerializer(serializers.Serializer):
    org_unit_id = serializers.IntegerField()

    def to_representation(self, instance):
        return {"org_unit_id": instance}
