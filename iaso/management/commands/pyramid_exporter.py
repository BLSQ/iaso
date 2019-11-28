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
from iaso.diffing import Differ, Dumper


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
        print("================= Diffing =================")

        diffs, fields = Differ(iaso_logger).diff(version_ref, version, options)
        Dumper(iaso_logger).dump(diffs, fields)
        export = options.get("export")
        if export:
            print("================= Exporting =================")
            self.export_to_dhis2(self.get_api(options), diffs)

        end = time.time()
        iaso_logger.ok("processed in %.2f seconds" % (end - start))

    def export_to_dhis2(self, api, diffs):

        to_create_diffs = list(filter(lambda x: x.status == "new", diffs))

        # ideally should run on diff
        # assign source_ref for orgunits to avoid double creation
        for to_create in to_create_diffs:
            if to_create.org_unit.source_ref is None:
                to_create.org_unit.source_ref = generate_id_for_dhis_2()
                to_create.org_unit.save()

        for to_create in to_create_diffs:
            to_create.org_unit.refresh_from_db()

        def by_path(ou):
            path = ou.path()
            return path if path else "z/Z/z/z/z/z/Z/"

        # make sure we create new parent first
        to_create_diffs = sorted(to_create_diffs, key=lambda d: by_path(d.org_unit))

        # build the payloads
        for to_create in to_create_diffs:
            name_comparison = to_create.comparison("name")

            print("----", name_comparison.after, to_create.org_unit.path())
            #       contactPerson, imgUrl,
            # email: components[1],
            payload = {
                "id": to_create.org_unit.source_ref,
                "name": name_comparison.after,
                "shortName": name_comparison.after,
                "openingDate": "1960-08-03T00:00:00.000",
            }

            if to_create.org_unit.parent:
                payload["parent"] = {"id": to_create.org_unit.parent.source_ref}

            geometry_comparison = to_create.comparison("geometry")
            if geometry_comparison.after:
                point_or_shape = GEOSGeometry(geometry_comparison.after)
                geometry = json.loads(point_or_shape.geojson)
                # if dhis2 >= 2.32
                payload["geometry"] = geometry
                # if dhis2 < 2.32
                payload["coordinates"] = geometry["coordinates"]
                payload["featureType"] = self.to_dhis2_feature_type(geometry["type"])

            print("will post ", payload)
            api.post("organisationUnits", payload)

    def to_dhis2_feature_type(self, type):
        # TODO better way : to snake case upper case ?
        if type == "Point":
            return "POINT"

        if type == "Polygon":
            return "POLYGON"

        if type == "MultiPolygon":
            return "MULTI_POLYGON"

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
