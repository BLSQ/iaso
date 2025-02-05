from django.core.management import call_command
from django.core.management.base import BaseCommand

from scripts.translation_config import IGNORE_ARGS


class Command(BaseCommand):
    help = "Make translations with standard ignore patterns"

    def handle(self, *args, **options):
        cmd_args = [
            "--locale=fr",
            "--extension=txt",
            "--extension=py",
            "--extension=html",
        ] + IGNORE_ARGS

        call_command("makemessages", *cmd_args)
        self.stdout.write(self.style.SUCCESS("Successfully generated translation files"))
