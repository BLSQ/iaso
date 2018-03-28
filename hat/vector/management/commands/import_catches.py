from django.core.management.base import BaseCommand
from hat.vector.models import Catch, Site
import csv
from datetime import datetime

date_format =  '%m/%d/%y'


def c(s):
    if s.strip() == '':
        return None
    return s


class Command(BaseCommand):
    help = 'Import catches from csv'

    def handle(self, *args, **options):
        f = open('hat/vector/data/traps/Catches-Table 1.csv', 'rt')

        traps = csv.reader(f, delimiter=';')
        count = 0
        for line in traps:
            #print(line)
            if count != 0:
                try:
                    site = Site.objects.get(id=line[0])
                except:
                    print("site not found", line[0])
                    site = None

                if site:
                    catch = Catch()
                    catch.operation = line[1]
                    catch.setup_date = datetime.strptime(line[2], date_format)
                    catch.collect_date = datetime.strptime(line[3], date_format)
                    catch.in_out = line[4]
                    catch.male_count = c(line[5])
                    catch.female_count = c(line[6])
                    catch.unknown_count = c(line[7])
                    catch.remarks = line[8]
                    distance_s = None

                    if line[9] and line[9]!='':
                        distance_s = line[9].replace(',', '.')
                    else:
                        distance_s = 0

                    catch.distance_to_targets = c(distance_s)
                    catch.near_intervention = line[10]
                    catch.elev_change = c(line[11])
                    catch.trap_elev = c(line[12])
                    catch.target_elev = c(line[13])
                    catch.elev_diff = c(line[13])
                    catch.site = site
                    catch.save()
            count += 1


