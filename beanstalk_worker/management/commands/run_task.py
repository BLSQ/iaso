import json

from django.core.management.base import BaseCommand

from beanstalk_worker import task_service
from iaso.models.task import Task


class Command(BaseCommand):
    help = "Run a task or cron job"

    def add_arguments(self, parser):
        parser.add_argument("module", type=str)
        parser.add_argument("method", type=str)
        parser.add_argument("account_id", type=int)
        parser.add_argument("arguments", nargs="?", default="[]", type=json.loads)
        parser.add_argument("kw_arguments", nargs="?", default="{}", type=json.loads)

    def handle(self, *args, module, method, account_id, arguments, kw_arguments, **options):
        t = Task()
        t.account_id = account_id
        t.save()
        task_service.run(module, method, t.id, arguments, kw_arguments)
