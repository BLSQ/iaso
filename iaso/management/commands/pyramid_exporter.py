import time
import json

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.gis.geos import Point
from django.contrib.gis.geos import GEOSGeometry
from django.core.serializers import serialize
from .command_logger import CommandLogger

from iaso.models import (
    OrgUnit,
    OrgUnitType,
    DataSource,
    SourceVersion,
    Group,
    GroupSet,
    generate_id_for_dhis_2,
)
from iaso.diffing import Differ, Dumper, Exporter


class Command(BaseCommand):
    help = "Diff and export a iaso pyramid in dhis2 instance"

    def add_arguments(self, parser):
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
            "--source_name_ref",
            type=str,
            help="The name of the source. It will be created if it doesn't exist",
        )
        parser.add_argument(
            "--version_number_ref",
            type=int,
            help="An integer version number for the new version",
        )

        parser.add_argument(
            "--export",
            action="store_true",
            help="really export to dhis2 or only dry run",
        )

        parser.add_argument(
            "--dhis2_url",
            type=str,
            help="Dhis2 url to import from (without user/password)",
        )
        parser.add_argument("--dhis2_user", type=str, help="dhis2 user name")
        parser.add_argument(
            "--dhis2_password", type=str, help="dhis2 password of the dhis2_user"
        )

    def get_api(self, options):
        from dhis2 import Api

        api = Api(
            options.get("dhis2_url"),
            options.get("dhis2_user"),
            options.get("dhis2_password"),
        )

        return api

    @transaction.atomic
    def handle(self, *args, **options):
        print("let's diff")
        iaso_logger = CommandLogger(self.stdout)
        self.iaso_logger = iaso_logger
        start = time.time()

        _source, version = self.load_version(options, "source_name", "version_number")
        _source_ref, version_ref = self.load_version(
            options, "source_name_ref", "version_number_ref"
        )
        iaso_logger.ok("================= Diffing =================")

        diffs, fields = Differ(iaso_logger).diff(version_ref, version, options)
        Dumper(iaso_logger).dump(diffs, fields)
        export = options.get("export")
        if export:
            iaso_logger.ok("================= Exporting =================")
            Exporter(self.iaso_logger).export_to_dhis2(self.get_api(options), diffs)
        else:
            iaso_logger.warn("not exporting, specify --export")
        end = time.time()
        iaso_logger.ok("processed in %.2f seconds" % (end - start))

    def load_version(self, options, source_name, version_number):
        source_name = options[source_name]
        version_number = options[version_number]
        print("loading ", source_name, version_number)
        source = DataSource.objects.get(name=source_name)
        try:
            version = SourceVersion.objects.get(
                number=version_number, data_source=source
            )
        except Exception as e:
            print(
                "available versions ",
                SourceVersion.objects.filter(data_source=source).values("number"),
            )
            raise e
        return (source, version)
