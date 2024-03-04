from rest_framework import filters

from iaso.api.payments.filters.utils import filter_by_parent, filter_by_dates


class UsersFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        users = request.GET.get("users", None)
        if users:
            users_ids = [int(val) for val in users.split(",") if val.isnumeric()]
            return queryset.filter(created_by_id__in=users_ids)
        return queryset


class ParentFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        return filter_by_parent(request, queryset, "payments__change_requests")


class StartEndDateFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        start_date = request.GET.get("created_at_after", None)
        end_date = request.GET.get("created_at_before", None)
        return filter_by_dates(request, queryset, start_date, end_date)


class StatusFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        status = request.GET.get("status", None)
        if status:
            status_list = status.split(",")
            return queryset.filter(status__in=status_list)
        return queryset
