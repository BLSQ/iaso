

from django.core.management.base import BaseCommand
from hat.cases.models import Case
from hat.metrics.models import Metric, DataPoint
from django.db.models import Q


class Command(BaseCommand):
    help = 'Count the number of  lines of case_case that have no matching village'

    def handle(self, *args, **options):
        cases = Case.objects.filter(normalized_village=None, confirmed_case=True)

        """
        Original query:

        "cases_case"."normalized_village_id" IS NULL AND
               "cases_case"."confirmed_case" = TRUE
               AND (province is null or province ilike '%bandu%' or province % 'bandundu'
        or province ilike '%kwilu%' or province % 'kwilu'
        or province ilike '%kwango%' or province % 'kwango'
        or province ilike '%ndomb%' or province % 'mai-ndombe'))
        and village is not null and lower(village) <> 'inconnu'
        """
        f = Q(province=None) | Q(province__icontains='bandu') |Q(province__trigram_similar='bandundu') \
            | Q(province__icontains='kwilu') | Q(province__trigram_similar='kwilu') \
            | Q(province__icontains='kwango') | Q(province__trigram_similar='kwango') \
            | Q(province__icontains='ndomb') | Q(province__trigram_similar='mai-ndombe')

        e = Q(village__isnull=True) | Q(village__iexact='inconnu')

        count = cases.filter(f).exclude(e).count()

        metric, created = Metric.objects.get_or_create(name="Unmatched record count",
                                              description="Number of records in the database where no village has been found in the UCLA village list",
                                              abbreviation="unmatch")

        d = DataPoint()
        d.value = count
        d.metric = metric
        d.save()

