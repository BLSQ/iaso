from rest_framework import filters

from iaso.api.payments.filters.utils import filter_by_parent, filter_by_dates, filter_by_forms


class SelectionFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        select_all = request.GET.get("select_all", "false").lower() == "true"
        selected_ids = request.GET.get("selected_ids", "")
        unselected_ids = request.GET.get("unselected_ids", "")
        selected_ids_list = [int(id) for id in selected_ids.split(",") if id]
        unselected_ids_list = [int(id) for id in unselected_ids.split(",") if id]
        if not select_all:
            if selected_ids_list:
                queryset = queryset.filter(pk__in=selected_ids_list)
        if select_all:
            if unselected_ids_list:
                queryset = queryset.exclude(pk__in=unselected_ids_list)
        return queryset


class UsersFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        users = request.GET.get("users", None)
        if users:
            users_ids = [int(val) for val in users.split(",") if val.isnumeric()]
            return queryset.filter(user_id__in=users_ids)
        return queryset


class UserRolesFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        user_roles = request.GET.get("user_roles", None)
        if user_roles:
            user_roles_ids = [int(val) for val in user_roles.split(",") if val.isnumeric()]
            return queryset.filter(user__iaso_profile__user_roles__id__in=user_roles_ids)
        return queryset


class FormsFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        return filter_by_forms(request, queryset, "change_requests")


class ParentFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        return filter_by_parent(request, queryset, "change_requests")


class StartEndDateFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        start_date = request.GET.get("change_requests__created_at_after", None)
        end_date = request.GET.get("change_requests__created_at_before", None)
        return filter_by_dates(request, queryset, start_date, end_date, "change_requests")


class ChangeRequestsFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        change_requests = request.GET.get("change_requests__", None)
        if change_requests:
            change_requests_ids = [int(val) for val in change_requests.split(",") if val.isnumeric()]
            return queryset.filter(change_requests__id__in=change_requests_ids)
        return queryset
