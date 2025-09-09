from django.db.models import Q
from django.db.models.functions import Greatest, Least
from rest_framework import filters

from iaso.utils.date_and_time import date_string_to_end_of_day, date_string_to_start_of_day


class UsersFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        users = request.GET.get("users", None)
        if users:
            users_ids = [int(val) for val in users.split(",") if val.isnumeric()]
            return queryset.filter(Q(created_by_id__in=users_ids) | Q(launcher_id__in=users_ids))
        return queryset


class StartEndDateFilterBackend(filters.BaseFilterBackend):
    """
    Task filtering on date: we consider all three timestamps: created_at,
    started_at and ended_at. If any of these falls in the interval, we return
    the task.
    """

    def filter_queryset(self, request, queryset, view):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            try:
                queryset = queryset.annotate(
                    date_to_check=Greatest(
                        "ended_at",
                        "started_at",
                        "created_at",
                    )
                ).filter(date_to_check__gte=date_string_to_start_of_day(start_date))
            except ValueError:
                pass

        if end_date:
            try:
                queryset = queryset.annotate(
                    date_to_check=Least(
                        "ended_at",
                        "started_at",
                        "created_at",
                    )
                ).filter(date_to_check__lte=date_string_to_end_of_day(end_date))
            except ValueError:
                pass

        return queryset


class StatusFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        status = request.GET.get("status", None)
        if status:
            status_list = status.split(",")
            return queryset.filter(status__in=status_list)
        return queryset


class TaskTypeFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        task_type = request.GET.get("task_type", None)
        if task_type:
            return queryset.filter(name=task_type)
        return queryset
