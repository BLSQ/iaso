from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Group
from django.contrib.gis.geos import Point
import sys
import io
from django.db import connection
from django.contrib.gis.geos import GEOSGeometry

csv.field_size_limit(sys.maxsize)


def insert_in(dictionary, code, name, source_name, version, unit_type=18, parent=None):
    r = dictionary.get(code, None)
    if not r:
        unit = OrgUnit()
        unit.org_unit_type_id = unit_type
        unit.name = name
        unit.sub_source = source_name
        unit.version = version
        unit.source_ref = code
        unit.validated = False
        unit.parent = parent
        unit.save()
        dictionary[code] = unit
        r = unit
    return r


class Command(BaseCommand):
    help = "Import the org units of renaloc"

    def add_arguments(self, parser):
        parser.add_argument(
            "source_name",
            type=str,
            help="The name of the source. It will be created if it doesn't exist",
        )
        parser.add_argument(
            "version", type=int, help="An integer version number for the new version"
        )
        parser.add_argument(
            "-f", "--force", action="store_true", help="Define a username prefix"
        )

    def handle(self, *args, **options):

        source_name = options.get("source_name")
        version_number = options.get("version")
        force = options.get("force")

        source, created = DataSource.objects.get_or_create(name=source_name)
        version, created = SourceVersion.objects.get_or_create(
            number=version_number, data_source=source
        )

        version_count = OrgUnit.objects.filter(version=version).count()
        if version_count > 0 and not force:
            print(
                "This is going to delete %d org units records. If you want to proceed, add the -f option to the command"
                % version_count
            )
            return
        else:
            OrgUnit.objects.filter(version=version).delete()
            print(("%d org units records deleted" % version_count).upper())
        # "CodeRegion;Region;CodeDepart;Departement;CodeCom;Commune"

        region_unit_type, created = OrgUnitType.objects.get_or_create(name="Région")
        department_unit_type, created = OrgUnitType.objects.get_or_create(
            name="Département"
        )
        commune_unit_type, created = OrgUnitType.objects.get_or_create(name="Commune")

        region_dict = {}
        depart_dict = {}

        index = 0
        with connection.cursor() as cursor:
            cursor.execute("select * from ner_adm03_feb2018;")
            for row in cursor.fetchall():
                print("row", row)
                code_region = row[7]
                region = row[4]
                code_depart = row[8]
                department = row[5]
                code_com = row[6]
                commune = row[9]
                shape = row[14]

                print("code_region", code_region)
                print("region", region)
                print("code_depart", code_depart)
                print("department", department)
                print("code_com", code_com)
                print("commune", commune)
                print("shape")
                r = None
                d = None

                if code_region:
                    r = insert_in(
                        region_dict,
                        code_region,
                        region,
                        source_name,
                        version,
                        region_unit_type.id,
                    )
                if code_depart:
                    d = insert_in(
                        depart_dict,
                        code_region + code_depart,
                        department,
                        source_name,
                        version,
                        department_unit_type.id,
                        r,
                    )

                # print("region_dict", region_dict)
                # print("depart_dict", depart_dict)
                # print("comm_dict", comm_dict)

                unit = OrgUnit()
                unit.org_unit_type_id = commune_unit_type.id
                unit.name = commune
                mp = GEOSGeometry(shape)
                # print(GEOSGeometry(shape))
                print(type(mp[0]), mp[0])
                unit.geom = mp[0]
                unit.simplified_geom = mp[0]
                unit.sub_source = source_name
                unit.version = version
                unit.source_ref = code_com
                unit.sub_source = "commune"
                unit.validated = False
                unit.parent = d
                unit.save()
                print("SAVED SAVED SAVED SAVED SAVED SAVED ", unit.geom)

                index = index + 1
                if index % 100 == 0:
                    print("Treated: ", index)
