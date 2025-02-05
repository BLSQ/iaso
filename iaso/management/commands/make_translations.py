import os
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand

from scripts.translation_config import IGNORE_ARGS


class Command(BaseCommand):
    help = "Make translations with standard ignore patterns"

    def handle(self, *args, **options):
        # Add explicit ignore patterns for virtual environments
        cmd_args = [
            "--locale=fr",
            "--extension=txt",
            "--extension=py",
            "--extension=html",
            "--verbosity=0",  # Suppress default output
            "--ignore=venv",  # Explicitly ignore venv directory
            "--ignore=.venv",  # Explicitly ignore .venv directory
        ] + IGNORE_ARGS

        # Ensure we're in the project root
        project_root = Path(os.getcwd())

        call_command("makemessages", *cmd_args)

        # Find and report on .po files
        po_files = [f for f in project_root.glob("**/django.po") if "venv" not in str(f) and ".venv" not in str(f)]

        self.stdout.write("\nTranslation files processed:")
        for po_file in po_files:
            relative_path = po_file.relative_to(project_root)
            self.stdout.write(f"  {self.style.SUCCESS('✓')} {self.style.WARNING(str(relative_path))}")

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully processed {len(po_files)} translation files"))
