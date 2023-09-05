import csv

from django.core.management.base import BaseCommand

from iaso.models import OrgUnit


class Command(BaseCommand):
    help = "Export to org_units.csv"

    def handle(self, *args, **options):
        org_units = OrgUnit.objects.filter(custom=False)
        org_unit_sample = org_units[0]
        keys = org_unit_sample.as_dict_for_csv().keys()

        with open("org_units.csv", mode="w") as csv_file:
            writer = csv.DictWriter(csv_file, fieldnames=keys)

            writer.writeheader()

            for org_unit in org_units:
                writer.writerow(org_unit.as_dict_for_csv())
