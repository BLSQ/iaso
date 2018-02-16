from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.geo.models import Village
import gc


def queryset_iterator(queryset, chunksize=1000):
    '''''
    Iterate over a Django Queryset ordered by the primary key

    This method loads a maximum of chunksize (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.

    Note that the implementation of the iterator does not support ordered query sets.
    '''
    pk = 0
    last_pk = queryset.order_by('-pk')[0].pk
    queryset = queryset.order_by('pk')
    while pk < last_pk:
        for row in queryset.filter(pk__gt=pk)[:chunksize]:
            pk = row.pk
            yield row
        gc.collect()


class Command(BaseCommand):
    help = 'Try to link a case to a previously known village'

    def handle(self, *args, **options):
        cases = Case.objects.filter(normalized_village__isnull=True, village__isnull=False, AS__isnull=False,
                                    ZS__isnull=False, province__isnull=False)
        count = 0
        for case in queryset_iterator(cases):
            attempted_villages = list(Village.objects.filter(name__iexact=case.village.strip(),
                                                        AS__name__iexact=case.AS.strip(),
                                                        AS__ZS__name__iexact=case.ZS.strip()))

            if not attempted_villages:
                pass
            elif len(attempted_villages)>1:
                print("Multiple villages found", attempted_villages)
            else:
                print("Found a village!:", attempted_villages[0])
                case.normalized_village = attempted_villages[0]
                count = count + 1
                print(count)
                case.save()




