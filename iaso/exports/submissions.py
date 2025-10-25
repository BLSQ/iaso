from logging import getLogger

from django.db import models
from django.db.models import Exists, F, Func, OuterRef, QuerySet
from django.db.models.fields.json import KeyTextTransform

import iaso.models as m

from .mapping import generate_safe_mapping
from .utils import normalize_field_name


logger = getLogger(__name__)


def build_submissions_queryset(qs: QuerySet[m.Instance], form_id: str) -> QuerySet[m.Instance]:
    form = m.Form.objects.get(pk=form_id)
    if form.possible_fields == None or len(form.possible_fields) == 0:
        form.update_possible_fields()

    qs = qs.filter(form_id=form_id)

    prefixed_fields = build_submission_annotations()

    possible_fields = form.possible_fields

    answer_mappings = generate_safe_mapping(list(prefixed_fields.keys()) + [f["name"] for f in possible_fields])

    json_annotations = {}
    for field in possible_fields:
        field_name = field["name"]
        json_annotations[answer_mappings[field_name]] = KeyTextTransform(field_name, "json")

    qs = (
        qs.values("id")
        .annotate(**prefixed_fields)
        .annotate(**json_annotations)
        .values(*prefixed_fields.keys(), *json_annotations.keys())
    )

    return qs, answer_mappings


class ST_X(Func):
    function = "ST_X"
    output_field = models.FloatField()


class ST_Y(Func):
    function = "ST_Y"
    output_field = models.FloatField()


class ST_Z(Func):
    function = "ST_Z"
    output_field = models.FloatField()


def build_submission_annotations():
    model_fields = [
        "id",
        "form_id",
        "period",
        "uuid",
        "org_unit_id",
        "org_unit__name",
        "org_unit__source_ref",
        "entity_id",
        "created_at",
        "source_created_at",
        "created_by__username",
        "created_by_id",
        "updated_at",
        "source_updated_at",
        "last_modified_by__username",
        "last_modified_by_id",
        "deleted",
        "export_id",
        "correlation_id",
    ]
    model_prefix = "iaso_subm_"

    prefixed_fields = {f"{model_prefix}{normalize_field_name(f)}": F(f) for f in model_fields}

    # less standard fields that needs some functions or more complex calculation
    prefixed_fields[f"{model_prefix}is_reference"] = Exists(
        m.OrgUnitReferenceInstance.objects.filter(org_unit_id=OuterRef("org_unit_id"), instance_id=OuterRef("pk"))
    )
    prefixed_fields[f"{model_prefix}form_version_id"] = KeyTextTransform("_version", "json")
    prefixed_fields[f"{model_prefix}longitude"] = ST_X(F("location"))
    prefixed_fields[f"{model_prefix}latitude"] = ST_Y(F("location"))
    prefixed_fields[f"{model_prefix}altitude"] = ST_Z(F("location"))
    prefixed_fields[f"{model_prefix}accuracy"] = F("accuracy")
    return prefixed_fields
