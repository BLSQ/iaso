from datetime import datetime

from django.db.models import Q
from rest_framework import filters


class UsersFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        users = request.GET.get("users", None)
        if users:
            users_ids = [int(val) for val in users.split(",") if val.isnumeric()]
            return queryset.filter(Q(created_by_id__in=users_ids) | Q(launcher_id__in=users_ids))
        return queryset
