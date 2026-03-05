import json
import re

from datetime import datetime

from django.db.models import Exists, OuterRef, Q
from django.utils import timezone
from rest_framework import filters
from rest_framework.exceptions import ValidationError

from iaso.models import Instance, OrgUnit
from iaso.utils.date_and_time import date_string_to_end_of_day, date_string_to_start_of_day
from iaso.utils.jsonlogic import entities_jsonlogic_to_q


class EntityFormNameFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if form_name := request.query_params.get("form_name"):
            queryset = queryset.filter(attributes__form__name__icontains=form_name)

        return queryset


class EntityTypeFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if entity_type := request.query_params.get("entity_type"):
            queryset = queryset.filter(name=entity_type)

        return queryset


class EntityTypeIdFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if entity_type_ids := request.query_params.get("entity_type_ids"):
            queryset = queryset.filter(entity_type_id__in=entity_type_ids.split(","))

        return queryset


class EntityShowDeletedFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if show_deleted := request.query_params.get("show_deleted"):
            queryset = queryset.filter(deleted_at__isnull=True)

        return queryset


class EntityOrgUnitFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if org_unit_id := request.query_params.get("orgUnitId"):
            parent = OrgUnit.objects.get(id=org_unit_id)
            queryset = queryset.filter(attributes__org_unit__path__descendants=parent.path)

        return queryset


class EntityCreatedByFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if created_by_id := request.query_params.get("created_by_id"):
            queryset = queryset.filter(attributes__created_by_id=created_by_id)

        return queryset


class EntityCreatedByTeamFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if created_by_team_id := request.query_params.get("created_by_team_id"):
            queryset = queryset.filter(attributes__created_by__teams__id=created_by_team_id)

        return queryset


class EntityGroupFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        if groups := request.query_params.get("groups"):
            queryset = queryset.filter(attributes__org_unit__groups__in=groups.split(","))

        return queryset


class EntityByUuidFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        # TODO: check if used?
        if uuid := request.query_params.get("by_uuid"):
            queryset = queryset.filter(uuid=uuid)

        return queryset


class EntityFieldsSearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        # TODO: double-check this with changes to entities_jsonlogic_to_q
        if fields_search := request.query_params.get("fields_search"):
            q, _ = entities_jsonlogic_to_q(json.loads(fields_search))
            queryset = queryset.filter(q)

        return queryset


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


class EntitySearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if not search:
            return queryset

        search = search.strip()  # TODO: check if necessary
        if search.startswith("ids:"):
            ids = re.findall("\d+", search)
            if not ids:
                raise ValidationError(f"Failed parsing ids in search '{search}'")
            queryset = queryset.filter(id__in=ids)
        elif search.startswith("uuids:"):
            uuids_re = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"
            uuids = re.findall(uuids_re, search)
            if not uuids:
                raise ValidationError(f"Failed parsing uuids in search '{search}'")
            queryset = queryset.filter(uuid__in=uuids)
        else:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(uuid__icontains=search) | Q(attributes__json__icontains=search)
            )

        return queryset


class EntityOrderingFilter(filters.OrderingFilter):
    """Extend the OrderingFilter to support sorting by the entity's attributes."""

    # annotations = {
    #     "last_saved_instance": lambda: Max(Coalesce("instances__source_created_at", "instances__created_at"))
    # }
    # TODO: check if we can annotate the last_saved_instance only if ordering by that field
    # TODO: ordering by org unit doesn't seem to work

    def get_ordering(self, request, queryset, view):
        ordering = request.query_params.get("order_columns")

        if not ordering:
            return super().get_ordering(request, queryset, view)

        model_fields = {f.name for f in queryset.model._meta.get_fields()}
        model_fields.update(queryset.query.annotations.keys())
        # model_fields.update(self.annotations.keys())

        final_ordering = []

        for field in ordering.split(","):
            field = field.strip()
            if not field:
                continue

            field_name = field.lstrip("-")

            if field_name in model_fields:
                final_ordering.append(field)
            else:
                prefix = "-" if field.startswith("-") else ""
                final_ordering.append(f"{prefix}attributes__json__{field_name}")

        return final_ordering

    # def filter_queryset(self, request, queryset, view):
    #     ordering = self.get_ordering(request, queryset, view)

    #     if ordering:
    #         # check which computed fields are actually being used
    #         ordering_fields = {o.lstrip("-") for o in ordering}

    #         # Apply annotations only for the computed fields present in ordering
    #         for field, annotation_func in self.annotations.items():
    #             if field in ordering_fields:
    #                 kwargs = {field: annotation_func()}
    #                 queryset = queryset.annotate(**kwargs)

    #         return queryset.order_by(*ordering)

    #     return queryset
