from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand

from scripts.translations.utils import find_translation_files, get_translation_command_args


class Command(BaseCommand):
    help = "Make translations with standard ignore patterns"

    def handle(self, *args, **options):
        cmd_args = get_translation_command_args() + [
            "--locale=fr",
            "--extension=txt",
            "--extension=py",
            "--extension=html",
        ]

        # Run makemessages once with all paths
        call_command("makemessages", *cmd_args)

        # Find and report on .po files
        project_root = Path.cwd()
        po_files = find_translation_files(project_root, "django.po")

        self.stdout.write("\nTranslation files processed:")
        for po_file in po_files:
            relative_path = po_file.relative_to(project_root)
            self.stdout.write(f"  {self.style.SUCCESS('✓')} {self.style.WARNING(str(relative_path))}")

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully processed {len(po_files)} translation files"))
