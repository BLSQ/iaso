from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from iaso.models import Project


class Command(BaseCommand):
    help = 'Flag all instances for the provided project as "deleted"'

    def add_arguments(self, parser):
        parser.add_argument("project_id", help="The project for which instances ought to be deleted")
        parser.add_argument(
            "--force",
            action="store_true",
            default=False,
            help="Without this flag, the command simply indicates the forms and number of instances that "
            "would be affected by the command",
        )

    def handle(self, *args, **options):
        try:
            project = Project.objects.get(id=options["project_id"])
        except Project.DoesNotExist:
            raise CommandError(f"Project with id {options['project_id']} does not exist")

        self.stdout.write(f"Deleting all instances from the {project.name} project")

        forms = project.forms
        instances = project.instance_set.exclude(deleted=True)
        instance_count = instances.count()

        if not options["force"]:
            form_names = [f.name for f in forms.all()]

            self.stdout.write("Called without --force - no instance will be deleted")
            self.stdout.write(f"If called with --force, would delete {instance_count} instances")
            self.stdout.write(f"Forms in the {project.name} project are:")

            for form_name in form_names:
                self.stdout.write(f" - {form_name}")

            return

        with transaction.atomic():
            for instance in instances.all():
                instance.soft_delete()

        self.stdout.write(self.style.SUCCESS(f"Successfully deleted {instance_count} instances"))
