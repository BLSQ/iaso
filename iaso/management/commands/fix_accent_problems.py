from django.core.management.base import BaseCommand
import csv
from iaso.models import OrgUnit, OrgUnitType, DataSource, SourceVersion, Form
from django.contrib.gis.geos import Point


class Command(BaseCommand):
    help = "Fixing a bug that causes files with accents not to be linked with the corresponding instance created through the api"

    def handle(self, *args, **options):
        problematic_form = Form.objects.get(id=10)
