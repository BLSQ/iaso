import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Compile the Django template SCSS (index.scss) into index.css using libsass."

    def handle(self, *args, **options):
        try:
            import sass
        except ImportError as exc:  # pragma: no cover - runtime dependency issue
            raise CommandError(
                "The 'sass' (libsass) package is required to compile SCSS. Install requirements.txt first."
            ) from exc

        input_path = os.path.join(settings.BASE_DIR, "iaso", "static", "css", "index.scss")
        output_path = os.path.join(settings.BASE_DIR, "iaso", "static", "css", "index.css")

        if not os.path.exists(input_path):
            raise CommandError(f"SCSS source not found at {input_path}")

        css = sass.compile(filename=input_path, output_style="compressed")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(css)

        self.stdout.write(self.style.SUCCESS(f"Compiled {input_path} -> {output_path}"))
