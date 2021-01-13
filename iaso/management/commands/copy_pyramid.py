from django.core.management.base import BaseCommand
from ...tasks.copy_pyramid import copy_pyramid


class Command(BaseCommand):
    help = """Copy a complete pyramid. After usage, there will be a full copy, just 
              with a different version. Both pyramids will be totally unlinked.
    """

    def add_arguments(self, parser):
        parser.add_argument("--source_source_name", type=str)
        parser.add_argument("--source_version", type=int)
        parser.add_argument("--destination_source_name", type=str)
        parser.add_argument("--destination_version", type=int)
        parser.add_argument(
            "-f", "--force", action="store_true", help="Will proceed to delete destination version if it already exists"
        )

    def handle(self, *args, **options):
        source_source_name = options.get("source_source_name")
        source_version_number = options.get("source_version")
        destination_source_name = options.get("destination_source_name")
        destination_version_number = options.get("destination_version")
        force = options.get("force")
        copy_pyramid(
            source_source_name, source_version_number, destination_source_name, destination_version_number, force
        )
