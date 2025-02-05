import os
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import BaseCommand

from scripts.translation_config import TRANSLATION_PATHS


class Command(BaseCommand):
    help = "Make translations with standard ignore patterns"

    def handle(self, *args, **options):
        cmd_args = [
            "--locale=fr",
            "--extension=txt",
            "--extension=py",
            "--extension=html",
            "--verbosity=0",  # Suppress default output
            # Ignore everything except our translation paths
            "--ignore=*",
        ]

        # Add explicit ignore exceptions for our translation paths
        for path in TRANSLATION_PATHS:
            cmd_args.append(f"--ignore=!{path}/*")

        # Run makemessages once with all paths
        call_command("makemessages", *cmd_args)

        # Find and report on .po files
        project_root = Path.cwd()
        po_files = []
        for base_path in TRANSLATION_PATHS:
            base_dir = project_root / base_path
            if base_path == "plugins":
                # For plugins, look in each plugin's locale directory
                for plugin_dir in base_dir.glob("*"):
                    if plugin_dir.is_dir():
                        po_files.extend(plugin_dir.glob("**/django.po"))
            else:
                # For hat and iaso, look in their locale directories
                po_files.extend(base_dir.glob("**/django.po"))

        self.stdout.write("\nTranslation files processed:")
        for po_file in po_files:
            relative_path = po_file.relative_to(project_root)
            self.stdout.write(f"  {self.style.SUCCESS('✓')} {self.style.WARNING(str(relative_path))}")

        self.stdout.write(self.style.SUCCESS(f"\nSuccessfully processed {len(po_files)} translation files"))
