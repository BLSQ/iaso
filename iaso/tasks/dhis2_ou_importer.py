import json
import logging
import time
from typing import Optional, Dict, Any, List

from dhis2 import Api
from django.contrib.gis.geos import Point, MultiPolygon, Polygon
from django.utils.timezone import now

from beanstalk_worker import task_decorator
from iaso.models import (
    OrgUnit,
    OrgUnitType,
    DataSource,
    SourceVersion,
    Group,
    GroupSet,
    Task,
)

try:  # only in 3.8
    from typing import TypedDict  # type: ignore
except ImportError:
    TypedDict = type

logger = logging.getLogger(__name__)


#  Define a few types around the Dhis2 API format to help dev


class DhisGroup(TypedDict):
    id: str
    name: str


class DhisGeom(TypedDict):
    """Seems to be a GeoJson"""

    type: str
    coordinates: list


class DhisOrgunit(TypedDict):
    id: str  # "Rp268JB6Ne4"
    name: str  # "Adonkia CHP"
    parent: Optional[str]  # "qtr8GGlm4gg"
    coordinates: Optional[str]  # in old version
    geometry: Optional[DhisGeom]
    organisationUnitGroups: List[DhisGroup]
    path: str  # e.g. "/ImspTQPwCqd/at6UHUQatSo/qtr8GGlm4gg/Rp268JB6Ne4"
    level: int  # e.g 4


def get_api(options_or_url, login=None, password=None):
    if isinstance(options_or_url, dict):
        options = options_or_url
        return Api(options["dhis2_url"], options["dhis2_user"], options["dhis2_password"])
    return Api(options_or_url, login, password)


def fetch_orgunits(api: Api) -> List[DhisOrgunit]:
    orgunits: List[DhisOrgunit] = []

    for page in api.get_paged(
        "organisationUnits",
        page_size=500,
        params={"fields": "id,name,path,coordinates,geometry,parent,organisationUnitGroups[id,name],level"},
    ):
        orgunits.extend(page["organisationUnits"])
        logger.info(
            f'fetched {page["pager"]["page"]}/{page["pager"]["pageCount"]} '
            f'({len(orgunits)}/{page["pager"]["total"]} records)'
        )

    # sorting orgunit according to their path ensure the parent are before the children
    orgunits_sorted = sorted(orgunits, key=lambda ou: ou["path"])
    return orgunits_sorted


def map_parent(row, org_unit, unit_dict):
    if "parent" in row:
        parent_id = row["parent"]["id"]

        if parent_id not in unit_dict:
            raise Exception(f"Parent nof found for {org_unit.source_ref} {parent_id}. details : {org_unit} {row}")
        org_unit.parent = unit_dict[parent_id]


def find_org_unit_type(
    groups: List[DhisGroup],
    group_type_dict,
    level: int,
    level_to_type: Dict[int, OrgUnitType],
):
    # Group matching startegy (to deprecate?) then by level
    for group in groups:
        if group["name"] in group_type_dict:
            return group_type_dict[group["name"]]
    return level_to_type.get(level, None)


def orgunit_from_row(
    row: DhisOrgunit,
    source,
    version,
    unit_dict,
    group_dict,
    group_type_dict,
    validate,
    unknown_unit_type: OrgUnitType,  # fall back org unit type
    level_to_type: Dict[int, OrgUnitType],
) -> OrgUnit:
    org_unit = OrgUnit()
    org_unit.name = row["name"].strip()
    org_unit.sub_source = source.name
    org_unit.version = version
    org_unit.source_ref = row["id"].strip()
    org_unit.validation_status = OrgUnit.VALIDATION_VALID if validate else OrgUnit.VALIDATION_NEW
    org_unit.org_unit_type = find_org_unit_type(
        row["organisationUnitGroups"], group_type_dict, row["level"], level_to_type
    )
    if not org_unit.org_unit_type:
        org_unit.org_unit_type = unknown_unit_type
        if group_type_dict:
            logger.warning("unknown type for ", org_unit)
    map_parent(row, org_unit, unit_dict)
    # if dhis2 version < 2.32
    map_coordinates(row, org_unit)
    # if dhis2 version >= 2.32
    map_geometry(row, org_unit)
    org_unit.save()

    # org_unit should be saved before filling the groups
    for dhis_group in row["organisationUnitGroups"]:
        group = get_or_create_group(dhis_group, group_dict, version)
        group.org_units.add(org_unit)
    return org_unit


def guess_feature_type(coordinates):
    if not coordinates:
        return None
    if coordinates.startswith("[[[["):
        return "MULTI_POLYGON"
    if coordinates.startswith("[[["):
        return "POLYGON"
    if coordinates.startswith("["):
        return "POINT"
    return None


def map_coordinates(row, org_unit):
    if "coordinates" in row:
        coordinates = row["coordinates"]
        feature_type = guess_feature_type(row["coordinates"])

        try:
            if feature_type == "POINT" and coordinates:
                x, y = json.loads(coordinates)
                # No altitude in DHIS2, but mandatory in Iaso
                pnt = Point(float(x), float(y), 0)
                if abs(pnt.x) < 180 and abs(pnt.y) < 90:
                    org_unit.location = pnt
                else:
                    logger.warning("Invalid coordinates found in row", coordinates, row)
            if feature_type == "POLYGON" and coordinates:
                j = json.loads(coordinates)
                org_unit.geom = MultiPolygon(Polygon(j[0]))
            if feature_type == "MULTI_POLYGON" and coordinates:
                j = json.loads(coordinates)
                org_unit.geom = MultiPolygon(*[Polygon(i) for i in j[0]])
        except Exception as bad_polygon:
            logger.debug("Failed at importing geo", feature_type, coordinates, bad_polygon, row)

        org_unit.simplified_geom = org_unit.geom


def map_geometry(row: DhisOrgunit, org_unit: OrgUnit):
    if "geometry" in row:
        feature_type = None
        coordinates = None
        try:
            geometry_ = row["geometry"]
            if not isinstance(geometry_, dict):
                logger.warning("Unsupported feature tye")
                return
            coordinates = geometry_.get("coordinates")
            feature_type = geometry_.get("type")
            if feature_type == "Point" and coordinates:
                # No altitude in DHIS2, but mandatory in Iaso
                org_unit.location = Point(coordinates[0], coordinates[1], 0)
            elif feature_type == "Polygon" and coordinates:
                org_unit.geom = MultiPolygon(Polygon(*coordinates))
                org_unit.simplified_geom = org_unit.geom
            elif feature_type == "MultiPolygon" and coordinates:
                org_unit.geom = MultiPolygon([Polygon(*p) for p in coordinates])
                org_unit.simplified_geom = org_unit.geom
            else:
                logger.warning("Unsupported feature tye")

        except Exception as bad_coord:
            logger.error("Failed at parsing geo ", feature_type, coordinates, bad_coord, row)


def get_or_create_group(dhis2_group: DhisGroup, group_dict: Dict[str, Group], source_version: SourceVersion):
    name = dhis2_group["name"]
    if name in group_dict:
        return group_dict[name]

    group, created = Group.objects.get_or_create(name=name, source_version=source_version, source_ref=dhis2_group["id"])
    logger.debug("group, created ", group, created)
    group_dict[name] = group
    return group


def get_group_set(dhis2_group_set, group_set_dict, source_version):
    name = dhis2_group_set["name"]
    group_set = group_set_dict.get(name, None)
    if group_set is None:
        group_set, created = GroupSet.objects.get_or_create(
            name=name, source_version=source_version, source_ref=dhis2_group_set["id"]
        )
        logger.debug(f"GroupSet {group_set} {'created' if created else 'from_db'} ")
        group_set_dict[id] = group_set

    return group_set


def load_groupsets(api: Api, version, group_dict):
    dhis2_group_sets = api.get(
        "organisationUnitGroupSets", params={"paging": "false", "fields": "id,name,organisationUnitGroups[id,name]"}
    )
    dhis2_group_sets = dhis2_group_sets.json()["organisationUnitGroupSets"]

    for dhis2_group_set in dhis2_group_sets:
        group_set = get_group_set(dhis2_group_set, {}, version)

        for ougroup in dhis2_group_set["organisationUnitGroups"]:
            group = get_or_create_group(ougroup, group_dict, version)
            group_set.groups.add(group)


def get_api_config(
    url: Optional[str], login: Optional[str], password: Optional[str], source: DataSource
) -> Dict[str, Any]:
    if url and login and password:
        connection_config = {
            "dhis2_url": url,
            "dhis2_password": password,
            "dhis2_user": login,
        }
    else:
        if source.credentials:
            connection_config = {
                "dhis2_url": source.credentials.url,
                "dhis2_password": source.credentials.password,
                "dhis2_user": source.credentials.login,
            }
        else:
            raise ValueError("No credentials exist for this source, please provide them")
    return connection_config


# TODO : remove force
@task_decorator(task_name="dhis2_ou_importer")
def dhis2_ou_importer(
    source_id: int,
    source_version_number: Optional[int],
    force: bool,  # FIXME: force parameter is not used?
    validate: bool,
    continue_on_error: bool,
    url: Optional[str],
    login: Optional[str],
    password: Optional[str],
    update_mode: bool = False,
    task: Task = None,
    description="",
) -> Task:
    the_task = task
    start = time.time()

    source = DataSource.objects.get(id=source_id)

    connection_config = get_api_config(url, login, password, source)
    api = get_api(connection_config)

    the_task.report_progress_and_stop_if_killed(progress_message="Fetching org units")  # type: ignore

    if source_version_number is None:
        last_version = source.versions.all().order_by("number").last()
        source_version_number = last_version.number + 1 if last_version else 0
        version = SourceVersion.objects.create(
            number=source_version_number, data_source=source, description=description
        )
    else:
        version, _created = SourceVersion.objects.get_or_create(number=source_version_number, data_source=source)
    if OrgUnit.objects.filter(version=version).count() > 0 and not update_mode:
        raise Exception(f"Version {SourceVersion} is not Empty")
    if not source.default_version:
        source.default_version = version
        source.save()

    # if there is no default source version on account, set it as such
    # TODO: investigate: what happens if source.projects is None here?
    account = source.projects.first().account  # type: ignore
    # TODO: investigate: what happens if account is None here?
    if not account.default_version:  # type: ignore
        account.default_version = version  # type: ignore
        account.save()  # type: ignore

    # name of group to an orgunit type. If an orgunit belong to one of these group it will get that type
    group_type_dict: Dict[str, OrgUnitType] = {}
    error_count, unit_dict = import_orgunits_and_groups(
        api, source, version, validate, continue_on_error, group_type_dict, start, update_mode, the_task
    )

    end = time.time()
    # TODO add skipped count
    res_string = f"""Processed {len(unit_dict)} orgunits in {end - start:.2f} seconds
        Orgunits with point: {len([p for p in unit_dict.values() if p.location])},
        Orgunits with polygon: {len([p for p in unit_dict.values() if p.geom])}
        Errors : {error_count}
    """
    if error_count:
        logger.error(f"{error_count} import errors were ignored")

    # TODO: investigate type errors on next two lines
    the_task.report_success(message=res_string)  # type: ignore
    return the_task  # type: ignore


class LeveLDict(TypedDict):
    displayName: str
    id: int
    level: int
    name: str


def get_org_unit_levels(api: Api) -> List[LeveLDict]:
    res = api.get_paged(
        "organisationUnitLevels",
        merge=True,
        params=dict(
            fields=[
                "displayName",
                "id",
                "level",
                "name",
            ]
        ),
    )
    levels = res.get("organisationUnitLevels", [])
    return levels


def import_orgunits_and_groups(
    api, source, version, validate, continue_on_error, group_type_dict, start, update_mode, task
):
    index = 0
    error_count = 0
    skip_count = 0
    orgunits = fetch_orgunits(api)
    task.report_progress_and_stop_if_killed(
        progress_value=0, end_value=len(orgunits), progress_message="Importing org units"
    )

    # Fallback type if we don't find a type
    unknown_unit_type, _created = OrgUnitType.objects.get_or_create(name=f"{source.name}-{'Unknown'}-{source.id:d}")
    source_projects = source.projects.all()
    unknown_unit_type.projects.set(source_projects)

    # Create OrgUnit from levels
    levels = get_org_unit_levels(api)
    level_to_type: Dict = {}
    for level in levels:
        out = OrgUnitType.objects.filter(projects__in=source_projects, name=level["name"]).first()
        if not out:
            out = OrgUnitType.objects.create(
                name=level["name"],
                short_name=level["name"],
                depth=level["level"],
            )
            out.projects.set(source_projects)
        level_to_type[out.depth] = out

    group_dict = {}
    unit_dict = {ou.source_ref: ou for ou in version.orgunit_set.all()}
    created_ou = {}

    for row in orgunits:
        # In update mode we only create non-present OrgUnit, but we don't update existing one.
        # in not update mode the version should be empty, so explode
        if row["id"].strip() in unit_dict:
            if update_mode:
                skip_count += 1
                continue
            else:
                assert False, "not here"

        try:
            org_unit = orgunit_from_row(
                row,
                source,
                version,
                unit_dict,
                group_dict,
                group_type_dict,
                validate,
                unknown_unit_type,
                level_to_type,
            )
            unit_dict[org_unit.source_ref] = org_unit
            created_ou[org_unit.source_ref] = org_unit

        except Exception as e:
            logger.exception(f"Error importing row {index:d}: {row}")
            if not continue_on_error:
                raise e
            error_count += 1

        # log progress every 100 orgunits
        if index % 100 == 0:
            res_string = "%.2f sec, processed %i org units" % (time.time() - start, index + 1)
            task.report_progress_and_stop_if_killed(
                progress_message=res_string, progress_value=index, end_value=len(orgunits)
            )

        index += 1

    logger.debug(f"Created {index} OrgUnits")

    task.report_progress_and_stop_if_killed(
        progress_message=f"Created {index} OrgUnits", progress_value=index, end_value=index
    )

    # Create a group that represent all the Orgunit imported
    if created_ou and update_mode:
        g = Group.objects.create(name=f"Imported on {now().strftime('%d/%m/%Y %H:%M:%S')}", source_version=version)
        g.org_units.set(created_ou.values())

    load_groupsets(api, version, group_dict)
    return error_count, unit_dict
