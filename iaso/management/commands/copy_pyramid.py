from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion
from django.contrib.gis.geos import Point


class Command(BaseCommand):
    help = "Import a complete pyramid from a csv file"

    def add_arguments(self, parser):
        parser.add_argument("source_source_name", type=str)
        parser.add_argument("source_version", type=int)
        parser.add_argument("destination_source_name", type=str)
        parser.add_argument("destination_version", type=int)
        parser.add_argument(
            "-f", "--force", action="store_true", help="Define a username prefix"
        )

    def handle(self, *args, **options):
        source_source_name = options.get("source_source_name")
        source_version_number = options.get("source_version")
        destination_source_name = options.get("destination_source_name")
        destination_version_number = options.get("destination_version")
        force = options.get("force")

        source_source = DataSource.objects.get(name=source_source_name)
        source_version = SourceVersion.objects.get(
            number=source_version_number, data_source=source_source
        )
        print("source_version", source_version)

        destination_source, created = DataSource.objects.get_or_create(
            name=destination_source_name
        )
        destination_version, created = SourceVersion.objects.get_or_create(
            number=destination_version_number, data_source=destination_source
        )

        version_count = OrgUnit.objects.filter(version=destination_version).count()
        if version_count > 0 and not force:
            print(
                "This is going to delete %d org units records. If you want to proceed, add the -f option to the command"
                % version_count
            )
            return
        else:
            OrgUnit.objects.filter(version=destination_version).delete()
            print(("%d org units records deleted" % version_count).upper())

        source_units = OrgUnit.objects.filter(version=source_version)

        old_new_dict = {}
        new_units = []
        index = 0
        for unit in source_units:
            old_id = unit.id
            unit.id = None
            unit.save()
            unit.version = destination_version
            new_units.append(unit)
            old_new_dict[old_id] = unit.id
            index = index + 1
            if index % 100 == 0:
                print("Copied:", index)

        index = 0
        for unit in new_units:
            if unit.parent_id:
                unit.parent_id = old_new_dict[unit.parent_id]
                unit.save()
            index = index + 1
            if index % 100 == 0:
                print("Parent fixed:", index)
