"""Resolvers of the `OrgUnit` fields that aren't a plain attribute: each reads what `load_selected()` loaded."""

import json

from ariadne import ObjectType


org_unit = ObjectType("OrgUnit")


@org_unit.field("aliases")
def resolve_aliases(org_unit, _info):
    return org_unit.aliases or []


@org_unit.field("location")
def resolve_location(org_unit, _info):
    if org_unit.latitude is None:
        return None  # no `location` point
    return {"latitude": org_unit.latitude, "longitude": org_unit.longitude, "altitude": org_unit.altitude}


@org_unit.field("geom")
def resolve_geom(org_unit, _info):
    return _geo_json(org_unit.geom_geo_json)


@org_unit.field("simplifiedGeom")
def resolve_simplified_geom(org_unit, _info):
    return _geo_json(org_unit.simplified_geom_geo_json)


@org_unit.field("catchment")
def resolve_catchment(org_unit, _info):
    return _geo_json(org_unit.catchment_geo_json)


@org_unit.field("createdBy")
def resolve_created_by(org_unit, _info):
    return org_unit.creator  # `createdBy` like `Instance.createdBy`, the model field is `creator`


@org_unit.field("groups")
def resolve_groups(org_unit, _info):
    return org_unit.groups.all()  # prefetched


@org_unit.field("ancestors")
def resolve_ancestors(org_unit, _info):
    return org_unit.ancestors_json


def _geo_json(value):
    return json.loads(value) if value is not None else None
