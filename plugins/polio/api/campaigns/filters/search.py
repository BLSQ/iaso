from rest_framework import filters

from plugins.polio.api.campaigns.filters.filters import search_queryset


class SearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")
        return search_queryset(queryset, search)
