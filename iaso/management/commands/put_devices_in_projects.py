from django.core.management.base import BaseCommand

from iaso.models import Instance


class Command(BaseCommand):
    help = "Based on the instance, associate devices with projects"

    def handle(self, *args, **options):
        instances = Instance.objects.filter(device__isnull=False)
        for instance in instances:
            instance.device.projects.add(instance.project)
