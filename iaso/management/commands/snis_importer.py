from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Group
from django.contrib.gis.geos import Point
import sys
import json

from django.contrib.gis.geos import Polygon

csv.field_size_limit(sys.maxsize)


class Command(BaseCommand):
    help = "Import a complete pyramid from a csv file"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str)
        parser.add_argument("org_unit_type_csv_file", type=str)
        parser.add_argument("source_name", type=str)
        parser.add_argument("version", type=int)

    @staticmethod
    def get_group(name, group_dict, source_version):

        group = group_dict.get(name, None)
        if group is None:
            group, created = Group.objects.get_or_create(
                name=name, source_version=source_version
            )
            print("group, created", group, created)
            group_dict[name] = group

        return group

    def handle(self, *args, **options):
        file_name = options.get("csv_file")
        org_unit_file_name = options.get("org_unit_type_csv_file")
        source_name = options.get("source_name")
        version_number = options.get("version")

        source, created = DataSource.objects.get_or_create(name=source_name)
        version, created = SourceVersion.objects.get_or_create(
            number=version_number, data_source=source
        )
        if not created:
            version.delete()
            version, created = SourceVersion.objects.get_or_create(
                number=version_number, data_source=source
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
        unknown_unit_type, created = OrgUnitType.objects.get_or_create(name="Inconnu")
        print("unknown_unit_type", unknown_unit_type)
        group_dict = {}
        with open(file_name) as csvfile:
            csv_reader = csv.reader(csvfile)
            index = 1
            unit_dict = dict()
            for row in csv_reader:
                if index == 1:
                    index += 1  # ignoring header
                else:
                    # try:
                    # "id", "name", "coordinates", "featureType", "parent", "groups"

                    org_unit = OrgUnit()
                    group_names = [x.strip() for x in row[5].split(",")]
                    for group_name in group_names:
                        if group_name in type_dict:
                            org_unit.org_unit_type = type_dict[group_name]
                            print("TYPE FOUND", group_name)
                            break
                    if org_unit.org_unit_type is None:
                        org_unit.org_unit_type = unknown_unit_type

                    org_unit.name = row[1].strip()
                    # org_unit.aliases = obj.aliases
                    org_unit.sub_source = source_name
                    org_unit.version = version
                    org_unit.source_ref = row[0].strip()
                    org_unit.validated = False
                    parent = row[4]
                    if parent:
                        org_unit.parent = unit_dict.get(parent)
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

                    for group_name in group_names:

                        group = self.get_group(group_name, group_dict, version)
                        group.org_units.add(org_unit)

                    unit_dict[org_unit.source_ref] = org_unit
                    index += 1
                # except Exception as e:
                #     print("Error %s for row %d" % (e, index), row)
                #     break
