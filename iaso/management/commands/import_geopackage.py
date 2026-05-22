from argparse import ArgumentParser

from django.core.management.base import BaseCommand

from iaso.gpkg.import_gpkg import import_gpkg_file


class Command(BaseCommand):
    help = """Import a complete OrgUnit tree from a geopackage.
    
    Assume all orgunit here are to be created, not updated and the hierarchy is self sufficient.
    The DataSource must already be configured with at least one project."""

    def add_arguments(self, parser: ArgumentParser):
        parser.add_argument("--filename", type=str)
        parser.add_argument("--source_name", type=str, required=True)

        parser.add_argument("--version_number", type=int, required=True)
        parser.add_argument("--validation_status", type=str, default="NEW")
        parser.add_argument("--description", type=str, default="")

    def handle(self, filename, source_name, version_number, validation_status, description, **options):
        import_gpkg_file(filename, source_name, version_number, validation_status, description)
