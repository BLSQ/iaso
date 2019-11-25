import time
import json

from django.core.management.base import BaseCommand
from django.db import transaction

from .command_logger import CommandLogger

from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Group, GroupSet


class ShapelyJsonEncoder(json.JSONEncoder):
    def __init__(self, **kwargs):
        super(ShapelyJsonEncoder, self).__init__(**kwargs)

    def default(self, obj):
        return obj.wkt


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

    @transaction.atomic
    def handle(self, *args, **options):
        print("let's diff")
        iaso_logger = CommandLogger(self.stdout)
        self.iaso_logger = iaso_logger
        start = time.time()

        source_name = options["source_name"]

        source = DataSource.objects.get(name=source_name)

        version_number = options.get("version_number")
        version = SourceVersion.objects.get(number=version_number, data_source=source)

        source_name_ref = options["source_name_ref"]
        source_ref = DataSource.objects.get(name=source_name_ref)

        version_number_ref = options.get("version_number_ref")
        version_ref = SourceVersion.objects.get(
            number=version_number_ref, data_source=source_ref
        )
        self.diff(version_ref, version)

        end = time.time()
        iaso_logger.ok("processed in %.2f seconds" % (end - start))

    def diff(self, version_ref, version):
        fields = ["name", "geometry"]
        orgunits_dhis2 = OrgUnit.objects.filter(version=version).all()
        orgunit_refs = OrgUnit.objects.filter(version=version_ref).all()
        print(
            "comparing ",
            version_ref,
            "(",
            len(orgunits_dhis2),
            ")",
            " and ",
            version,
            "(",
            len(orgunit_refs),
            ")",
        )
        # speed how to index_by(&:source_ref)
        diffs = []
        print("diff starting")
        for orgunit_ref in orgunit_refs:
            orgunit_dhis2_with_ref = [
                x for x in orgunits_dhis2 if x.source_ref == orgunit_ref.source_ref
            ]
            status = "same"
            orgunit_dhis2 = None

            if len(orgunit_dhis2_with_ref) > 0:
                orgunit_dhis2 = orgunit_dhis2_with_ref[0]
            else:
                status = "new"

            status, comparisons = self.compare_fields(
                status, orgunit_dhis2, orgunit_ref, fields
            )

            diff = {
                "ou": orgunit_dhis2.as_dict() if orgunit_dhis2 else None,
                "status": status,
                "comparisons": comparisons,
            }
            diffs.append(diff)

        self.dump(diffs, fields)

    def compare_fields(self, status, orgunit_dhis2, orgunit_ref, fields):
        print("will compare ", orgunit_ref, " vs ", orgunit_dhis2)

        comparisons = []

        for field in fields:
            dhis2_value = self.access_field(orgunit_dhis2, field)
            ref_value = self.access_field(orgunit_ref, field)

            same = self.is_same(dhis2_value, ref_value)

            diff_field = {
                "before": dhis2_value,
                "after": ref_value,
                "field": field,
                "status": "same" if same else "modified",
            }

            if not same:
                status = "modified"

            comparisons.append(diff_field)

        return (status, comparisons)

    def is_same(self, value, other_value):
        return value == other_value

    def access_field(self, org_unit, field):
        if org_unit is None:
            return None

        if field == "name":
            return org_unit.name

        if field == "geometry":
            if org_unit.location:
                return org_unit.location
            if org_unit.geom:
                return org_unit.geom
            if org_unit.simplified_geom:
                return org_unit.simplified_geom
            return None

        raise Exception("Unsupported field : '" + field + "'")

    def dump(self, diffs, fields):
        print(json.dumps(diffs, indent=4, cls=ShapelyJsonEncoder))

        display = []
        header = [None, "ou status"]
        for field in fields:
            header.append(field)

        display.append(header)
        for diff in diffs:
            results = [diff["ou"]["name"] if diff["ou"] else None, diff["status"]]

            for field in fields:
                comparison = list(
                    filter(lambda x: x["field"] == field, diff["comparisons"])
                )[0]
                results.append(comparison["status"])

            display.append(results)

        for d in display:
            print("\t".join(map(lambda s: str(s).ljust(20, " "), d)))
