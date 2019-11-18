from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Group
from django.contrib.gis.geos import Point
import sys
import json

from django.contrib.gis.geos import Polygon

csv.field_size_limit(sys.maxsize)


class Command(BaseCommand):
    help = "Import a a dhis2 pyramid into iaso"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dhis2_url",  type=str, help="Dhis2 url to import from (without user/password)"
        )
        parser.add_argument(
            "--dhis2_user", type=str, help="dhis2 user name"
        )
        parser.add_argument(
            "--dhis2_password", type=str, help="dhis2 password of the dhis2_user"
        )

        parser.add_argument(
            "--org_unit_type_csv_file",
            type=str,
            help="Path to the org unit types csv file",
        )
        parser.add_argument(
            "--source_name",
            type=str,
            help="The name of the source. It will be created if it doesn't exist",
        )
        parser.add_argument(
            "--version_number", type=int, help="An integer version number for the new version"
        )
        parser.add_argument(
            "-f", "--force", action="store_true", help="Force the deletion of the pyramid snapshot prior importing"
        )

    @staticmethod
    def get_group(dhis2_group, group_dict, source_version):
        name = dhis2_group["name"]
        group = group_dict.get(name, None)
        if group is None:
            group, created = Group.objects.get_or_create(
                name=name,
                source_version=source_version,
                source_ref=dhis2_group["id"]
            )
            print("group, created", group, created)
            group_dict[name] = group

        return group

    @staticmethod
    def guess_feature_type(coordinates):
        if coordinates == None:
            return None
        if coordinates.startswith("[[[["):
            return "MULTI_POLYGON"
        if coordinates.startswith("[[["):
            return "POLYGON"
        if coordinates.startswith("["):
            return "POINT"
        return None

    def handle(self, *args, **options):

        from dhis2 import Api
        api = Api(options.get("dhis2_url"), options.get(
            "dhis2_user"), options.get("dhis2_password"))

        orgunits = []

        for page in api.get_paged(
            'organisationUnits',
            page_size=500,
            params={"fields": "id,name,path,coordinates,parent,organisationUnitGroups[id,name]"}
        ):
            orgunits.extend(page['organisationUnits'])
            print("fetched ", page["pager"]["page"], "/", page["pager"]
                  ["pageCount"], "(", len(orgunits), "/", page["pager"]["total"], "records)",)

        orgunits = sorted(orgunits, key=lambda ou: ou['path'])

        org_unit_type_file_name = options.get("org_unit_type_csv_file")
        source_name = options["source_name"]
        version_number = options.get("version_number")
        force = options.get("force")

        source, created = DataSource.objects.get_or_create(name=source_name)

        version, created = SourceVersion.objects.get_or_create(
            number=version_number, data_source=source
        )

        version_count = OrgUnit.objects.filter(version=version).count()
        print("Orgunits in db for source and version ", source, version, version_count)
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
        with open(org_unit_type_file_name, encoding="utf-8") as csvfile:
            csv_reader = csv.reader(csvfile)
            for row in csv_reader:
                iaso_id, csv_name, parent_csv_name = row
                type_dict[csv_name] = OrgUnitType.objects.get(pk=iaso_id)

        unknown_unit_type, created = OrgUnitType.objects.get_or_create(name="Inconnu")
        group_dict = {}
        unlinked_parentships = []

        index = 1
        unit_dict = dict()
        print(" about to create orgunits", len(orgunits))
        for row in orgunits:
            try:
                org_unit = OrgUnit()
                for group in row["organisationUnitGroups"]:
                    if group["name"] in type_dict:
                        org_unit.org_unit_type = type_dict[group_name]
                        break

                if org_unit.org_unit_type is None:
                    org_unit.org_unit_type = unknown_unit_type

                org_unit.name = row["name"].strip()
                # org_unit.aliases = obj.aliases
                org_unit.sub_source = source_name
                org_unit.version = version
                org_unit.source_ref = row["id"].strip()
                org_unit.validated = False
                parent = None
                if "parent" in row:
                    parent = row["parent"]["id"]

                if parent:
                    org_unit.parent = unit_dict.get(parent)
                    if not org_unit.parent:
                        unlinked_parentships.append(
                            (org_unit.source_ref, parent)
                        )
                if index % 100 == 0:
                    print("unmatched:", len(unlinked_parentships), "/", index)

                if ("coordinates" in row):
                    coordinates = row["coordinates"]
                    feature_type = self.guess_feature_type(row["coordinates"])

                    if feature_type == "POINT" and coordinates:
                        try:
                            tuple = json.loads(coordinates)
                            pnt = Point(float(tuple[0]), float(tuple[1]))
                            org_unit.location = pnt
                            org_unit.longitude = pnt.x
                            org_unit.latitude = pnt.y
                        except:
                            print("failed at importing POINT", coordinates)

                    if feature_type == "POLYGON" and coordinates:
                        j = json.loads(coordinates)
                        org_unit.simplified_geom = Polygon(j[0][0])

                    if feature_type == "MULTI_POLYGON" and coordinates:
                        j = json.loads(coordinates)
                        org_unit.simplified_geom = Polygon(j[0][0])

                org_unit.save()

                for ougroup in row["organisationUnitGroups"]:
                    group = self.get_group(ougroup, group_dict, version)
                    group.org_units.add(org_unit)

                unit_dict[org_unit.source_ref] = org_unit
            except Exception as e:
                print("Error %s for row %d" % (e, index), row)
                raise e
            index += 1

        print("created orgunits", index)

        # we need to do this because we cannot be sure that parents are after their children in the imported file
        # now we can be sure (sort by path) but let's keep it like that
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
