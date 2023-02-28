import logging
import time

logger = logging.getLogger(__name__)
from django.core.management.base import BaseCommand
from django.db import transaction
from .command_logger import CommandLogger

from iaso.models import DataSource, SourceVersion
from iaso.diffing import Differ, Dumper, Exporter


def get_option(options, key):
    val = options.get(key)
    if val is None:
        raise Exception("no value for parameter : --" + key)
    return val


class Command(BaseCommand):
    help = "Diff and export a iaso pyramid in dhis2 instance"

    def add_arguments(self, parser):
        parser.add_argument(
            "--source_name", type=str, help="The name of the source. It will be created if it doesn't exist"
        )
        parser.add_argument("--version_number", type=int, help="An integer version number for the new version")
        parser.add_argument("--validation_status", type=str, help="Validation status", required=False)
        parser.add_argument(
            "--source_name_ref", type=str, help="The name of the source. It will be created if it doesn't exist"
        )

        parser.add_argument("--version_number_ref", type=int, help="An integer version number for the new version")
        parser.add_argument("--validation_status_ref", type=str, help="Validation status ref", required=False)
        parser.add_argument("--top_org_unit_ref", type=int, help="Top org unit ref id", required=False)
        parser.add_argument("--top_org_unit", type=int, help="Top org unit id", required=False)
        parser.add_argument(
            "--org_unit_types", type=str, help="Org unit types ids, separated by a comma", required=False
        )
        parser.add_argument(
            "--org_unit_types_ref", type=str, help="Org unit types ids, separated by a comma, for ref", required=False
        )

        parser.add_argument("--export", action="store_true", help="really export to dhis2 or only dry run")
        parser.add_argument("--output_csv", type=str, help="A file to output the diff as csv")
        parser.add_argument("--ignore_groups", action="store_true", help="Don't modify groups on dhis2")

        parser.add_argument("--dhis2_url", type=str, help="Dhis2 url to export from (without user/password)")
        parser.add_argument("--dhis2_user", type=str, help="dhis2 user name")

        parser.add_argument("--dhis2_password", type=str, help="dhis2 password of the dhis2_user")

    def get_api(self, options):
        from dhis2 import Api

        api = Api(
            get_option(options, "dhis2_url"), get_option(options, "dhis2_user"), get_option(options, "dhis2_password")
        )

        return api

    @transaction.atomic
    def handle(self, *args, **options):
        logger.debug("let's diff")
        file_name = options.get("output_csv")
        validation_status = options.get("validation_status", None)
        validation_status_ref = options.get("validation_status_ref", None)
        top_org_unit = options.get("top_org_unit", None)
        top_org_unit_ref = options.get("top_org_unit_ref", None)
        org_unit_types = options.get("org_unit_types", None)
        org_unit_types_ref = options.get("org_unit_types_ref", None)
        iaso_logger = CommandLogger(self.stdout)
        self.iaso_logger = iaso_logger
        start = time.time()
        if org_unit_types:
            org_unit_types = [int(i) for i in org_unit_types.split(",")]
        if org_unit_types_ref:
            org_unit_types_ref = [int(i) for i in org_unit_types_ref.split(",")]
        _source, version = self.load_version(options, "source_name", "version_number")
        _source_ref, version_ref = self.load_version(options, "source_name_ref", "version_number_ref")
        iaso_logger.ok("================= Diffing =================")
        ignore_groups = options.get("ignore_groups")
        csv_export = file_name is not None
        diffs, fields = Differ(iaso_logger).diff(
            version_ref,
            version,
            ignore_groups,
            show_deleted_org_units=csv_export,
            validation_status=validation_status,
            validation_status_ref=validation_status_ref,
            top_org_unit=top_org_unit,
            top_org_unit_ref=top_org_unit_ref,
            org_unit_types=org_unit_types,
            org_unit_types_ref=org_unit_types_ref,
        )
        dumper = Dumper(iaso_logger)
        stats = dumper.dump_stats(diffs)
        if file_name:
            with open(file_name, "w") as csv_file:
                dumper.dump_as_csv(diffs, fields, csv_file)
        else:
            dumper.dump_as_table(diffs, fields, stats)

        export = options.get("export")

        if export:
            iaso_logger.ok("================= Exporting =================")
            Exporter(self.iaso_logger).export_to_dhis2(self.get_api(options), diffs, fields)
        else:
            iaso_logger.warn("not exporting, specify --export")
        end = time.time()
        iaso_logger.ok("processed in %.2f seconds" % (end - start))

    def load_version(self, options, param_source_name, param_version_number):
        source_name = options[param_source_name]
        version_number = options[param_version_number]
        self.iaso_logger.info("loading ", source_name, version_number)
        try:
            source = DataSource.objects.get(name=source_name)
        except Exception:
            message = " ".join(
                (
                    "--" + param_source_name,
                    " : No source '" + str(source_name) + "' but we have ",
                    ", ".join(DataSource.objects.values_list("name", flat=True)),
                )
            )
            self.iaso_logger.error(message)
            raise Exception(message)

        try:
            version = SourceVersion.objects.get(number=version_number, data_source=source)
        except Exception:
            message = " ".join(
                (
                    "--" + param_version_number,
                    " : No Version number '" + str(version_number) + "' but we have ",
                    ", ".join(
                        list(
                            map(
                                lambda x: str(x),
                                SourceVersion.objects.filter(data_source=source).values_list("number", flat=True),
                            )
                        )
                    ),
                    "for source_name",
                )
            )
            self.iaso_logger.error(message)
            raise Exception(message)
        return source, version
