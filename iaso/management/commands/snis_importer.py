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
        parser.add_argument("csv_file", type=str, help="Path to the org units csv file")
        parser.add_argument(
            "org_unit_type_csv_file",
            type=str,
            help="Path to the org unit types csv file",
        )
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
        force = options.get("force")

        source, created = DataSource.objects.get_or_create(name=source_name)
        version, created = SourceVersion.objects.get_or_create(
            number=version_number, data_source=source
        )

        version_count = OrgUnit.objects.filter(version=version_number).count()
        if version_count > 0 and not force:
            print(
                "This is going to delete %d org units records. If you want to proceed, add the -f option to the command"
                % version_count
            )
            return
        else:
            OrgUnit.objects.filter(version=version).delete()
            print(("%d org units records deleted" % version_count).upper())

        type_dict = dict()
        with open(org_unit_file_name, encoding="utf-8") as csvfile:
            csv_reader = csv.reader(csvfile)
            for row in csv_reader:
                print(row)
                iaso_id, csv_name, parent_csv_name = row
                type_dict[csv_name] = OrgUnitType.objects.get(pk=iaso_id)

        unknown_unit_type, created = OrgUnitType.objects.get_or_create(name="Inconnu")
        group_dict = {}
        unlinked_parentships = []

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
                        group_names = [x.strip() for x in row[5].split(",")]
                        for group_name in group_names:
                            if group_name in type_dict:
                                org_unit.org_unit_type = type_dict[group_name]

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
                            if not org_unit.parent:
                                unlinked_parentships.append(
                                    (org_unit.source_ref, parent)
                                )
                                if index % 100 == 0:
                                    print(
                                        "unmatched:",
                                        len(unlinked_parentships),
                                        "/",
                                        index,
                                    )
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
                    except Exception as e:
                        print("Error %s for row %d" % (e, index), row)
                        break

            # we need to do this because we cannot be sure that parents are after their children in the imported file
            nr_to_link = len(unlinked_parentships)
            linked_count = 0
            for tuple in unlinked_parentships:
                child = OrgUnit.objects.get(source_ref=tuple[0], version=version)
                parent = OrgUnit.objects.get(source_ref=tuple[1], version=version)
                child.parent = parent
                child.save()
                linked_count = linked_count + 1
                if linked_count % 100 == 0:
                    print("matched:", linked_count, "/", nr_to_link)
