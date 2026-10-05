"""Resolvers of the `Instance` fields that aren't a plain attribute: each reads what `load_selected()` loaded."""

from ariadne import ObjectType


instance = ObjectType("Submission")


@instance.field("location")
def resolve_location(instance, _info):
    if instance.latitude is None:
        return None  # no `location` point
    return {"latitude": instance.latitude, "longitude": instance.longitude, "altitude": instance.altitude}


@instance.field("content")
def resolve_content(instance, _info):
    return instance.json


@instance.field("orgUnit")
def resolve_org_unit(instance, _info):
    org_unit = instance.org_unit
    if org_unit is not None and hasattr(instance, "org_unit_ancestors_json"):
        org_unit.ancestors_json = instance.org_unit_ancestors_json  # annotated on the submission's row
    return org_unit


instance_org_unit = ObjectType("SubmissionOrgUnit")


@instance_org_unit.field("ancestors")
def resolve_ancestors(org_unit, _info):
    return org_unit.ancestors_json
