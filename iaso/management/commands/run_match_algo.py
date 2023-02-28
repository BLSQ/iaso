import importlib

from django.core.management.base import BaseCommand

from iaso.models import DataSource, SourceVersion


class Command(BaseCommand):
    help = "Run an algorithm to create links between org unit pyramids"

    def add_arguments(self, parser):
        parser.add_argument("algo_name", type=str)
        parser.add_argument("source_1", type=str)
        parser.add_argument("version_1", type=int)
        parser.add_argument("source_2", type=str)
        parser.add_argument("version_2", type=int)

    def handle(self, *args, **options):
        source_1 = DataSource.objects.get(name=options["source_1"])
        version_1 = SourceVersion.objects.get(number=options["version_1"], data_source=source_1)
        source_2 = DataSource.objects.get(name=options["source_2"])
        version_2 = SourceVersion.objects.get(number=options["version_2"], data_source=source_2)
        algo_module = importlib.import_module("iaso.matching." + options["algo_name"])
        algo = algo_module.Algorithm()
        algo.match(version_1, version_2)
