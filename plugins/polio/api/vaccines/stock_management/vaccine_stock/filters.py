from rest_framework import filters


class StockManagementCustomFilter(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, _view):
        country_id = request.GET.get("country_id")
        vaccine_type = request.GET.get("vaccine_type")
        country_blocks = request.GET.get("country_blocks", None)

        if country_id:
            queryset = queryset.filter(country_id__in=country_id.split(","))
        if vaccine_type:
            queryset = queryset.filter(vaccine=vaccine_type)
        if country_blocks:
            try:
                queryset = queryset.filter(country__groups__in=country_blocks.split(","))
            except:
                pass

        current_order = request.GET.get("order")

        if current_order:
            if current_order == "country_name":
                queryset = queryset.order_by("country__name")
            elif current_order == "-country_name":
                queryset = queryset.order_by("-country__name")
            elif current_order == "vaccine_type":
                queryset = queryset.order_by("vaccine")
            elif current_order == "-vaccine_type":
                queryset = queryset.order_by("-vaccine")

        return queryset
