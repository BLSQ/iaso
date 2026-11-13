"""Details of a beneficiary and of a submission, returned by the beneficiaries API."""

from django.shortcuts import get_object_or_404

from iaso.models import Entity, Instance
from iaso.utils.pii import filter_submission_json

from ..filters import restricted_org_units
from ..models import Beneficiary, Visit


def flatten_json(data, prefix=""):
    """Turn a submission JSON into a flat list of (path, value) rows for display."""
    rows = []
    if isinstance(data, dict):
        for key, value in data.items():
            rows.extend(flatten_json(value, f"{prefix}{key}/" if isinstance(value, (dict, list)) else f"{prefix}{key}"))
    elif isinstance(data, list):
        for index, value in enumerate(data):
            rows.extend(
                flatten_json(value, f"{prefix}{index}/" if isinstance(value, (dict, list)) else f"{prefix}{index}")
            )
    else:
        rows.append((prefix, data))
    return rows


def _rows(submission, user):
    return flatten_json(filter_submission_json(submission.json or {}, submission.form, user))


def beneficiary_details(user, account, entity_id):
    """The entity, its ETL beneficiary, its reference form and every submission linked to it.

    Submissions are found through their entity_id, so this also includes submissions not used by the ETL.
    Users restricted to some facilities only see their beneficiaries and the submissions made there.
    """
    entities = Entity.objects.filter(account=account).select_related("entity_type", "attributes__form")
    submissions = Instance.objects.filter(entity_id=entity_id)
    restricted = restricted_org_units(user)
    if restricted is not None:
        entities = entities.filter(
            id__in=Visit.objects.filter(org_unit_id__in=restricted.values("id")).values(
                "journey__beneficiary__entity_id"
            )
        )
        submissions = submissions.filter(org_unit_id__in=restricted.values("id"))
    entity = get_object_or_404(entities, id=entity_id)
    submissions = list(submissions.select_related("form", "org_unit").order_by("source_created_at", "created_at"))
    for submission in submissions:
        submission.rows = _rows(submission, user)
    return {
        "entity": entity,
        "beneficiary": Beneficiary.objects.filter(entity_id=entity.id).first(),
        "attributes": _rows(entity.attributes, user) if entity.attributes else [],
        "submissions": submissions,
    }


def submission_details(user, account, instance_id):
    """A submission of the account (made in the facilities of restricted users) with its flattened fields."""
    submissions = Instance.objects.filter(entity__account=account).select_related("form", "org_unit")
    restricted = restricted_org_units(user)
    if restricted is not None:
        submissions = submissions.filter(org_unit_id__in=restricted.values("id"))
    submission = get_object_or_404(submissions, id=instance_id)
    return {"submission": submission, "rows": _rows(submission, user)}
