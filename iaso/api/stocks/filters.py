import django_filters

from django.utils.translation import gettext_lazy as _

from iaso.api.common import parse_comma_separated_numeric_values
from iaso.models import StockItem, StockItemRule, StockKeepingUnit, StockLedgerItem, StockRulesVersion


class MobileStockLedgerItemListFilter(django_filters.rest_framework.FilterSet):
    last_sync = django_filters.IsoDateTimeFilter(field_name="received_at", lookup_expr="gte")

    class Meta:
        model = StockLedgerItem
        fields = []


class StockKeepingUnitListFilter(django_filters.rest_framework.FilterSet):
    project_ids = django_filters.CharFilter(method="filter_projects", label=_("Project IDs (comma-separated)"))
    org_unit_type_ids = django_filters.CharFilter(
        method="filter_org_unit_types", label=_("Org unit type IDs (comma-separated)")
    )
    created_by = django_filters.CharFilter(
        method="filter_created_by", label=_("Created by - Users IDs (comma-separated)")
    )
    name = django_filters.CharFilter(lookup_expr="icontains")
    short_name = django_filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = StockKeepingUnit
        fields = ["name", "short_name"]

    @staticmethod
    def filter_created_by(queryset, name, value):
        user_ids = parse_comma_separated_numeric_values(value, name)
        return queryset.filter(created_by_id__in=user_ids)

    @staticmethod
    def filter_projects(queryset, name, value):
        project_ids = parse_comma_separated_numeric_values(value, name)
        return queryset.filter(projects__id__in=project_ids)

    @staticmethod
    def filter_org_unit_types(queryset, name, value):
        org_unit_type_ids = parse_comma_separated_numeric_values(value, name)
        return queryset.filter(org_unit_types__id__in=org_unit_type_ids)


class StockItemListFilter(django_filters.rest_framework.FilterSet):
    skus = django_filters.CharFilter(method="filter_skus", label=_("SKUs - SKU IDs (comma-separated)"))

    class Meta:
        model = StockItem
        fields = ["org_unit_id", "sku_id"]

    @staticmethod
    def filter_skus(queryset, name, value):
        skus_ids = parse_comma_separated_numeric_values(value, name)
        return queryset.filter(sku_id__in=skus_ids)


class StockLegderItemListFilter(django_filters.rest_framework.FilterSet):
    skus = django_filters.CharFilter(method="filter_skus", label=_("SKUs - SKU IDs (comma-separated)"))
    question = django_filters.CharFilter(lookup_expr="icontains")
    created_at_after = django_filters.DateFilter(field_name="created_at", lookup_expr="gte", input_formats=["%d-%m-%Y"])
    created_at_before = django_filters.DateFilter(
        field_name="created_at", lookup_expr="lte", input_formats=["%d-%m-%Y"]
    )
    value_from = django_filters.NumberFilter(field_name="value", lookup_expr="gte")
    value_to = django_filters.NumberFilter(field_name="value", lookup_expr="lte")

    class Meta:
        model = StockLedgerItem
        fields = ["impact", "submission_id", "org_unit_id", "sku_id", "question", "value", "created_at", "created_by"]

    @staticmethod
    def filter_skus(queryset, name, value):
        skus_ids = parse_comma_separated_numeric_values(value, name)
        return queryset.filter(sku_id__in=skus_ids)


class StockItemRuleListFilter(django_filters.rest_framework.FilterSet):
    skus = django_filters.CharFilter(method="filter_skus", label=_("SKUs - SKU IDs (comma-separated)"))

    class Meta:
        model = StockItemRule
        fields = ["impact", "form_id", "sku_id", "question", "version_id"]

    @staticmethod
    def filter_skus(queryset, name, value):
        skus_ids = parse_comma_separated_numeric_values(value, name)
        return queryset.filter(sku_id__in=skus_ids)


class StockRulesVersionListFilter(django_filters.rest_framework.FilterSet):
    name = django_filters.CharFilter(lookup_expr="icontains")

    class Meta:
        model = StockRulesVersion
        fields = ["name", "status"]
