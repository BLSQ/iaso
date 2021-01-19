import json

from django.core.management.base import BaseCommand

from beanstalk_worker import task_service


class Command(BaseCommand):
    help = "Run a task or cron job"

    def add_arguments(self, parser):
        parser.add_argument("module", type=str)
        parser.add_argument("method", type=str)
        parser.add_argument("arguments", nargs="?", default="[]", type=json.loads)
        parser.add_argument("kw_arguments", nargs="?", default="{}", type=json.loads)

    def handle(self, *args, module, method, arguments, kw_arguments, **options):
        task_service.run(module, method, arguments, kw_arguments)
