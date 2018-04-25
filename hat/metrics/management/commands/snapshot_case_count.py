from django.core.management.base import BaseCommand
from hat.cases.models import Case
from hat.metrics.models import Metric, DataPoint


class Command(BaseCommand):
    help = 'Count the number of  lines of case_case'

    def handle(self, *args, **options):
        count = Case.objects.count()

        metric, created = Metric.objects.get_or_create(name="Cases_case count",
                                              description="Number of records in the database",
                                              abbreviation="casecount")

        d = DataPoint()
        d.value = count
        d.metric = metric
        d.save()

