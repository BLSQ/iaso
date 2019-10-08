from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion
from django.contrib.gis.geos import Point
import sys
import json
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.geos import Polygon

csv.field_size_limit(sys.maxsize)


class Command(BaseCommand):
    help = "Import a complete pyramid from a csv file"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)
        parser.add_argument("org_unit_type_csv_file", type=str)
        parser.add_argument("source_name", type=str)
        parser.add_argument("version", type=int)

    def handle(self, *args, **options):
        file_name = options.get("csv_file")
        org_unit_file_name = options.get("org_unit_type_csv_file")
        source_name = options.get("source_name")
        version = options.get("version")

        source, created = DataSource.objects.get_or_create(name=source_name)
        version, created = SourceVersion.objects.get_or_create(
            number=version, data_source=source
        )

        # OrgUnit.objects.filter(source=source_name).delete()  # warning: dangerous
        type_dict = dict()
        with open(org_unit_file_name, encoding="utf-8") as csvfile:
            csv_reader = csv.reader(csvfile)
            for row in csv_reader:
                print(row)
                iaso_id, csv_name, parent_csv_name = row
                print("iaso_id", iaso_id)
                type_dict[csv_name] = OrgUnitType.objects.get(pk=iaso_id)
        unknownUnitType = OrgUnitType.objects.get(name="Inconnu")
        type_dict[""] = unknownUnitType
        with open(file_name) as csvfile:
            csv_reader = csv.reader(csvfile)
            index = 1
            unit_dict = dict()
            for row in csv_reader:
                if index == 1:
                    index += 1  # ignoring header
                else:
                    try:
                        # "id", "name", "coordinates", "featureType", "parent", "groups"

                        org_unit = OrgUnit()
                        snis_first_group = row[5].split(",")[0]
                        print("snis_first_group", snis_first_group)
                        org_unit.org_unit_type = type_dict[snis_first_group]
                        org_unit.name = row[1].strip()
                        # org_unit.aliases = obj.aliases
                        org_unit.sub_source = source_name
                        org_unit.version = version
                        org_unit.source_ref = row[0].strip()
                        org_unit.validated = False
                        parent = row[4]
                        if parent:
                            print("parent", parent)
                            org_unit.parent = unit_dict.get(parent)
                            print(org_unit.parent)
                        coordinates = row[2]
                        feature_type = row[3]

                        if feature_type == "POINT" and coordinates:
                            tuple = json.loads(coordinates)
                            pnt = Point(tuple[0], tuple[1])
                            org_unit.location = pnt
                            org_unit.longitude = pnt.x
                            org_unit.latitude = pnt.y

                        if feature_type == "MULTI_POLYGON" and coordinates:
                            j = json.loads(coordinates)
                            p = Polygon(j[0][0])
                            org_unit.simplified_geom = p

                        org_unit.save()
                        unit_dict[org_unit.source_ref] = org_unit
                        index += 1
                    except Exception as e:
                        print("Error %s for row %d" % (e, index), row)
                        break
