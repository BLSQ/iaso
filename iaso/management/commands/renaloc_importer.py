from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Group
from django.contrib.gis.geos import Point
import sys
import json
import io
from django.contrib.gis.geos import Polygon

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
        parser.add_argument("csv_file", type=str, help="Path to the org units csv file")
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
        file_name = options.get("csv_file")
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
        localite_unit_type, created = OrgUnitType.objects.get_or_create(name="Localité")
        region_dict = {}
        depart_dict = {}
        comm_dict = {}
        with io.open(file_name, "r", encoding="utf-8-sig") as csvfile:
            # print(csvfile)
            csv_reader = csv.reader(csvfile, delimiter=";")
            index = 1

            for row in csv_reader:

                if index == 1:
                    print(row)
                    ioc = {row[i].strip(): i for i in range(0, len(row))}
                    print(ioc)

                else:
                    longitude = None
                    latitude = None

                    code_region = row[ioc["CodeRegion"]]
                    region = row[ioc["Region"]]
                    code_depart = row[ioc["CodeDepart"]]
                    department = row[ioc["Departement"]]
                    code_com = row[ioc["CodeCom"]]
                    commune = row[ioc["Commune"]]

                    # print("code_region", code_region)
                    # print("region", region)
                    # print("code_depart", code_depart)
                    # print("department", department)
                    # print("code_com", code_com)
                    # print("commune", commune)
                    r = None
                    d = None
                    c = None

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
                    if code_com:
                        c = insert_in(
                            comm_dict,
                            code_region + code_depart + code_com,
                            commune,
                            source_name,
                            version,
                            commune_unit_type.id,
                            d,
                        )
                    # print("region_dict", region_dict)
                    # print("depart_dict", depart_dict)
                    # print("comm_dict", comm_dict)
                    try:
                        lo_f_min = row[ioc["LONGFRACTMINUTE"]]
                        lo_min = row[ioc["LONGMINUTE"]]
                        lo_deg = row[ioc["LONGDEGRE"]]

                        longitude = (
                            int(lo_deg) + int(lo_min) / 60 + int(lo_f_min) / 3600
                        )

                        la_f_min = row[ioc["LATFRACTMINUTE"]]
                        la_min = row[ioc["LATMINUTE"]]
                        la_deg = row[ioc["LATDEGRE"]]

                        latitude = int(la_deg) + int(la_min) / 60 + int(la_f_min) / 3600

                        # print(longitude, latitude)
                    except:
                        pass
                        # print("failed at converting", row)

                    name = row[ioc["NomLocalite"]]

                    unit = OrgUnit()
                    unit.org_unit_type_id = localite_unit_type.id
                    unit.name = name

                    if longitude and latitude:
                        pnt = Point(longitude, latitude)
                        unit.location = pnt
                        unit.longitude = pnt.x
                        unit.latitude = pnt.y

                    unit.sub_source = source_name
                    unit.version = version
                    unit.source_ref = row[ioc["CodeLocalite"]]
                    unit.sub_source = "renaloc"
                    unit.validated = False
                    unit.parent = c
                    unit.save()

                index = index + 1
                if index % 100 == 0:
                    print("Treated: ", index)
