from django.core.management.base import BaseCommand

from hat.metrics.models import Metric, DataPoint
from hat.patient.models import PatientDuplicatesPair, PatientIgnoredPair


class Command(BaseCommand):
    help = 'Count the number of patient duplicates and ignored pairs'

    def handle(self, *args, **options):
        all_dupes_count = PatientDuplicatesPair.objects.count()
        namesim_dupes_count = PatientDuplicatesPair.objects.filter(algorithm='namesim').count()
        ignores_count = PatientIgnoredPair.objects.count()

        alldupes_metric, _ = Metric.objects.get_or_create(
            name="Patient duplicates all",
            description="Number of potential dupes for all algorithms",
            abbreviation="alldupescount")
        DataPoint(value=all_dupes_count, metric=alldupes_metric).save()

        namesimdupes_metric, _ = Metric.objects.get_or_create \
            (name="Patient duplicates namesim",
             description="Number of potential dupes for namesim algorithm",
             abbreviation="namesimdupescount")
        DataPoint(value=namesim_dupes_count, metric=namesimdupes_metric).save()

        ignores_metric, _ = Metric.objects.get_or_create(
            name="Patient duplicates ignore count",
            description="Number of ignored duplicate pairs",
            abbreviation="ignorescount")
        DataPoint(value=ignores_count, metric=ignores_metric).save()
