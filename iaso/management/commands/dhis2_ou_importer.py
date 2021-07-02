import csv
import sys
import time

from django.core.management.base import BaseCommand

from django.db import transaction

from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion

from .command_logger import CommandLogger

from ...tasks.dhis2_ou_importer import (
    map_groups,
    load_groupsets,
    orgunit_from_row,
)

# as geometry/coordinates might be big, increase the field size to its max
csv.field_size_limit(sys.maxsize)

"""
Import orgunits and groups from dhis2

Example

./manage.py dhis2_ou_importer \
    --dhis2_user admin \
    --dhis2_password district \
    --dhis2_url https://play.dhis2.org/2.32.7 \
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
            "--dhis2_url", type=str, help="Dhis2 url to import from (without user/password)", required=False
        )
        parser.add_argument("--dhis2_user", type=str, help="dhis2 user name", required=False)
        parser.add_argument("--dhis2_password", type=str, help="dhis2 password of the dhis2_user", required=False)

        parser.add_argument(
            "--org_unit_type_csv_file", type=str, help="Path to the org unit types csv file", required=False
        )
        parser.add_argument(
            "--source_name",
            type=str,
            help="The name of the source. It will be created if it doesn't exist",
            required=True,
        )
        parser.add_argument(
            "--version_number", type=int, help="An integer version number for the new version", required=True
        )
        parser.add_argument(
            "-f", "--force", action="store_true", help="Force the deletion of the pyramid snapshot prior importing"
        )
        parser.add_argument("--validate", action="store_true", help="Mark all the newly imported units as validated")
        parser.add_argument(
            "--continue_on_error",
            action="store_true",
            help="Continue import even if an error occurred for one org unit",
        )
        parser.add_argument(
            "--page-size", type=int, default=500, help="Continue import even if an error occurred for one org unit"
        )

    def parse_type_dict(self, org_unit_type_file_name):
        type_dict = dict()
        with open(org_unit_type_file_name, encoding="utf-8") as csvfile:
            csv_reader = csv.reader(csvfile)

            for row in csv_reader:
                iaso_id, csv_name, parent_csv_name = row
                type_dict[csv_name] = OrgUnitType.objects.get(pk=iaso_id)

        return type_dict

    def print_stats(self, unit_dict, unknown_unit_type):
        self.iaso_logger.info("** Stats ")
        self.iaso_logger.info("orgunits\t", len(unit_dict))
        self.iaso_logger.info("orgunits with point\t", len([p for p in unit_dict.values() if p.location]))
        self.iaso_logger.info("areas with polygon\t", len([p for p in unit_dict.values() if p.geom]))
        self.iaso_logger.info(
            "orgunits with unknown type\t", len([p for p in unit_dict.values() if p.org_unit_type == unknown_unit_type])
        )

    """
    the transaction prevent tons of small commits, and improve performancefrom 34 seconds to 8 seconds on play.dhis2.org dataset
    """

    @transaction.atomic
    def handle(self, *args, **options):
        iaso_logger = CommandLogger(self.stdout)
        self.iaso_logger = iaso_logger
        start = time.time()

        org_unit_type_file_name = options.get("org_unit_type_csv_file", None)
        source_name = options["source_name"]
        version_number = options.get("version_number")
        force = options.get("force")
        validate = options.get("validate")
        continue_on_error = options.get("continue_on_error")
        source, _created = DataSource.objects.get_or_create(name=source_name)

        url = (options.get("dhis2_url"),)
        user = (options.get("dhis2_user"),)
        password = (options.get("dhis2_password"),)

        if url[0] and user[0] and password[0]:
            connection_config = options
        else:
            if source.credentials:
                connection_config = {
                    "dhis2_url": source.credentials.url,
                    "dhis2_password": source.credentials.password,
                    "dhis2_user": source.credentials.login,
                }

            else:
                iaso_logger.info("No credentials exist for this source, please provide them on the command line")
                return
        orgunits = self.fetch_orgunits(connection_config)

        version, _created = SourceVersion.objects.get_or_create(number=version_number, data_source=source)

        version_count = OrgUnit.objects.filter(version=version).count()
        iaso_logger.info("Orgunits in db for source and version ", source, version, version_count)
        if version_count > 0 and not force:
            iaso_logger.error(
                "This is going to delete %d org units records. If you want to proceed, add the -f option to the command"
                % version_count
            )
            return
        else:
            OrgUnit.objects.filter(version=version).delete()
            iaso_logger.warn(("%d org units records deleted" % version_count).upper())

        type_dict = {}
        if org_unit_type_file_name:
            type_dict = self.parse_type_dict(org_unit_type_file_name)

        unknown_unit_type, _created = OrgUnitType.objects.get_or_create(name="%s-%s" % (source_name, "Unknown"))
        group_dict = {}

        index = 0
        unit_dict = dict()
        iaso_logger.ok("about to create orgunits", len(orgunits))
        for row in orgunits:
            try:
                org_unit = orgunit_from_row(row, source, type_dict, unit_dict, unknown_unit_type, validate, version)

                # org_unit should be saved before filling the groups
                map_groups(row, org_unit, group_dict, version)

                unit_dict[org_unit.source_ref] = org_unit

                # log progress
                if index % 100 == 0:
                    iaso_logger.info("%.2f" % (time.time() - start), "sec, processed", index)

            except Exception as e:
                iaso_logger.error("Error %s for row %d" % (e, index), row)
                if not continue_on_error:
                    raise e
            index += 1

        iaso_logger.ok("created orgunits", index)
        load_groupsets(connection_config, version, group_dict)

        end = time.time()
        iaso_logger.ok("processed in %.2f seconds" % (end - start))
        self.print_stats(unit_dict, unknown_unit_type)
