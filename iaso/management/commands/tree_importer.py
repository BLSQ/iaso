from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion
from django.contrib.gis.geos import Point
from uuid import uuid4
from django.db import models, transaction


def get_or_create(unit_dict, name, org_unit_type, parent_id, version_id, longitude, latitude, source_ref, save=True):
    org_unit = unit_dict.get(name, None)
    if org_unit is None:
        org_unit = OrgUnit()
        org_unit.org_unit_type = org_unit_type
        org_unit.name = name.strip()
        org_unit.version_id = version_id
        org_unit.source_ref = source_ref
        org_unit.validated = False

        org_unit.parent_id = parent_id

        if longitude and latitude:
            longitude = float(longitude)
            latitude = float(latitude)
            org_unit.location = Point(x=longitude, y=latitude, z=0, srid=4326)

        if save:
            org_unit.save(skip_calculate_path=True)
        #print("save")

        unit_dict[name] = org_unit
    return org_unit

column_dict = {
    "name": "Nom Ecole",
    "parents": ["Sproved", "Proved", "Territoire", "Groupement", "Commune"],
    "longitude": "GPS_longitude",
    "latitude": "GPS_latitude",
    "source_ref": "Numero SECOPE",
}


class Command(BaseCommand):
    help = "Import a complete tree from a csv file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--org_unit_csv_file", type=str
        )
        parser.add_argument(
            "--source_name", type=str
        )
        parser.add_argument(
            "--version_number", type=int
        )
        parser.add_argument(
            "--project", type=int
        )
        #parser.add_argument("project", type=str)

    def handle(self, *args, **options):
        with transaction.atomic():
            print("handling")
            file_name = options.get("org_unit_csv_file")
            source_name = options.get("source_name")
            version = options.get("version_number")
            project = options.get("project")
            uuid = str(uuid4())
            print("import uuid", uuid)
            source, created = DataSource.objects.get_or_create(name=source_name)
            source.projects.add(project)
            version, created = SourceVersion.objects.get_or_create(number=version, data_source=source)
            print("version, created", version, created)
            org_unit_dicts = {}
            previous_outs = []
            main_out, created = OrgUnitType.objects.get_or_create(name="%s-%s" % ("main", uuid), short_name="main")
            for parent in column_dict["parents"]:
                out, created = OrgUnitType.objects.get_or_create(name="%s-%s" % (parent, uuid), short_name=parent)

                out.projects.add(project)

                if previous_outs:
                    for p in previous_outs:
                        p.sub_unit_types.add(out)
                        p.sub_unit_types.add(main_out)
                previous_outs.append(out)
                d = {"type": out, "units": {}}

                org_unit_dicts[parent] = d
            print(org_unit_dicts)

            main_out.projects.add(project)
            units = []
            with open(file_name) as csvfile:
                csv_reader = csv.reader(csvfile, delimiter=";")
                index = 1
                for row in csv_reader:
                    if index == 1:
                        index = index + 1
                        headers = row
                        col_indices = {headers[i]:i for  i in range(len(headers))}
                    else:
                        try:
                            previous_parent = None
                            for parent in column_dict["parents"]:
                                type = org_unit_dicts[parent]["type"]
                                name = row[col_indices[parent]]
                                previous_parent = get_or_create(org_unit_dicts[parent]["units"], name, type, previous_parent.id if previous_parent else None, version.id, None, None, None)
                            name = row[col_indices[column_dict["name"]]]
                            source_ref = row[col_indices[column_dict["source_ref"]]]
                            latitude = row[col_indices[column_dict["latitude"]]]
                            longitude = row[col_indices[column_dict["longitude"]]]
                            #print("previous_parent", previous_parent)
                            unit = get_or_create({}, name, out, previous_parent.id, version.id, longitude, latitude, source_ref, save=False)
                            units.append(unit)
                            index += 1
                        except Exception as e:
                            print("Error %s for row %d" % (e, index), row)
                            break
            OrgUnit.objects.bulk_create(units)
            print("org_unit_dicts", org_unit_dicts)
            print("last_school")