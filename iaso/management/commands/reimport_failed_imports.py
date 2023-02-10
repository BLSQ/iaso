from django.core.management.base import BaseCommand

from hat.vector_control.models import APIImport
from iaso.api.instances import import_data as import_instances
from iaso.api.org_units import import_data as import_units


class Command(BaseCommand):
    help = "reimport failed orgunit imports"

    def handle(self, *args, **options):
        failed_org_units_imports = APIImport.objects.filter(has_problem=True).filter(import_type="orgUnit")
        unit_count = 0
        for i in failed_org_units_imports:
            try:
                import_units(i.json_body, i.user, i)
                i.has_problem = False
                i.save()
                unit_count = unit_count + 1
            except Exception as e:
                print("An error happened", e)

        failed_instance_imports = APIImport.objects.filter(has_problem=True).filter(import_type="instance")
        instance_count = 0
        for i in failed_instance_imports:
            try:
                import_instances(i.json_body, i)
                i.has_problem = False
                i.save()
                instance_count = instance_count + 1
            except Exception as e:
                print("An error happened", e)

        print("Imported: units", unit_count, "instances", instance_count)
