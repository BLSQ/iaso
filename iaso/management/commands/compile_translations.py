from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand

from scripts.translations.config import IGNORE_ARGS


class Command(BaseCommand):
    help = "Compile translations for specific paths only"

    def handle(self, *args, **options):
        # Run compilemessages once with all paths
        call_command("compilemessages", *IGNORE_ARGS)
