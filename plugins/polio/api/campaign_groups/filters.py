from django.db.models import Q
from rest_framework import filters


class CampaignGroupSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(campaigns__obr_name__icontains=search) | Q(name__icontains=search)).distinct()
        return queryset
