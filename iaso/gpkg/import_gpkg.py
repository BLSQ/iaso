import sqlite3
from typing import Optional, Dict, List, Tuple, Union

import fiona
from django.contrib.gis.geos import Point, MultiPolygon, Polygon
from django.db import transaction

from iaso.models import Project, OrgUnitType, OrgUnit, DataSource, SourceVersion, Group

try:  # only in 3.8
    from typing import TypedDict
except ImportError:
    TypedDict = type


def get_or_create_org_unit_type(name: str, project: Project, depth: int):
    out = OrgUnitType.objects.filter(projects=project, name=name).first()
    if not out:
        out, created = OrgUnitType.objects.get_or_create(name=name, short_name=name[:4], depth=depth)
        out.projects.add(project)
    return out


class PropertyDict(TypedDict):
    """Layer table has columns: table, ref, parent_ref"""

    name: str
    parent_ref: str
    ref: str
    group_refs: str


class GeomDict(TypedDict):
    type: str
    coordinates: list


class OrgUnitData(TypedDict):
    """Fiona separate layer in the geometry and properties for the rest of the column"""

    geometry: GeomDict
    properties: PropertyDict
    type: Optional[OrgUnitType]


def convert_to_geography(geom_type: str, coordinates: list):
    """Convert a geography dict from gpkg/fiona to a geodjango.Geom

    it's ${current_year} and I can't believe I still have to do this.
    Shapely normally can do this natively but is not compatible with geography col
    and geodjango don't support geo yay"""
    geom_type = geom_type.lower()
    if geom_type == "point":
        # For some reason point in iaso are in 3D
        if len(coordinates) == 2:
            geom = Point(*coordinates, z=0)
        else:
            geom = Point(*coordinates)
    elif geom_type == "polygon":
        geom = MultiPolygon(Polygon(*coordinates))
    elif geom_type == "multipolygon":
        geom = MultiPolygon(*[Polygon(*coord) for coord in coordinates])
    else:
        raise Exception(f"Unhandled geom type {geom_type}")
    return geom


def create_or_update_group(group: Group, ref: str, name: str, version: SourceVersion):
    if not group:
        group = Group()
    group.name = name
    group.source_ref = ref
    group.source_version = version
    group.save()
    return group


def create_or_update_orgunit(
    orgunit: OrgUnit,
    data: OrgUnitData,
    source_version: SourceVersion,
    validation_status: str,
    ref_group: Dict[str, Group],
) -> OrgUnit:
    props = data["properties"]
    geometry = data["geometry"]

    if not orgunit:
        orgunit = OrgUnit()

    orgunit.name = props["name"]
    orgunit.org_unit_type = data["type"]
    orgunit.validation_status = validation_status
    orgunit.source_ref = props["ref"]
    orgunit.version = source_version

    if geometry:
        geom = convert_to_geography(geometry["type"], geometry["coordinates"])
        if isinstance(geom, Point):
            orgunit.location = geom
        else:
            orgunit.geom = geom
            orgunit.simplified_geom = geom

    orgunit.save(skip_calculate_path=True)

    if "group_refs" not in props:
        # the column is not here we don't touch the group
        pass
    elif not props["group_refs"]:
        # if it's an empty string or null we will remove all groups presumably
        # I previously wanted to differentiate the case of empty str vs null but QGIS don't show the difference
        #  in the ui so it's perilous
        orgunit.groups.clear()
    elif props["group_refs"]:
        group_refs = props["group_refs"].split(",")
        group_refs = [ref.strip() for ref in group_refs]

        try:
            groups = [ref_group[ref] for ref in group_refs if ref]
        except KeyError:
            raise ValueError(f"Bad GPKG group {group_refs} for {orgunit} don't exist in input or SourceVersion")
        orgunit.groups.set(groups)

    return orgunit


def get_ref(inst: Union[OrgUnit, Group]) -> str:
    """We make an artificial ref in case there is none so the gpkg can still refer existing record in iaso, even if
    they don't have a ref"""
    return inst.source_ref if inst.source_ref else f"iaso#{inst.pk}"


@transaction.atomic
def import_gpkg_file(filename, project_id, source_name, validation_status, version_number):
    # Layer are OrgUnit's Type
    layers_name = fiona.listlayers(filename)
    source, created = DataSource.objects.get_or_create(name=source_name)
    if source.read_only:
        raise Exception("Source is marked read only")
    source.projects.add(project_id)
    project = Project.objects.get(id=project_id)

    version, created = SourceVersion.objects.get_or_create(number=version_number, data_source=source)

    # Create and update all the groups and put them in a dict indexed by ref
    # Do it in sqlite because Fiona is not great with Attributes table (without geom)
    ref_group: Dict[str, Group] = {get_ref(group): group for group in version.group_set.all()}
    with sqlite3.connect(filename) as conn:
        cur = conn.cursor()
        rows = cur.execute("select ref, name from groups")
        for ref, name in rows:
            group = create_or_update_group(ref_group.get(ref), ref, name, version)
            ref_group[get_ref(group)] = group

    # index all existing OrgUnit per ref
    existing_orgunits = version.orgunit_set.all()  # Maybe add a only?
    ref_ou: Dict[str, OrgUnit] = {}
    for ou in existing_orgunits:
        ref = get_ref(ou)
        ref_ou[ref] = ou

    # The child may be created before the parent so we keep a list to update after creating them all
    to_update_with_parent: List[Tuple[str, str]] = []
    total_org_unit = 0

    for layer_name in layers_name:
        # layers to import must be named level-{depth}-{name}
        if not layer_name.startswith("level-"):
            continue

        colx = fiona.open(filename, mode="r", layer=layer_name)

        _, depth, name = layer_name.split("-")
        org_unit_type = get_or_create_org_unit_type(name, project, depth)

        # collect all the OrgUnit to create from this layer
        row: OrgUnitData
        for row in iter(colx):
            row["type"] = org_unit_type
            ref = row["properties"]["ref"]

            existing_ou = ref_ou.get(ref, None)
            orgunit = create_or_update_orgunit(existing_ou, row, version, validation_status, ref_group)
            ref = get_ref(orgunit)  # if ref was null in gpkg
            ref_ou[ref] = orgunit

            parent_ref = row["properties"]["parent_ref"]
            to_update_with_parent.append((ref, parent_ref))

            total_org_unit += 1

    print(f"OrgUnit updated or created : {total_org_unit}")
    for ref, parent_ref in to_update_with_parent:
        if parent_ref and parent_ref not in ref_ou:
            raise ValueError(f"Bad GPKG parent {parent_ref} for {ou} don't exist in input or SourceVersion")

        ou = ref_ou[ref]
        parent_ou = ref_ou[parent_ref] if parent_ref else None
        ou.parent = parent_ou
        ou.save()
