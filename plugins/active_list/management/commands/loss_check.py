from argparse import ArgumentParser
from django.core.management.base import BaseCommand
from plugins.active_list.models import Patient
from logging import getLogger

logger = getLogger(__name__)

class Command(BaseCommand):
    help = """checks all the patients to see if they should be marked as lost and updates the patient status"""

    def add_arguments(self, parser: ArgumentParser):
        parser.add_argument("--name", type=str, required=False, help="Campaign obr name")

    def handle(self, name=None, *args, **options):
        active_patients = Patient.objects.filter(active=True)
        for patient in active_patients:
            patient.evaluate_loss(save=True)