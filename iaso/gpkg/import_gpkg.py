import math
import sqlite3

from copy import deepcopy
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Union

import fiona  # type: ignore

from django.contrib.auth.models import User
from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.db import transaction

from hat.audit import models as audit_models
from iaso.models import DataSource, Group, OrgUnit, OrgUnitType, SourceVersion
from iaso.models.org_unit import get_or_create_org_unit_type
from iaso.utils.gis import simplify_geom


try:  # only in 3.8
    from typing import TypedDict  # type: ignore
except ImportError:
    TypedDict = type


def get_or_create_org_unit_type_and_assign_project(name: str, projects: list, depth: int) -> OrgUnitType:
    """Get or create the OUT '(in the scope of the project's account) then assign it to all projects"""
    # TODO: check what happens if the project has no account?
    # Use the first project for account and preferred_project
    first_project = projects[0]
    out = get_or_create_org_unit_type(
        name=name, depth=depth, account=first_project.account, preferred_project=first_project
    )  # type: ignore
    # Assign to all projects in the source
    for project in projects:
        out.projects.add(project)
    return out


class PropertyDict(TypedDict):
    """Layer table has columns: table, ref, parent_ref"""

    name: str
    parent_ref: str
    ref: str
    group_refs: str
    opening_date: Optional[str]
    closed_date: Optional[str]


class GeomDict(TypedDict):
    type: str
    coordinates: list


class OrgUnitData(TypedDict):
    """Fiona separate layer in the geometry and properties for the rest of the column"""

    geometry: GeomDict
    properties: PropertyDict
    type: Optional[OrgUnitType]


OLD_INTERNAL_REF = "iaso#"
NEW_INTERNAL_REF = "iaso:"


def convert_to_geography(geom_type: str, coordinates: list):
    """Convert a geography dict from gpkg/fiona to a geodjango.Geom

    it's ${current_year} and I can't believe I still have to do this.
    Shapely normally can do this natively but is not compatible with geography col
    and geodjango don't support geo yay"""
    geom_type = geom_type.lower()
    geom: Union[Point, MultiPolygon]
    if geom_type == "point":
        if any(math.isnan(coordinate) for coordinate in coordinates):
            # the lib return Nan for empty point, we don't want to store it in that case
            # and geom.empty don't work at that point (it only work after we get it back from the db).
            return None
        # For some reason point in iaso are in 3D

        if len(coordinates) == 2:
            geom = Point(*coordinates, z=0)  # type: ignore
        else:
            geom = Point(*coordinates)
    elif geom_type == "polygon":
        geom = MultiPolygon(Polygon(*coordinates))
    elif geom_type == "multipolygon":
        geom = MultiPolygon(*[Polygon(*coord) for coord in coordinates])
    else:
        raise Exception(f"Unhandled geom type {geom_type}")
    if geom.empty:
        return None
    return geom


def create_or_update_group(group: Group, ref: str, name: str, version: SourceVersion):
    if not group:
        group = Group()
    group.name = name
    group.source_ref = ref
    group.source_version = version
    group.save()
    return group


def apply_date_field(field_name: str, props: Dict[str, str], orgunit: OrgUnit, task):
    # if the field is not the geopackage don't touch the orgunit
    if field_name not in props.keys():
        return

    new_date = props.get(field_name)

    if new_date:
        try:
            setattr(orgunit, field_name, datetime.strptime(new_date, "%Y-%m-%d").date())
        except (ValueError, TypeError) as e:
            message = f"Error parsing {field_name} for {orgunit.name}: {e}"
            if task:
                task.report_progress_and_stop_if_killed(progress_message=message)
            raise Exception(message)
    else:
        # the attribute was in the geopackge but "empty" so we delete the value in the orgunit
        setattr(orgunit, field_name, None)


def create_or_update_orgunit(
    orgunit: Optional[OrgUnit],
    data: OrgUnitData,
    source_version: SourceVersion,
    validation_status: str,
    ref_group: Dict[str, Group],
    task=None,
) -> OrgUnit:
    props = data["properties"]
    geometry = data["geometry"]

    if not orgunit:
        orgunit = OrgUnit()
    else:
        # Make a copy, so we can do the audit log, otherwise we would edit in place
        orgunit = deepcopy(orgunit)

    # Validate required name
    name = validate_required_property(props, "name")
    orgunit.name = name
    orgunit.org_unit_type = data["type"]
    if orgunit.validation_status is None:
        orgunit.validation_status = validation_status
    # Validate required ref
    ref = validate_required_property(props, "ref")
    if ref and ref.startswith(OLD_INTERNAL_REF):
        ref = ref.replace(OLD_INTERNAL_REF, NEW_INTERNAL_REF)
    orgunit.source_ref = ref
    orgunit.version = source_version

    # Import code if it exists in properties
    code = props.get("code", "")
    orgunit.code = code.strip() if code else ""  # code could be null in gpkg

    # Import dates if they exist in properties

    apply_date_field("closed_date", props, orgunit, task)
    apply_date_field("opening_date", props, orgunit, task)

    if geometry:
        geom = convert_to_geography(geometry["type"], geometry["coordinates"])
        if isinstance(geom, Point):
            orgunit.location = geom
        elif geom is not None:
            orgunit.geom = geom
            orgunit.simplified_geom = simplify_geom(geom)

    orgunit.save(skip_calculate_path=True)

    if "group_refs" not in props:
        # the column is not here we don't touch the group
        pass
    elif not props["group_refs"]:
        # if it's an empty string or null we will remove all groups presumably
        # I previously wanted to differentiate the case of empty str vs null but QGIS don't show the difference
        #  in the ui so it's perilous
        if orgunit is not None and orgunit.id is not None:
            orgunit.groups.clear()
    elif props["group_refs"]:
        group_refs = props["group_refs"].split(",")
        group_refs = [ref.strip().replace(OLD_INTERNAL_REF, NEW_INTERNAL_REF) for ref in group_refs]

        try:
            groups = [ref_group[ref] for ref in group_refs if ref]
        except KeyError:
            raise ValueError(f"Bad GPKG group {group_refs} for {orgunit} don't exist in input or SourceVersion")
        orgunit.groups.set(groups)

    return orgunit


def get_ref(inst: Union[OrgUnit, Group]) -> str:
    """We make an artificial ref in case there is none so the gpkg can still refer existing record in iaso, even if
    they don't have a ref
    Before, we used the format "iaso#ID", but having a # creates some issues, so this will return "iaso:ID" instead
    """
    ref = inst.source_ref
    if not ref:
        return f"{NEW_INTERNAL_REF}{inst.pk}"
    if ref.startswith(OLD_INTERNAL_REF):
        return ref.replace(OLD_INTERNAL_REF, NEW_INTERNAL_REF)
    return ref


def validate_required_property(props: Dict[str, str], property_name: str, orgunit_name: str = "") -> str:
    """Check if a required property exists and is not empty
    Args:
        props: Dictionary of properties
        property_name: Name of the property to check
        orgunit_name: Name of orgunit for error message (optional)
    Returns:
        The property value
    Raises:
        ValueError if:
        - property column doesn't exist in props
        - property value is None
        - property value is empty string
        - property value is only whitespace
    """
    if property_name not in props:
        raise ValueError(f"Column '{property_name}' is required but missing from GPKG")

    value = props[property_name]
    if value is None:
        raise ValueError(f"Column '{property_name}' cannot be null")

    if not isinstance(value, str):
        raise ValueError(f"Column '{property_name}' must be a string, got {type(value)}")

    if value.strip() == "":
        raise ValueError(f"Column '{property_name}' cannot be empty or blank")

    return value.strip()


def validate_property(props: Dict[str, str], property_name: str, orgunit_name: str = "") -> Optional[str]:
    """Check if a property exists and validate it's not empty if present
    Args:
        props: Dictionary of properties
        property_name: Name of the property to check
        orgunit_name: Name of orgunit for error message (optional)
    Returns:
        The property value if present and non-empty, None if property doesn't exist or is empty
    """
    if property_name not in props:
        return None

    value = props[property_name]
    if value and value.strip() != "":  # Only return non-empty values
        return value
    return None


@transaction.atomic
def import_gpkg_file(filename, source_name, version_number, validation_status, description):
    source, created = DataSource.objects.get_or_create(name=source_name)
    if source.read_only:
        raise Exception("Source is marked read only")
    import_gpkg_file2(
        filename, source, version_number, validation_status, user=None, description=description, task=None
    )


@transaction.atomic
def import_gpkg_file2(
    filename,
    source: DataSource,
    version_number: Optional[int],
    validation_status,
    user: Optional[User],
    description,
    task,
):
    if version_number is None:
        last_version = source.versions.all().order_by("number").last()
        version_number = last_version.number + 1 if last_version else 0
    version, created = SourceVersion.objects.get_or_create(
        number=version_number, data_source=source, defaults={"description": description}
    )
    if not source.default_version:
        source.default_version = version
        source.save()

    if not created:
        version.save()

    # Get all projects from the source
    source_projects = source.projects.all()
    if not source_projects.exists():
        raise ValueError("DataSource must have at least one project assigned")

    # Use the first project for account access
    first_project = source_projects.first()
    account = first_project.account  # type: ignore
    if not account.default_version:  # type: ignore
        account.default_version = version  # type: ignore
        account.save()  # type: ignore

    # Create and update all the groups and put them in a dict indexed by ref
    # Do it in sqlite because Fiona is not great with Attributes table (without geom)
    ref_group: Dict[str, Group] = {get_ref(group): group for group in Group.objects.filter(source_version=version)}
    with sqlite3.connect(filename) as conn:
        cur = conn.cursor()
        rows = cur.execute("select ref, name from groups")
        for ref, name in rows:
            if ref and ref.startswith(OLD_INTERNAL_REF):
                ref = ref.replace(OLD_INTERNAL_REF, NEW_INTERNAL_REF)
            # Log modification done on group
            old_group = deepcopy(ref_group.get(ref))
            # TODO: investigate type error on next line?
            group = create_or_update_group(ref_group.get(ref), ref, name, version)  # type: ignore
            ref_group[get_ref(group)] = group
            audit_models.log_modification(old_group, group, source=audit_models.GPKG_IMPORT, user=user)

    # index all existing OrgUnit per ref
    existing_orgunits = version.orgunit_set.all()  # Maybe add a only?
    ref_ou: Dict[str, OrgUnit] = {}
    for ou in existing_orgunits:
        ref = get_ref(ou)
        ref_ou[ref] = ou

    # The child may be created before the parent, so we keep a list to update after creating them all
    to_update_with_parent: List[Tuple[str, str]] = []
    modifications_to_log: List[Tuple[Optional[OrgUnit], OrgUnit]] = []
    total_org_unit = 0

    # Layer are OrgUnit's Type
    layers_name = fiona.listlayers(filename)
    for layer_name in layers_name:
        if task:
            task.report_progress_and_stop_if_killed(
                progress_message=f"processing layer : {layer_name} total_org_unit : {total_org_unit}"
            )
        # layers to import must be named level-{depth}-{name}
        if not layer_name.startswith("level-"):
            continue

        colx = fiona.open(filename, mode="r", layer=layer_name)

        _, depth, name = layer_name.split("-", maxsplit=2)

        # Create org unit type for all projects in the source (org units are shared across projects in the source)
        org_unit_type = get_or_create_org_unit_type_and_assign_project(name, list(source_projects), int(depth))

        # collect all the OrgUnit to create from this layer
        row: OrgUnitData
        for row in iter(colx):
            row["type"] = org_unit_type

            # Validate both required fields
            ref = validate_required_property(row["properties"], "ref")
            name = validate_required_property(row["properties"], "name")
            if ref and ref.startswith(OLD_INTERNAL_REF):
                ref = ref.replace(OLD_INTERNAL_REF, NEW_INTERNAL_REF)

            existing_ou = ref_ou.get(ref)
            orgunit = create_or_update_orgunit(existing_ou, row, version, validation_status, ref_group, task)

            if task and total_org_unit % 500 == 0:
                task.report_progress_and_stop_if_killed(
                    progress_message=f"processing layer : {layer_name} {orgunit.name} total_org_unit : {total_org_unit}"
                )

            ref = get_ref(orgunit)  # if ref was null in gpkg
            ref_ou[ref] = orgunit

            parent_ref = None
            if "parent_ref" in row["properties"]:
                if row["properties"]["parent_ref"]:  # Only validate if it has a non-empty value
                    parent_ref = validate_property(row["properties"], "parent_ref", orgunit.name)
                    if parent_ref and parent_ref.startswith(OLD_INTERNAL_REF):
                        parent_ref = parent_ref.replace(OLD_INTERNAL_REF, NEW_INTERNAL_REF)

            to_update_with_parent.append((ref, parent_ref))
            # we will log the modification after we set the parent
            if orgunit.location is not None or orgunit.geom is not None:
                modifications_to_log.append((existing_ou, orgunit))

            total_org_unit += 1
    if task:
        task.report_progress_and_stop_if_killed(
            progress_message=f"processing parents : total_org_unit : {total_org_unit} to_update_with_parent : {len(to_update_with_parent)}"
        )
    parent_count = 0
    for ref, parent_ref in to_update_with_parent:
        parent_count += 1
        ou = ref_ou[ref]
        if parent_ref and parent_ref not in ref_ou:
            raise ValueError(f"Bad GPKG parent {parent_ref} for {ou} don't exist in input or SourceVersion")

        if task and parent_count % 1000 == 0:
            task.report_progress_and_stop_if_killed(
                progress_message=f"processing parent : parent_count : #{parent_count}"
            )
        parent_ou = ref_ou[parent_ref] if parent_ref else None
        ou.parent = parent_ou
        ou.source_ref = ou.source_ref.replace(OLD_INTERNAL_REF, NEW_INTERNAL_REF)
        ou.save()
    if task:
        task.report_progress_and_stop_if_killed(
            progress_message=f"storing log_modifications total_org_unit : {total_org_unit}"
        )
    for old_ou, new_ou in modifications_to_log:
        # Possible optimisation, crate a bulk update
        audit_models.log_modification(old_ou, new_ou, source=audit_models.GPKG_IMPORT, user=user)
    return total_org_unit
