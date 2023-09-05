from django.core.management.base import BaseCommand

from iaso.models import Instance


class Command(BaseCommand):
    help = "Convert location in the form to field in the Form"

    def handle(self, *args, **options):
        instances = Instance.objects.filter(json__isnull=False).filter(device__isnull=True)
        for instance in instances:
            try:
                instance.convert_device()
                print("converted!!!")
            except ValueError as error:
                print(error)
