import csv
import sys
import json
import time

from django.core.management.base import BaseCommand
from django.contrib.gis.geos import Point
from django.contrib.gis.geos import Polygon
from django.db import transaction

from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Group, GroupSet

from .command_logger import CommandLogger

# as geometry/coordinates might be big, increase the field size to its max
csv.field_size_limit(sys.maxsize)

"""
Import orgunits and groups from dhis2

Example

./manage.py dhis2_ou_importer \
    --dhis2_user admin \
    --dhis2_password district \
    --dhis2_url https://play.dhis2.org/2.32.3 \
    --source_name play \
    --version_number 1 \
    --org_unit_type_csv_file ./data/play_unit_types.csv

the org_unit_type_csv_file file format is a csv WITHOUT headers with iaso_orgunit_type_id,dhis2_name,dhis2_parent_name
the source will be created if missing
if an import already exist with the number, a warning will be displayed, you can still force with -f

"""


class Command(BaseCommand):
    help = "Import a a dhis2 pyramid into iaso"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dhis2_url",
            type=str,
            help="Dhis2 url to import from (without user/password)",
        )
        parser.add_argument(
            "--dhis2_user", type=str, help="dhis2 user name", required=True
        )
        parser.add_argument(
            "--dhis2_password",
            type=str,
            help="dhis2 password of the dhis2_user",
            required=True,
        )

        parser.add_argument(
            "--org_unit_type_csv_file",
            type=str,
            help="Path to the org unit types csv file",
        )
        parser.add_argument(
            "--source_name",
            type=str,
            help="The name of the source. It will be created if it doesn't exist",
        )
        parser.add_argument(
            "--version_number",
            type=int,
            help="An integer version number for the new version",
        )
        parser.add_argument(
            "-f",
            "--force",
            action="store_true",
            help="Force the deletion of the pyramid snapshot prior importing",
        )

    def get_group(self, dhis2_group, group_dict, source_version):
        name = dhis2_group["name"]
        group = group_dict.get(name, None)
        if group is None:
            group, created = Group.objects.get_or_create(
                name=name, source_version=source_version, source_ref=dhis2_group["id"]
            )
            self.iaso_logger.info("group, created ", group, created)
            group_dict[name] = group

        return group

    @staticmethod
    def row_without_coordinates(row):
        return {i: row[i] for i in row if i != "coordinates" and i != "geometry"}

    @staticmethod
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

    def parse_type_dict(self, org_unit_type_file_name):
        type_dict = dict()
        with open(org_unit_type_file_name, encoding="utf-8") as csvfile:
            csv_reader = csv.reader(csvfile)

            for row in csv_reader:
                iaso_id, csv_name, parent_csv_name = row
                type_dict[csv_name] = OrgUnitType.objects.get(pk=iaso_id)

        return type_dict

    def get_api(self, options):
        from dhis2 import Api

        api = Api(
            options.get("dhis2_url"),
            options.get("dhis2_user"),
            options.get("dhis2_password"),
        )

        return api

    def fetch_orgunits(self, options):

        api = self.get_api(options)
        orgunits = []

        for page in api.get_paged(
            "organisationUnits",
            page_size=500,
            params={
                "fields": "id,name,path,coordinates,geometry,parent,organisationUnitGroups[id,name]"
            },
        ):
            orgunits.extend(page["organisationUnits"])
            self.iaso_logger.info(
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

        return sorted(orgunits, key=lambda ou: ou["path"])

    def map_coordinates(self, row, org_unit):
        if "coordinates" in row:
            coordinates = row["coordinates"]
            feature_type = self.guess_feature_type(row["coordinates"])

            if feature_type == "POINT" and coordinates:
                try:
                    tuple = json.loads(coordinates)
                    pnt = Point(float(tuple[0]), float(tuple[1]))
                    org_unit.location = pnt
                    org_unit.longitude = pnt.x
                    org_unit.latitude = pnt.y
                except Exception as bad_coord:
                    self.iaso_logger.error(
                        "failed at importing POINT", coordinates, bad_coord, row
                    )

            if feature_type == "POLYGON" and coordinates:
                j = json.loads(coordinates)
                org_unit.simplified_geom = Polygon(j[0][0])

            if feature_type == "MULTI_POLYGON" and coordinates:
                j = json.loads(coordinates)
                org_unit.simplified_geom = Polygon(j[0][0])

    def map_geometry(self, row, org_unit):
        if "geometry" in row:
            coordinates = row["geometry"]["coordinates"]
            feature_type = row["geometry"]["type"]

            if feature_type == "Point" and coordinates:
                try:
                    pnt = Point(coordinates[0], coordinates[1])
                    org_unit.location = pnt
                    org_unit.longitude = pnt.x
                    org_unit.latitude = pnt.y
                except Exception as bad_coord:
                    self.iaso_logger.error(
                        "failed at importing POINT", coordinates, bad_coord, row
                    )

            try:
                if feature_type == "Polygon" and coordinates:
                    org_unit.simplified_geom = Polygon(coordinates[0])

                if feature_type == "MultiPolygon" and coordinates:
                    org_unit.simplified_geom = Polygon(coordinates[0][0])

            except Exception as bad_coord:
                self.iaso_logger.error(
                    "failed at importing ", feature_type, coordinates, bad_coord, row
                )

    def map_parent(self, row, org_unit, unit_dict):
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

    def map_org_unit_type(self, row, org_unit, type_dict, unknown_unit_type):
        for group in row["organisationUnitGroups"]:
            if group["name"] in type_dict:
                org_unit.org_unit_type = type_dict[group["name"]]
                break

        if org_unit.org_unit_type is None:
            org_unit.org_unit_type = unknown_unit_type
            self.iaso_logger.warn(
                "unknown type for ", self.row_without_coordinates(row)
            )

    def map_groups(self, row, org_unit, group_dict, version):
        for ougroup in row["organisationUnitGroups"]:
            group = self.get_group(ougroup, group_dict, version)
            group.org_units.add(org_unit)

    def print_stats(self, unit_dict, unknown_unit_type):
        self.iaso_logger.info("** Stats ")
        self.iaso_logger.info("orgunits\t", len(unit_dict))
        self.iaso_logger.info(
            "orgunits with point\t", len([p for p in unit_dict.values() if p.latitude])
        )
        self.iaso_logger.info(
            "areas with polygon\t",
            len([p for p in unit_dict.values() if p.simplified_geom]),
        )
        self.iaso_logger.info(
            "orgunits with unknown type\t",
            len(
                [p for p in unit_dict.values() if p.org_unit_type == unknown_unit_type]
            ),
        )

    def load_groupsets(self, options, version, group_dict):
        group_set_dict = {}
        api = self.get_api(options)
        dhis2_group_sets = api.get(
            "organisationUnitGroupSets",
            params={
                "paging": "false",
                "fields": "id,name,organisationUnitGroups[id,name]",
            },
        )
        dhis2_group_sets = dhis2_group_sets.json()["organisationUnitGroupSets"]

        for dhis2_group_set in dhis2_group_sets:
            group_set = self.get_group_set(dhis2_group_set, group_set_dict, version)

            for ougroup in dhis2_group_set["organisationUnitGroups"]:
                group = self.get_group(ougroup, group_dict, version)
                group_set.groups.add(group)

    def get_group_set(self, dhis2_group_set, group_set_dict, source_version):
        name = dhis2_group_set["name"]
        group_set = group_set_dict.get(name, None)
        if group_set is None:
            group_set, created = GroupSet.objects.get_or_create(
                name=name,
                source_version=source_version,
                source_ref=dhis2_group_set["id"],
            )
            self.iaso_logger.info("groupset, created ", group_set, created)
            group_set_dict[id] = group_set

        return group_set

    """
    the trasanction prevent tons of small commits, and improve performancefrom 34 seconds to 8 seconds on play.dhis2.org dataset
    """

    @transaction.atomic
    def handle(self, *args, **options):
        iaso_logger = CommandLogger(self.stdout)
        self.iaso_logger = iaso_logger
        start = time.time()
        orgunits = self.fetch_orgunits(options)

        org_unit_type_file_name = options.get("org_unit_type_csv_file")
        source_name = options["source_name"]
        version_number = options.get("version_number")
        force = options.get("force")

        source, _created = DataSource.objects.get_or_create(name=source_name)

        version, _created = SourceVersion.objects.get_or_create(
            number=version_number, data_source=source
        )

        version_count = OrgUnit.objects.filter(version=version).count()
        iaso_logger.info(
            "Orgunits in db for source and version ", source, version, version_count
        )
        if version_count > 0 and not force:
            iaso_logger.error(
                "This is going to delete %d org units records. If you want to proceed, add the -f option to the command"
                % version_count
            )
            return
        else:
            OrgUnit.objects.filter(version=version).delete()
            iaso_logger.warn(("%d org units records deleted" % version_count).upper())

        type_dict = self.parse_type_dict(org_unit_type_file_name)

        unknown_unit_type, _created = OrgUnitType.objects.get_or_create(name="Inconnu")
        group_dict = {}

        index = 0
        unit_dict = dict()
        iaso_logger.ok("about to create orgunits", len(orgunits))
        for row in orgunits:
            try:
                org_unit = OrgUnit()
                org_unit.name = row["name"].strip()
                org_unit.sub_source = source_name
                org_unit.version = version
                org_unit.source_ref = row["id"].strip()
                org_unit.validated = False

                self.map_org_unit_type(row, org_unit, type_dict, unknown_unit_type)
                self.map_parent(row, org_unit, unit_dict)
                # if dhis2 version < 2.32
                self.map_coordinates(row, org_unit)
                # if dhis2 version >= 2.32
                self.map_geometry(row, org_unit)

                org_unit.save()

                # log progress
                if index % 100 == 0:
                    iaso_logger.info(
                        "%.2f" % (time.time() - start), "sec, processed", index
                    )

                # org_unit should be saved before filling the groups
                self.map_groups(row, org_unit, group_dict, version)

                unit_dict[org_unit.source_ref] = org_unit
            except Exception as e:
                iaso_logger.error("Error %s for row %d" % (e, index), row)
                raise e
            index += 1

        iaso_logger.ok("created orgunits", index)
        self.load_groupsets(options, version, group_dict)

        end = time.time()
        iaso_logger.ok("processed in %.2f seconds" % (end - start))
        self.print_stats(unit_dict, unknown_unit_type)
