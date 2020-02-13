from django.test import TestCase, tag
from django.db.models import Count, Func, Value, Case, When, BooleanField
from django.db.models.expressions import RawSQL
from django.contrib.postgres.aggregates import ArrayAgg
from ..models import (
    OrgUnit,
    Form,
    InstanceFile,
    Profile,
    Instance,
    OrgUnitType,
    Account,
    Project,
    DataSource,
    SourceVersion,
    User,
)
from datetime import datetime, date
from django.contrib.gis.geos import Point


def duplicate_ids_query():
    return (
        Instance.objects.values("period", "form", "org_unit")
        .annotate(ids=ArrayAgg("id"))
        .annotate(c=Func("ids", Value(1), function="array_length"))
        .filter(form__in=Form.objects.filter(single_per_period=True))
        .filter(c__gt=1)
        .annotate(id=Func("ids", function="unnest"))
        .values("id")
    )


def add_duplicated_field(instances):
    return instances.annotate(
        duplicated=Case(
            When(id__in=duplicate_ids_query(), then=Value(True)),
            default=Value(False),
            output_field=BooleanField(),
        )
    )


def duplicated_counts(instances):
    return (
        Instance.objects.values("period", "form")
        .annotate(duplicated_count=Count("id"))
        .filter(id__in=duplicate_ids_query())
        .values("duplicated_count", "period", "form")
    )


def ok_counts(instances):
    return (
        Instance.objects.values("period", "form")
        .annotate(ready_count=Count("id"))
        .exclude(id__in=duplicate_ids_query())
        .values("ready_count", "period", "form")
    )


def counts_by_status(instances):
    def merge_counts(field, counts, sub_counts):
        for count in sub_counts:
            count_to_merge = list(
                filter(
                    lambda x: x["period"] == count["period"]
                    and x["form"] == count["form"],
                    counts,
                )
            )
            if len(count_to_merge) > 0:
                count_to_merge[0][field] = count[field]
            else:
                counts.append(count)

    counts = []
    merge_counts("ready_count", counts, ok_counts(instances))
    merge_counts("duplicated_count", counts, duplicated_counts(instances))
    return counts
