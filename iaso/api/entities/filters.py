import json
import re

from datetime import datetime

from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from django_filters.rest_framework import BooleanFilter, CharFilter, FilterSet, UUIDFilter
from rest_framework import filters
from rest_framework.exceptions import ValidationError

from iaso.api.common import CharInFilter
from iaso.models import Entity, Instance, OrgUnit
from iaso.utils.date_and_time import date_string_to_end_of_day, date_string_to_start_of_day
from iaso.utils.jsonlogic import entities_jsonlogic_to_q


class EntityFilterSet(FilterSet):
    form_name = CharFilter(field_name="attributes__form__name", lookup_expr="icontains")
    by_uuid = UUIDFilter(field_name="uuid")
    created_by_id = CharFilter(field_name="attributes__created_by_id")
    created_by_team_id = CharFilter(field_name="attributes__created_by__teams__id")

    entity_type_ids = CharInFilter(field_name="entity_type_id", lookup_expr="in")
    groups = CharInFilter(field_name="attributes__org_unit__groups", lookup_expr="in")

    show_deleted = BooleanFilter(field_name="deleted_at", lookup_expr="isnull", exclude=True)
    orgUnitId = CharFilter(method="filter_org_unit")
    fields_search = CharFilter(method="filter_fields_search")
    search = CharFilter(method="filter_search")

    class Meta:
        model = Entity
        fields = []

    def filter_org_unit(self, queryset, name, value):
        try:
            parent = OrgUnit.objects.get(id=value)
            return queryset.filter(attributes__org_unit__path__descendants=parent.path)
        except OrgUnit.DoesNotExist:
            return queryset.none()

    def filter_fields_search(self, queryset, name, value):
        try:
            q, _ = entities_jsonlogic_to_q(json.loads(value))
            return queryset.filter(q)
        except (ValueError, json.JSONDecodeError):
            raise ValidationError("Invalid JSON in fields_search")

    def filter_search(self, queryset, name, value):
        if value.startswith("ids:"):
            ids = re.findall(r"\d+", value)
            if not ids:
                raise ValidationError(f"Failed parsing ids in search '{value}'")
            return queryset.filter(id__in=ids)

        if value.startswith("uuids:"):
            uuids_re = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
            uuids = re.findall(uuids_re, value)
            if not uuids:
                raise ValidationError(f"Failed parsing uuids in search '{value}'")
            return queryset.filter(uuid__in=uuids)

        tokens = re.findall(r'"[^"]*"|\S+', value)
        tokens = [t.strip('"') for t in tokens]
        q = Q()
        for token in tokens:
            q &= Q(name__icontains=token) | Q(attributes__json__icontains=token)
        q |= Q(uuid__icontains=value)

        return queryset.filter(q)


class EntityDateFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        date_from = request.query_params.get("dateFrom", "")
        date_to = request.query_params.get("dateTo", "")

        DATE_FORMAT = "%Y-%m-%d"

        if date_from or date_to:
            try:
                start = date_string_to_start_of_day(date_from, date_format=DATE_FORMAT)
            except ValueError:
                start = timezone.make_aware(datetime.min, timezone.get_default_timezone())

            try:
                end = date_string_to_end_of_day(date_to, date_format=DATE_FORMAT)
            except ValueError:
                end = timezone.make_aware(datetime.max, timezone.get_default_timezone())

            instance_qs = Instance.objects.filter(entity=OuterRef("pk"))
            queryset = queryset.filter(
                Exists(
                    instance_qs.filter(
                        Q(source_created_at__isnull=False, source_created_at__range=(start, end))
                        | Q(source_created_at__isnull=True, created_at__range=(start, end))
                    )
                )
            )

        return queryset


class EntityOrderingFilter(filters.OrderingFilter):
    """Support sorting on the Entity's attributes."""

    def get_ordering(self, request, queryset, view):
        # Accept either parameter, for legacy API compatibility
        ordering = request.query_params.get("order_columns") or request.query_params.get("order")

        if not ordering:
            return super().get_ordering(request, queryset, view)

        # Sort between model fields and attribute fields

        model_fields = {f.name for f in queryset.model._meta.get_fields()}
        model_fields.update(queryset.query.annotations.keys())

        final_ordering = []

        for field in ordering.split(","):
            field = field.strip()
            if not field:
                continue

            field_name = field.lstrip("-")
            base_field = field_name.split("__")[0]

            if base_field in model_fields:
                final_ordering.append(field)
            else:
                prefix = "-" if field.startswith("-") else ""
                final_ordering.append(f"{prefix}attributes__json__{field_name}")

        return final_ordering
