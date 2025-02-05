from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand

from scripts.translations.utils import find_translation_files, get_translation_command_args


class Command(BaseCommand):
    help = "Compile translations for specific paths only"

    def handle(self, *args, **options):
        cmd_args = get_translation_command_args()

        # Run compilemessages once with all paths
        call_command("compilemessages", *cmd_args)

        # Find and report on .mo files
        project_root = Path.cwd()
        mo_files = find_translation_files(project_root, "django.mo")

        self.stdout.write("\nTranslation files compiled:")
        for mo_file in mo_files:
            relative_path = mo_file.relative_to(project_root)
            self.stdout.write(f"  {self.style.SUCCESS('✓')} {self.style.WARNING(str(relative_path))}")

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully compiled {len(mo_files)} translation files"))
