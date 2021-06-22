from iaso.models import (
    OrgUnit,
    OrgUnitType,
    DataSource,
    SourceVersion,
    Group,
    GroupSet,
    Task,
    SUCCESS,
    ERRORED,
    RUNNING,
)
from beanstalk_worker import task
from django.contrib.gis.geos import Point, MultiPolygon, Polygon

import logging
import csv
import sys
import json
import time


logger = logging.getLogger(__name__)


def get_api(options):
    from dhis2 import Api

    api = Api(options.get("dhis2_url"), options.get("dhis2_user"), options.get("dhis2_password"))

    return api


def fetch_orgunits(options):
    api = get_api(options)
    orgunits = []

    for page in api.get_paged(
        "organisationUnits",
        page_size=options.get("page_size", 500),
        params={"fields": "id,name,path,coordinates,geometry,parent,organisationUnitGroups[id,name]"},
    ):

        orgunits.extend(page["organisationUnits"])
        logger.debug(
            "fetched ",
            page["pager"]["page"],
            "/",
            page["pager"]["pageCount"],
            "(",
            len(orgunits),
            "/",
            page["pager"]["total"],
            "records)",
        )

    orgunits_sorted = sorted(orgunits, key=lambda ou: ou["path"])

    return orgunits_sorted


def map_parent(row, org_unit, unit_dict):
    parent_id = None
    if "parent" in row:
        parent_id = row["parent"]["id"]

    if parent_id:
        org_unit.parent = unit_dict.get(parent_id)
        if not org_unit.parent:
            raise Exception(
                "Parent nof found for "
                + org_unit.source_ref
                + parent_id
                + " details :"
                + str(org_unit)
                + " "
                + str(row)
            )


def row_without_coordinates(row):
    return {i: row[i] for i in row if i != "coordinates" and i != "geometry"}


def map_org_unit_type(row, org_unit, type_dict, unknown_unit_type):
    for group in row["organisationUnitGroups"]:
        if group["name"] in type_dict:
            org_unit.org_unit_type = type_dict[group["name"]]
            break

    if org_unit.org_unit_type is None:
        org_unit.org_unit_type = unknown_unit_type
        logger.debug("unknown type for ", row_without_coordinates(row))


def guess_feature_type(coordinates):
    if coordinates == None:
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

        if feature_type == "POINT" and coordinates:
            try:
                tuple = json.loads(coordinates)
                # No altitude in DHIS2, but mandatory in Iaso
                pnt = Point((float(tuple[0]), float(tuple[1]), 0))
                if abs(pnt.x) < 180 and abs(pnt.y) < 90:
                    org_unit.location = pnt
                else:
                    logger.debug("Invalid coordinates found in row", coordinates, row)
            except Exception as bad_coord:
                logger.debug("failed at importing POINT", coordinates, bad_coord, row)

        if feature_type == "POLYGON" and coordinates:
            try:
                j = json.loads(coordinates)
                org_unit.geom = MultiPolygon(Polygon(j[0]))
            except Exception as bad_polygon:
                logger.debug("failed at importing POLYGON", coordinates, bad_polygon, row)
        if feature_type == "MULTI_POLYGON" and coordinates:
            try:
                j = json.loads(coordinates)
                org_unit.geom = MultiPolygon(*[Polygon(i) for i in j[0]])
            except Exception as bad_polygon:
                logger.debug("failed at importing POLYGON", coordinates, bad_polygon, row)

        org_unit.simplified_geom = org_unit.geom


def map_geometry(row, org_unit):
    if "geometry" in row:
        coordinates = row["geometry"]["coordinates"]
        feature_type = row["geometry"]["type"]

        if feature_type == "Point" and coordinates:
            try:
                # No altitude in DHIS2, but mandatory in Iaso
                pnt = Point((coordinates[0], coordinates[1], 0))
                org_unit.location = pnt
            except Exception as bad_coord:
                logger.debug("failed at importing POINT", coordinates, bad_coord, row)

        try:
            if feature_type == "Polygon" and coordinates:
                org_unit.geom = MultiPolygon(Polygon(*coordinates))

            if feature_type == "MultiPolygon" and coordinates:
                org_unit.geom = MultiPolygon([Polygon(*p) for p in coordinates])

            org_unit.simplified_geom = org_unit.geom

        except Exception as bad_coord:
            logger.debug("failed at importing ", feature_type, coordinates, bad_coord, row)


def get_group(dhis2_group, group_dict, source_version):
    name = dhis2_group["name"]
    group = group_dict.get(name, None)
    if group is None:
        group, created = Group.objects.get_or_create(
            name=name, source_version=source_version, source_ref=dhis2_group["id"]
        )
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
        logger.debug("groupset, created ", group_set, created)
        group_set_dict[id] = group_set

    return group_set


def map_groups(row, org_unit, group_dict, version):
    for ougroup in row["organisationUnitGroups"]:
        group = get_group(ougroup, group_dict, version)
        group.org_units.add(org_unit)


def load_groupsets(options, version, group_dict):
    group_set_dict = {}
    api = get_api(options)
    dhis2_group_sets = api.get(
        "organisationUnitGroupSets", params={"paging": "false", "fields": "id,name,organisationUnitGroups[id,name]"}
    )
    dhis2_group_sets = dhis2_group_sets.json()["organisationUnitGroupSets"]

    for dhis2_group_set in dhis2_group_sets:
        group_set = get_group_set(dhis2_group_set, group_set_dict, version)

        for ougroup in dhis2_group_set["organisationUnitGroups"]:
            group = get_group(ougroup, group_dict, version)
            group_set.groups.add(group)


@task(task_name="dhis2_ou_importer")
def dhis2_ou_importer(
    source_id, source_version_number, force, validate, continue_on_error, url, login, password, task=None
):
    the_task = task
    logger.debug("********* Starting import")
    source = DataSource.objects.get(id=source_id)
    source_version, _created = SourceVersion.objects.get_or_create(
        number=int(source_version_number), data_source=source
    )
    start = time.time()

    logger.debug("source", source)
    logger.debug("source_version", source_version)

    if url and login and password:
        connection_config = {
            "dhis2_url": url,
            "dhis2_password": password,
            "dhis2_user": login,
        }
    # TODO handle case when request doesn't have all 3 fields (url, login, password) to avoid creating tasks with parameters other than those expected by user
    else:
        if source.credentials:
            connection_config = {
                "dhis2_url": source.credentials.url,
                "dhis2_password": source.credentials.password,
                "dhis2_user": source.credentials.login,
            }

        else:
            res_string = "No credentials exist for this source, please provide them "
            logger.debug(res_string)
            the_task.status = ERRORED
            the_task.result = {"message": res_string}
            the_task.save()
            return
    the_task.report_progress_and_stop_if_killed(progress_message="fetching org units")
    orgunits = fetch_orgunits(connection_config)

    version, _created = SourceVersion.objects.get_or_create(number=source_version_number, data_source=source)

    version_count = OrgUnit.objects.filter(version=version).count()

    logger.debug("Orgunits in db for source and version ", source, version, version_count)
    if version_count > 0 and not force:
        res_string = (
            "This is going to delete %d org units records. If you want to proceed, add the -f option" % version_count
        )
        logger.debug(res_string)
        the_task.status = ERRORED
        the_task.result = {"message": res_string}
        the_task.save()
        return
    else:
        OrgUnit.objects.filter(version=version).delete()
        logger.debug(("%d org units records deleted" % version_count).upper())

    type_dict = {}
    unknown_unit_type, _created = OrgUnitType.objects.get_or_create(
        name="%s-%s-%d" % (source.name, "Unknown", source.id)
    )
    for project in source.projects.all():
        unknown_unit_type.projects.add(project)
    group_dict = {}

    index = 0
    unit_dict = dict()
    logger.debug("about to create orgunits", len(orgunits))
    the_task.report_progress_and_stop_if_killed(
        progress_value=0, end_value=len(orgunits), progress_message="Importing org units"
    )
    for row in orgunits:
        try:
            org_unit = OrgUnit()
            org_unit.name = row["name"].strip()
            org_unit.sub_source = source.name
            org_unit.version = version
            org_unit.source_ref = row["id"].strip()
            org_unit.validation_status = OrgUnit.VALIDATION_VALID if validate else OrgUnit.VALIDATION_NEW

            map_org_unit_type(row, org_unit, type_dict, unknown_unit_type)
            map_parent(row, org_unit, unit_dict)
            # if dhis2 version < 2.32
            map_coordinates(row, org_unit)
            # if dhis2 version >= 2.32
            map_geometry(row, org_unit)
            org_unit.save()

            res_string = "%.2f sec, processed %i org units" % (time.time() - start, index)
            the_task.report_progress_and_stop_if_killed(progress_message=res_string, progress_value=index)

            # log progress
            if index % 100 == 0:
                logger.debug(res_string)

            # org_unit should be saved before filling the groups
            map_groups(row, org_unit, group_dict, version)

            unit_dict[org_unit.source_ref] = org_unit
        except Exception as e:
            res_string = "Error %s for row %d" % (e, index), row
            logger.debug(res_string)
            if not continue_on_error:
                the_task.status = ERRORED
                the_task.result = {"message": res_string}
                the_task.save()
                raise e
        index += 1

    logger.debug("created orgunits", index)
    load_groupsets(connection_config, version, group_dict)

    end = time.time()
    logger.debug("processed in %.2f seconds" % (end - start))
    res_string = (
        "processed in %.2f seconds" % (end - start),
        "orgunits:",
        len(unit_dict),
        "orgunits with point: ",
        len([p for p in unit_dict.values() if p.location]),
        "areas with polygon: ",
        len([p for p in unit_dict.values() if p.geom]),
    )

    the_task.report_success(message=res_string)
    logger.debug("********* Finishing import")

    return the_task
