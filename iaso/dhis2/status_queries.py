from django.db.models import Count, Func, Value, Case, When, BooleanField, Q

from django.contrib.postgres.aggregates import ArrayAgg
from iaso.models import Instance, Form


def duplicate_ids_query(queryset=Instance.objects):
    return (
        queryset.values("period", "form", "org_unit")
        .annotate(ids=ArrayAgg("id"))
        .annotate(c=Func("ids", Value(1), function="array_length"))
        .filter(form__in=Form.objects.filter(single_per_period=True))
        .filter(c__gt=1)
        .annotate(id=Func("ids", function="unnest"))
        .values("id")
    )


def annotate_with_duplicated_field(instances):
    return instances.annotate(
        duplicated=Case(
            When(id__in=duplicate_ids_query(instances), then=Value(True)),
            default=Value(False),
            output_field=BooleanField(),
        )
    )


def counts_by_status(instances_query_set=Instance.objects):
    queryset = instances_query_set
    queryset = annotate_with_duplicated_field(queryset)

    grouping_fields = ["period", "form_id", "form__name"]

    queryset = (
        queryset.values(*grouping_fields)
        .annotate(total_count=Count("id", distinct=True))
        .annotate(
            duplicated_count=Count("id", distinct=True, filter=Q(duplicated=True))
        )
        .annotate(
            exported_count=Count(
                "id",
                distinct=True,
                filter=Q(last_export_success_at__isnull=False) & Q(duplicated=False),
            )
        )
        .annotate(
            ready_count=Count(
                "id",
                distinct=True,
                filter=Q(last_export_success_at__isnull=True) & Q(duplicated=False),
            )
        )
    )
    return [x for x in queryset]
