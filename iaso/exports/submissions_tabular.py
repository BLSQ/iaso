"""
Queryset for the duckdb based csv/xlsx export of submissions (see `iaso.exports.tabular`).

Each annotation mirrors a value of the legacy `get_row()` in `InstancesViewSet.list_file_export`, but computed
by postgres instead of python.
"""

from typing import Dict, List

from django.conf import settings
from django.db import models
from django.db.models import Case, Exists, F, Func, OuterRef, Q, QuerySet, Subquery, TextField, Value, When
from django.db.models.fields.json import KeyTransform
from django.db.models.functions import Cast, Coalesce, Concat

import iaso.models as m

from .submissions import ST_X, ST_Y, ST_Z


FIELD_PREFIX = "iaso_export_"
PARENT_LEVELS = 4


class FormattedDateTime(Func):
    """same format as `iaso.utils.date_and_time.timestamp_to_datetime` (local time of the server)"""

    template = "to_char(%(expressions)s, 'YYYY-MM-DD HH24:MI:SS')"
    arg_joiner = " AT TIME ZONE "
    output_field = models.TextField()

    def __init__(self, expression, **extra):
        super().__init__(expression, Value(settings.TIME_ZONE), **extra)


class JsonText(Func):
    """
    Text of a json answer, like python's `str()` of the decoded value: strings as is, booleans as True/False,
    numbers/arrays/objects as json text (postgres' formatting of arrays and objects matches `json.dumps`).
    """

    template = (
        "(CASE WHEN jsonb_typeof(%(expressions)s) = 'boolean' THEN initcap(%(expressions)s #>> '{}') "
        "ELSE %(expressions)s #>> '{}' END)"
    )
    output_field = models.TextField()

    def __init__(self, key: str):
        super().__init__(KeyTransform(key, "json"))

    def as_sql(self, compiler, connection, **extra_context):
        sql, params = super().as_sql(compiler, connection, **extra_context)
        # the expression (and so its params: the json key) appears 3 times in the template
        return sql, params * 3


def entity_uuid():
    # a subquery (index lookup) rather than a join: with a bad row estimate, postgres can join the entities with a
    # nested loop over the whole entity table for each submission
    return Subquery(m.Entity.objects_include_deleted.filter(pk=OuterRef("entity_id")).values("uuid")[:1])


def creator_name():
    """same as `iaso.utils.models.common.get_creator_name`"""
    return Case(
        When(created_by__isnull=True, then=Value(None)),
        When(
            ~Q(created_by__username="") & ~Q(created_by__first_name="") & ~Q(created_by__last_name=""),
            then=Concat(
                F("created_by__username"),
                Value(" ("),
                F("created_by__first_name"),
                Value(" "),
                F("created_by__last_name"),
                Value(")"),
                output_field=TextField(),
            ),
        ),
        When(~Q(created_by__username=""), then=F("created_by__username")),
        default=Value(""),
        output_field=TextField(),
    )


def build_submissions_tabular_queryset(
    qs: QuerySet, form: m.Form, file_content_template: Dict, columns: List[Dict]
) -> QuerySet:
    """
    columns: the legacy export columns, each one gets a "field" key with the matching queryset column.
    They are matched by position, so the annotations below must stay in the legacy `get_row()` order.
    """
    annotations = [
        F("id"),
        Case(
            When(
                Exists(m.OrgUnitReferenceInstance.objects.filter(instance_id=OuterRef("pk"))),
                form_id=form.id,
                then=Value("True"),
            ),
            default=Value("False"),
            output_field=TextField(),
        ),
        JsonText("_version"),
        F("export_id"),
        ST_Y(F("location")),
        ST_X(F("location")),
        ST_Z(F("location")),
        F("accuracy"),
        F("period"),
        FormattedDateTime(Coalesce("source_created_at", "created_at")),
        FormattedDateTime(F("created_at")),
        FormattedDateTime(Coalesce("source_updated_at", "updated_at")),
        creator_name(),
        F("created_by_id"),
        F("status"),
        Case(
            When(entity_id__isnull=True, then=Value(None)),
            default=Concat(Value("uuid:"), Cast(entity_uuid(), TextField()), output_field=TextField()),
            output_field=TextField(),
        ),
        F("entity_id"),
        F("org_unit__name"),
        F("org_unit_id"),
        F("org_unit__source_ref"),
        F("org_unit__code"),
        F("org_unit__validation_status"),
    ]
    annotations += [F("org_unit" + "__parent" * level + "__name") for level in range(1, PARENT_LEVELS + 1)]
    if form.correlatable:
        annotations.append(F("correlation_id"))
    answers_start = len(annotations)
    annotations += [JsonText(key) for key in file_content_template]

    if len(annotations) != len(columns):
        raise ValueError(f"{len(annotations)} values for {len(columns)} columns")

    named_annotations = {}
    for index, (column, annotation) in enumerate(zip(columns, annotations)):
        column["field"] = f"{FIELD_PREFIX}{index}"
        # answers are written as numbers in xlsx when possible
        column["infer_number"] = index >= answers_start
        named_annotations[column["field"]] = annotation

    return qs.annotate(**named_annotations).values(*named_annotations.keys())
