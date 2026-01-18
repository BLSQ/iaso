import os
import re

from django.core.management import CommandError
from django.core.management.templates import TemplateCommand
from django.utils.text import slugify


class Command(TemplateCommand):
    help = "Creates a new IASO plugin inside the plugins/ directory. This command adds the skeleton for both backend and frontend."

    def handle(self, **options):
        # Preparing plugin name
        name = options.pop("name")
        self.stdout.write(self.style.NOTICE(f"Trying to create plugin: {name}"))
        self.validate_plugin_name(name)

        # Preparing plugin directory and making sure it does not already exist
        directory = f"plugins/{name}"
        self.stdout.write(self.style.NOTICE(f"Trying to create directory: {directory}"))
        os.makedirs(directory)

        # Add here any other custom options (e.g. variables to be replaced in the template)
        options.update(
            {
                "template": "plugins/template/",
            }
        )

        self.stdout.write(self.style.NOTICE("Loading the plugin template into the new directory..."))
        # Equivalent of calling python manage.py startapp with --template
        super().handle("app", name, directory, **options)

        self.stdout.write(self.style.SUCCESS(f"The {directory} plugin was successfully created!"))
        self.stdout.write(
            self.style.NOTICE(
                "Your plugin name was automatically added in some files, "
                'but some manual steps are still required: check for "***" inside your plugin to '
                "know where you will need to edit the code."
            )
        )

    def validate_plugin_name(self, raw_name: str):
        text = slugify(raw_name, allow_unicode=False)
        text = re.sub(r"[^a-z_]", "", text)[:30]
        text = text.strip("_")

        if raw_name != text:
            raise CommandError(
                f"Invalid plugin name: {raw_name} - it should be max 30 chars and only contain a-z_ characters (sanitized name: {text})"
            )
