from django.core.management.base import BaseCommand

from hat.cases.models import Case
from hat.geo.models import Village


class Command(BaseCommand):
    help = 'Try to link a case to a previously known village'

    def handle(self, *args, **options):
        cases = Case.objects.filter(normalized_village__isnull=True, village__isnull=False, AS__isnull=False,
                                    ZS__isnull=False, province__isnull=False)
        count = 0
        for case in cases:
            attempted_villages = list(Village.objects.filter(name__iexact=case.village.strip(),
                                                        AS__name__iexact=case.AS.strip(),
                                                        AS__ZS__name__iexact=case.ZS.strip(),
                                                        AS__ZS__province__name__iexact=case.province.strip()))

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




