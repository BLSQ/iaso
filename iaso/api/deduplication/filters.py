import operator

from functools import reduce
from itertools import combinations

from django.db.models import Q, TextField
from django.db.models.functions import Cast
from rest_framework import filters

from iaso.models import OrgUnit
from iaso.models.deduplication import ValidationStatus
from iaso.utils.date_and_time import date_string_to_end_of_day, date_string_to_start_of_day


class EntityIdFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        entity_id = request.GET.get("entity_id")

        if entity_id:
            queryset = queryset.filter(Q(entity1__id=entity_id) | Q(entity2__id=entity_id))

        return queryset


class EntitySearchFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search")

        if search:
            queryset = (
                queryset.select_related("entity1")
                .select_related("entity2")
                .annotate(entity1_json_as_text=Cast("entity1__attributes__json", TextField()))
                .annotate(entity2_json_as_text=Cast("entity2__attributes__json", TextField()))
                .filter(
                    Q(entity1__name__icontains=search)
                    | Q(entity2__name__icontains=search)
                    | Q(entity1_json_as_text__icontains=search)
                    | Q(entity2_json_as_text__icontains=search)
                )
                .distinct()
            )

        return queryset


class AlgorithmFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        algorithm = request.query_params.get("algorithm")

        if algorithm:
            queryset = queryset.filter(analyze__algorithm=algorithm)

        return queryset


class SubmitterFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        submitter_id = request.query_params.get("submitter")

        if submitter_id:
            queryset = queryset.filter(
                Q(entity1__attributes__created_by__pk=submitter_id)
                | Q(entity2__attributes__created_by__pk=submitter_id)
            )

        return queryset


class SubmitterTeamFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        submitter_team_id = request.query_params.get("submitter_team")

        if submitter_team_id:
            queryset = queryset.filter(
                Q(entity1__attributes__created_by__teams__pk=submitter_team_id)
                | Q(entity2__attributes__created_by__teams__pk=submitter_team_id)
            ).distinct()

        return queryset


class FormFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        form_id = request.query_params.get("form")
        form_fields = request.query_params.get("fields")

        if form_id:
            queryset = queryset.filter(
                Q(entity1__attributes__form__pk=form_id) | Q(entity2__attributes__form__pk=form_id)
            )

            if form_fields:
                form_fields = form_fields.split(",")
                qs = []
                for f_name in form_fields:
                    qs.append(Q(entity1__attributes__form__possible_fields__contains=[{"name": f_name}]))
                    qs.append(Q(entity2__attributes__form__possible_fields__contains=[{"name": f_name}]))

                if qs:
                    q = reduce(operator.or_, qs)
                    queryset = queryset.filter(q)

        return queryset


class EntityTypeFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        entity_type_id = request.query_params.get("entity_type")

        if entity_type_id is None:
            return queryset
        if "," in entity_type_id:
            entity_type_ids = entity_type_id.split(",")
        else:
            entity_type_ids = [int(entity_type_id)]

        entity_type_ids = [int(e) for e in entity_type_ids]
        queryset = queryset.filter(
            Q(entity1__entity_type__pk__in=entity_type_ids) | Q(entity2__entity_type__pk__in=entity_type_ids)
        )

        return queryset


class SimilarityFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        similarity_str = request.query_params.get("similarity")

        if similarity_str:
            similarity = int(similarity_str)
            similarity_below = similarity - 20
            similarity_above = similarity + 20

            queryset = queryset.filter(similarity_score__gte=similarity_below, similarity_score__lte=similarity_above)

        return queryset


class OrgUnitFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        org_units = request.query_params.get("org_unit")

        if org_units:
            org_units = org_units.split(",")
            qs = []
            for org_unit_id in org_units:
                try:
                    ou = OrgUnit.objects.get(pk=org_unit_id)
                    qs.append(Q(entity1__attributes__org_unit__path__descendants=ou.path))
                    qs.append(Q(entity2__attributes__org_unit__path__descendants=ou.path))
                except OrgUnit.DoesNotExist:
                    pass

            if qs:
                q = reduce(operator.or_, qs)
                queryset = queryset.filter(q)

        return queryset


class StartEndDateFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            try:
                queryset = queryset.filter(analyze__created_at__gte=date_string_to_start_of_day(start_date))
            except ValueError:
                pass

        if end_date:
            try:
                queryset = queryset.filter(analyze__created_at__lte=date_string_to_end_of_day(end_date))
            except ValueError:
                pass

        return queryset


class EntitiesFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        entities = request.query_params.get("entities")

        if entities:
            entities = entities.split(",")
            qs = []
            pairs = list(combinations(entities, 2))

            for p in pairs:
                qs.append(Q(entity1__id=p[0], entity2__id=p[1]))
                qs.append(Q(entity1__id=p[1], entity2__id=p[0]))

            if qs:
                q = reduce(operator.or_, qs)
                queryset = queryset.filter(q)

        return queryset


class IgnoredMergedFilterBackend(filters.BaseFilterBackend):
    def filter_queryset(self, request, queryset, view):
        ignored = request.query_params.get("ignored")
        merged = request.query_params.get("merged")

        qs = [Q(validation_status=ValidationStatus.PENDING)]

        if ignored == "true":
            qs.append(Q(validation_status=ValidationStatus.IGNORED))
        if merged == "true":
            qs.append(Q(validation_status=ValidationStatus.VALIDATED))

        if len(qs) > 1:
            q = reduce(operator.or_, qs)
            queryset = queryset.filter(q)
        else:
            queryset = queryset.filter(qs[0])

        return queryset


class CustomOrderingFilter(filters.OrderingFilter):
    def get_ordering(self, request, queryset, view):
        ordering = super().get_ordering(request, queryset, view)
        if ordering:
            new_ordering = []
            for field in ordering:
                if field == "similarity_star":  # fix bug because frontend is using the stars not the score
                    new_ordering.append("similarity_score")
                elif field == "-similarity_star":
                    new_ordering.append("-similarity_score")
                else:
                    new_ordering.append(field)
            return new_ordering
        return ordering
