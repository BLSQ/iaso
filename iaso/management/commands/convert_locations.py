from django.core.management.base import BaseCommand

from iaso.models import Instance, Form


class Command(BaseCommand):
    help = "Convert location in the form to field in the Form"

    def handle(self, *args, **options):
        forms = Form.objects.filter(location_field__isnull=False)

        for form in forms:
            instances = Instance.objects.filter(json__isnull=False).filter(form=form).filter(location__isnull=True)
            for instance in instances:
                try:
                    instance.convert_location_from_field(form.location_field)
                    print("converted!!!")
                except ValueError as error:
                    print(error)
