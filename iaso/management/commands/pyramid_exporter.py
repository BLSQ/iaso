import time
import json

from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.gis.geos import Point

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

        _source, version = self.load_version(options, "source_name", "version_number")
        _source_ref, version_ref = self.load_version(
            options, "source_name_ref", "version_number_ref"
        )

        diffs, fields = self.diff(version_ref, version)
        self.dump(diffs, fields)

        end = time.time()
        iaso_logger.ok("processed in %.2f seconds" % (end - start))

    def load_version(self, options, source_name, version_number):
        source_name = options[source_name]
        source = DataSource.objects.get(name=source_name)

        version_number = options.get(version_number)
        version = SourceVersion.objects.get(number=version_number, data_source=source)
        return (source, version)

    def diff(self, version_ref, version):
        fields = ["name", "geometry", "parent"]
        for group_set in GroupSet.objects.filter(source_version=version):
            fields.append("groupset:" + group_set.source_ref + ":" + group_set.name)

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

            comparisons = self.compare_fields(orgunit_dhis2, orgunit_ref, fields)
            some_modified = any(
                filter(lambda comp: comp["status"] != "same", comparisons)
            )
            if status != "new" and some_modified:
                status = "modified"

            diff = {
                "ou": orgunit_dhis2.as_dict()
                if orgunit_dhis2
                else orgunit_ref.as_dict(),
                "status": status,
                "comparisons": comparisons,
            }
            diffs.append(diff)

        return (diffs, fields)

    def compare_fields(self, orgunit_dhis2, orgunit_ref, fields):
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
                "distance": 0
                if same
                else self.distance_field(dhis2_value, ref_value, field, same),
            }

            comparisons.append(diff_field)

        return comparisons

    def distance_field(self, dhis2_value, ref_value, field, same):
        if isinstance(dhis2_value, Point) and isinstance(ref_value, Point):
            return dhis2_value.distance(ref_value) * 100  # approx km
        return None

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

        if field == "parent":
            if org_unit.parent:
                return org_unit.parent.source_ref
            return None

        if field.startswith("groupset:"):
            groupset_ref = field.split(":")[1]
            groups = []
            for group in org_unit.group_set.all():
                for groupset in group.groupset_set.all():
                    if groupset.source_ref == groupset_ref:
                        groups.append({"id": group.source_ref, "name": group.name})

            return groups

        raise Exception("Unsupported field : '" + field + "'")

    def dump(self, diffs, fields):
        print(json.dumps(diffs, indent=4, cls=ShapelyJsonEncoder))

        display = []
        header = ["dhis2Id", "name", "ou status"]
        for field in fields:
            header.append(field)

        display.append(header)
        for diff in diffs:
            results = [diff["ou"]["source_ref"], diff["ou"]["name"], diff["status"]]

            for field in fields:
                comparison = list(
                    filter(lambda x: x["field"] == field, diff["comparisons"])
                )[0]
                results.append(comparison["status"])

            display.append(results)

        for d in display:
            message = "\t".join(map(lambda s: str(s).ljust(20, " "), d))
            if d[2] == "new":
                self.iaso_logger.info(
                    self.iaso_logger.colorize(message, CommandLogger.GREEN)
                )
            elif d[2] == "modified":
                self.iaso_logger.info(
                    self.iaso_logger.colorize(message, CommandLogger.RED)
                )
            else:
                self.iaso_logger.info(message)
