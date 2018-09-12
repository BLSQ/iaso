import gc

from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.import_export.load import normalize_location
from hat.patient.models import Test


def queryset_iterator(queryset, chunksize=1000):
    """''
    Iterate over a Django Queryset ordered by the primary key

    This method loads a maximum of chunksize (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.

    Note that the implementation of the iterator does not support ordered query sets.
    """
    pk = 0
    last_pk = queryset.order_by('-pk')[0].pk
    queryset = queryset.order_by('pk')
    while pk < last_pk:
        for row in queryset.filter(pk__gt=pk)[:chunksize]:
            pk = row.pk
            yield row
        gc.collect()


class Command(BaseCommand):
    help = 'Take all villages created on the tablets and either link them or create the villages'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verbose',
            action='store_true',
            dest='verbose',
            help='Be verbose about what it is doing',
        )

        parser.add_argument(
            '--dry-run',
            action='store_true',
            dest='dry-run',
            help='Go through the process but don\'t actually save the normalized village',
        )

    def handle(self, *args, **options):
        cases = Case.objects.filter(
            normalized_village__isnull=True,
            village__isnull=False,
            AS__isnull=False,
            ZS__isnull=False,
            AS__regex=r'^[0-9]+$',
            ZS__regex=r'^[0-9]+$',
        ).exclude(
            village__regex=r'^[0-9]+$'
        )
        if not cases:
            print("No case with a village candidate available")
            return
        success_count = 0
        count = 0
        for case in queryset_iterator(cases):
            count += 1
            if count % 1000 == 0:
                print("Cases treated: ", count)

            normalize_location(case)

            if case.normalized_village is not None:
                if options['dry-run']:
                    print("Dry-run: would have updated case id", case.id, "to village", case.normalized_village.id)
                else:
                    case.save()

                    # Now update the Test from that case
                    Test.objects.filter(form=case).update(village=case.normalized_village)
                success_count += 1
                print("+++++++ Village found for:", case.village)

        print("----------------------------------------")
        print("Cases matched with known villages:", success_count)
