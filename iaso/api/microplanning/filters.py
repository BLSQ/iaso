from django.db.models import Q
from rest_framework import filters


class PlanningSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = queryset.filter(Q(name__icontains=search)).distinct()
        return queryset


class PublishingStatusFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        status = request.query_params.get("publishing_status", "all")
        form_ids = request.query_params.get("form_ids", None)

        if status == "draft":
            queryset = queryset.filter(published_at__isnull=True)
        if status == "published":
            queryset = queryset.exclude(published_at__isnull=True)
        if form_ids:
            queryset = queryset.filter(forms__id__in=form_ids.split(","))
        return queryset
