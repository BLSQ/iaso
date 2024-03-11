from rest_framework import filters
from datetime import datetime

from django.utils import timezone
from rest_framework.exceptions import ValidationError
from iaso.models import OrgUnit


def filter_by_forms(request, queryset, key=None):
    forms_ids = request.GET.get("forms", None)
    if forms_ids:
        forms_ids = [int(val) for val in forms_ids.split(",") if val.isnumeric()]
        filter_key = (
            f"{key}__org_unit__reference_instances__form_id__in"
            if key
            else "org_unit__reference_instances__form_id__in"
        )
        filter_params = {filter_key: forms_ids}
        queryset = queryset.filter(**filter_params)
    return queryset


def filter_by_dates(request, queryset, key=None):
    start_date = request.GET.get("change_requests__created_at_after", None)
    end_date = request.GET.get("change_requests__created_at_before", None)
    date_format = "%d-%m-%Y"

    if start_date:
        try:
            start_date_dt = datetime.strptime(start_date, date_format)
            start_date_dt = timezone.make_aware(start_date_dt, timezone.get_default_timezone())
            start_date_dt = start_date_dt.replace(hour=0, minute=0, second=0)
            filter_key = f"{key}__created_at__gte" if key else "created_at__gte"
            filter_params = {filter_key: start_date_dt}
            queryset = queryset.filter(**filter_params)
        except ValueError:
            pass

    if end_date:
        try:
            end_date_dt = datetime.strptime(end_date, date_format)
            end_date_dt = timezone.make_aware(end_date_dt, timezone.get_default_timezone())
            end_date_dt = end_date_dt.replace(hour=23, minute=59, second=59)
            filter_key = f"{key}__created_at__lte" if key else "created_at__lte"
            filter_params = {filter_key: end_date_dt}
            queryset = queryset.filter(**filter_params)
        except ValueError:
            pass

    return queryset


def filter_by_parent(request, queryset, key=None):
    parent_id = request.GET.get("parent_id", None)
    if parent_id:
        try:
            parent = OrgUnit.objects.get(id=parent_id)
            parent_qs = OrgUnit.objects.filter(id=parent.id)
            descendants_qs = OrgUnit.objects.hierarchy(parent_qs).values_list("id", flat=True)
            filter_key = f"{key}__org_unit__id__in" if key else "org_unit__id__in"
            filter_params = {filter_key: descendants_qs}
            queryset = queryset.filter(**filter_params)
        except OrgUnit.DoesNotExist:
            raise ValidationError({"parent_id": [f"OrgUnit with id {parent_id} does not exist."]})

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
        return filter_by_dates(request, queryset, "change_requests")


class ChangeRequestsFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        change_requests = request.GET.get("change_requests__", None)
        if change_requests:
            change_requests_ids = [int(val) for val in change_requests.split(",") if val.isnumeric()]
            return queryset.filter(change_requests__id__in=change_requests_ids)
        return queryset
