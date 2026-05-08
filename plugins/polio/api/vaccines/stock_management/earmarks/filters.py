from django_filters.rest_framework import FilterSet, NumberFilter

from plugins.polio.models import EarmarkedStock


class EarmarkedStockFilter(FilterSet):
    vaccine_stock = NumberFilter(field_name="vaccine_stock_id")

    class Meta:
        model = EarmarkedStock
        fields = ["vaccine_stock"]
