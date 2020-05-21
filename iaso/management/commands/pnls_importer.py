from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Group
from django.contrib.gis.geos import Point
import sys
import io

csv.field_size_limit(sys.maxsize)


def insert_in(dictionary, name, code, source_name, version, unit_type=18, parent=None):
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
    help = "Import the org units of pnls"

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
            "-f",
            "--force",
            action="store_true",
            help="Will force the deletion of the existing data for this version before storing the content of the CSV",
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
        # ,fosa,data_juin_2018,data_septembre_2018,province,zone,start,lat,long
        # 0,boyambi,700.0,780.0,kinshasa,barumbu,2018-11-26T14:34:28.628+01,-4.308933,15.3172768

        province_unit_type, created = OrgUnitType.objects.get_or_create(name="Province")
        zs_unit_type, created = OrgUnitType.objects.get_or_create(name="Zone de santé")
        hs_type, created = OrgUnitType.objects.get_or_create(name="Centre de Santé")

        province_dict = {}
        zone_dict = {}
        with io.open(file_name, "r", encoding="utf-8-sig") as csvfile:
            # print(csvfile)
            csv_reader = csv.reader(csvfile, delimiter=",")
            index = 1

            for row in csv_reader:

                if index == 1:
                    ioc = {row[i].strip(): i for i in range(0, len(row))}
                    print(ioc)
                else:
                    fosa = row[ioc["fosa"]]
                    province = row[ioc["province"]]
                    zone = row[ioc["zone"]]
                    start = row[ioc["start"]]
                    latitude = row[ioc["lat"]]
                    longitude = row[ioc["long"]]

                    # print("code_region", code_region)
                    # print("region", region)
                    # print("code_depart", code_depart)
                    # print("department", department)
                    # print("code_com", code_com)
                    # print("commune", commune)
                    p = None
                    z = None

                    if province:
                        p = insert_in(
                            province_dict,
                            province,
                            province,
                            source_name,
                            version,
                            province_unit_type.id,
                        )
                    if zone:
                        z = insert_in(
                            zone_dict,
                            zone,
                            province + zone,
                            source_name,
                            version,
                            zs_unit_type.id,
                            p,
                        )

                    unit = OrgUnit()
                    unit.org_unit_type_id = hs_type.id
                    unit.name = fosa

                    if longitude and latitude:
                        print(
                            "longitude",
                            longitude,
                            type(longitude),
                            "latitude",
                            latitude,
                            type(latitude),
                        )
                        pnt = Point(float(longitude), float(latitude))
                        unit.location = pnt

                    unit.sub_source = source_name
                    unit.version = version
                    unit.sub_source = "pnls"
                    unit.validated = False
                    unit.parent = z
                    unit.save()

                index = index + 1
                if index % 100 == 0:
                    print("Treated: ", index)
