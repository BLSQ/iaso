import csv

from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand

from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion


class Command(BaseCommand):
    help = "Import a complete pyramid from a csv file"

    def add_arguments(self, parser):
        parser.add_argument("org_unit_csv_file", type=str)
        parser.add_argument("org_unit_type_csv_file", type=str)
        parser.add_argument("source_name", type=str)
        parser.add_argument("version", type=int)

    def handle(self, *args, **options):
        file_name = options.get("org_unit_csv_file")
        org_unit_type_file_name = options.get("org_unit_type_csv_file")
        source_name = options.get("source_name")
        version = options.get("version")

        source, created = DataSource.objects.get_or_create(name=source_name)
        version, created = SourceVersion.objects.get_or_create(number=version, data_source=source)

        OrgUnit.objects.filter(sub_source=source_name).delete()  # warning: dangerous
        type_dict = dict()
        with open(org_unit_type_file_name) as csvfile:
            csv_reader = csv.reader(csvfile)
            for row in csv_reader:
                print(row)
                iaso_id, csv_name, parent_csv_name = row
                print("iaso_id", iaso_id)
                type_dict[csv_name] = OrgUnitType.objects.get(pk=iaso_id)

        with open(file_name) as csvfile:
            csv_reader = csv.reader(csvfile)
            index = 1
            unit_dict = dict()
            root_org_units = []

            for row in csv_reader:
                try:
                    # 0,kwango,,,province,kemri,,,,
                    # km12728,wala ,28,,fosa,kemri,26.8827,3.51973,0
                    org_unit = OrgUnit()
                    org_unit.org_unit_type = type_dict[row[4]]
                    org_unit.name = row[1].strip()
                    # org_unit.aliases = obj.aliases
                    org_unit.sub_source = source_name
                    org_unit.version = version
                    org_unit.source_ref = row[0].strip()
                    org_unit.validated = False
                    parent = row[2]
                    if parent:
                        self.stdout.write(f"Attempting to find parent {parent}")
                        try:
                            org_unit.parent = unit_dict[parent]
                            self.stdout.write(f"Found {org_unit.parent}")
                        except KeyError:
                            self.stderr.write(
                                f"Could not find parent {parent} for org unit {org_unit.source_ref} - "
                                f"the org units might not be sorted in the correct order"
                            )
                            root_org_units.append(org_unit)
                    else:
                        root_org_units.append(org_unit)

                    longitude = row[6]
                    latitude = row[7]
                    if longitude and latitude:
                        longitude = float(longitude)
                        latitude = float(latitude)
                        org_unit.location = Point(x=longitude, y=latitude, z=0, srid=4326)
                    org_unit.save(skip_calculate_path=True)
                    unit_dict[org_unit.source_ref] = org_unit
                    index += 1
                except Exception as e:
                    print("Error %s for row %d" % (e, index), row)
                    break

            for unit in root_org_units:
                self.stdout.write(f"Setting path for the hierarchy starting with org unit {unit.name}")
                unit.save(update_fields=["path"])
