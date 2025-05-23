from rest_framework.exceptions import ValidationError

from iaso.models import OrgUnit
from iaso.utils.date_and_time import date_string_to_end_of_day, date_string_to_start_of_day


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


def filter_by_dates(request, queryset, start_date=None, end_date=None, key=None):
    date_format = "%Y-%m-%d"

    if start_date:
        try:
            filter_key = f"{key}__created_at__gte" if key else "created_at__gte"
            filter_params = {filter_key: date_string_to_start_of_day(start_date, date_format)}
            queryset = queryset.filter(**filter_params)
        except ValueError:
            pass

    if end_date:
        try:
            filter_key = f"{key}__created_at__lte" if key else "created_at__lte"
            filter_params = {filter_key: date_string_to_end_of_day(end_date, date_format)}
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
