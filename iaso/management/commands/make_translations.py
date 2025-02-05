from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand

from scripts.translations.utils import find_translation_files


class Command(BaseCommand):
    help = "Make translations"

    def handle(self, *args, **options):
        cmd_args = [
            "--locale=fr",
            "--extension=txt",
            "--extension=py",
            "--extension=html",
            "--ignore=.venv",
            "--ignore=venv",
            "--ignore=cypress",
            "--ignore=node_modules",
            "--ignore=beanstalk_worker",
            "--ignore=django_sql_dashboard_export",
            "--ignore=locust",
            "--ignore=notebooks",
            "--ignore=setuper",
            "--ignore=scripts",
        ]

        # Run makemessages once with all paths
        try:
            call_command("makemessages", *cmd_args)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Warning: {str(e)}"))
            self.stdout.write("Continuing despite error...")

        # Find and report on .po files
        project_root = Path.cwd()
        po_files = find_translation_files(project_root, "django.po")

        self.stdout.write("\nTranslation files processed:")
        for po_file in po_files:
            relative_path = po_file.relative_to(project_root)
            self.stdout.write(f"  {self.style.SUCCESS('✓')} {self.style.WARNING(str(relative_path))}")

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully processed {len(po_files)} translation files"))
