"""
Import orgunits and groups from dhis2

Example

./manage.py dhis2_ou_importer \
    --dhis2_user admin \
    --dhis2_password district \
    --dhis2_url https://play.dhis2.org/2.35.3 \
    --source_name play \
    --version_number 1 \
    --org_unit_type_csv_file ./data/play_unit_types.csv (optional)

The org_unit_type_csv_file file format is a csv WITHOUT headers with iaso_orgunit_type_id,dhis2_name,dhis2_parent_name.
The source will be created if missing.
If an import already exist with the number, a warning will be displayed, you can still force with -f

"""

import csv
import sys
import time

from django.core.management.base import BaseCommand
from django.db import transaction

from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion
from .command_logger import CommandLogger
from ...tasks.dhis2_ou_importer import (
    get_api_config,
    get_api,
    import_orgunits_and_groups,
)

# as geometry/coordinates might be big, increase the field size to its max
csv.field_size_limit(sys.maxsize)


class FakeTask:
    """Fake task, so we can share code with the dhis2 task and have output"""

    def __init__(self, iaso_logger):
        self.logger = iaso_logger

    def report_progress_and_stop_if_killed(self, progress_value=None, progress_message=None, end_value=None):
        self.logger.info(progress_message, progress_value, "/", end_value)

    def report_success(self, message):
        self.logger.info(message)


def parse_type_dict(org_unit_type_file_name):
    type_dict = dict()
    with open(org_unit_type_file_name, encoding="utf-8") as csvfile:
        csv_reader = csv.reader(csvfile)

        for row in csv_reader:
            iaso_id, csv_name, parent_csv_name = row
            type_dict[csv_name] = OrgUnitType.objects.get(pk=iaso_id)

    return type_dict


class Command(BaseCommand):
    help = "Import a dhis2 pyramid into Iaso"

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

    def handle(
        self,
        source_name,
        org_unit_type_csv_file=None,
        version_number=None,
        force=None,
        validate=None,
        continue_on_error=None,
        dhis2_url=None,
        dhis2_user=None,
        dhis2_password=None,
        **kwargs,
    ):
        iaso_logger = CommandLogger(self.stdout)
        start = time.time()

        # the transaction prevent tons of small commits, and improve performance
        # moved to outside, so we have proper stats
        with transaction.atomic():
            source, _created = DataSource.objects.get_or_create(name=source_name)
            try:
                connection_config = get_api_config(dhis2_url, dhis2_user, dhis2_password, source)
            except ValueError:
                iaso_logger.info("No credentials exist for this source, please provide them on the command line")
                return
            api = get_api(connection_config)

            version, _created = SourceVersion.objects.get_or_create(number=version_number, data_source=source)

            version_count = OrgUnit.objects.filter(version=version).count()
            iaso_logger.info("Orgunits in db for source and version ", source, version, version_count)
            if version_count > 0:
                if not force:
                    iaso_logger.error(
                        "This is going to delete %d org units records. If you want to proceed, add the -f option to the command"
                        % version_count
                    )
                    return
                else:
                    deleted = OrgUnit.objects.filter(version=version).delete()
                    iaso_logger.warn(deleted)
                    iaso_logger.warn(("%d org units records deleted" % version_count).upper())

            type_dict = {}
            if org_unit_type_csv_file:
                type_dict = parse_type_dict(org_unit_type_csv_file)

            task = FakeTask(iaso_logger)

            error_count, unit_dict = import_orgunits_and_groups(
                api, source, version, validate, continue_on_error, type_dict, start, update_mode=False, task=task
            )
            iaso_logger.info("Committing in the DB....")

        end = time.time()
        iaso_logger.ok("processed in %.2f seconds" % (end - start))
        iaso_logger.info("** Stats ")
        iaso_logger.info("orgunits\t", len(unit_dict))
        iaso_logger.info("orgunits with point\t", len([p for p in unit_dict.values() if p.location]))
        iaso_logger.info("areas with polygon\t", len([p for p in unit_dict.values() if p.geom]))
        iaso_logger.info("Number of errors: ", error_count)
