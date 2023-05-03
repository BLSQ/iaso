from logging import getLogger

from django.core.management.base import BaseCommand

from beanstalk_worker import task_service
from iaso.models import Task

logger = getLogger(__name__)


class Command(BaseCommand):
    help = """Rerun last task whatever it's status was, FOR DEBUG"""

    def handle(self, *args, **kwargs):
        # see `Worker connection` in services.py
        last_task = Task.objects.latest("id")
        last_task.status = "QUEUED"
        last_task.save()

        task_service.run_all()
        return
