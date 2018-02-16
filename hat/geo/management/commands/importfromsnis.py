from django.core.management.base import BaseCommand
from hat.cases.models import Location
from hat.geo.models import Province, ZS, AS, Village

import csv


def clean(s):
    prefixes = ['hu', 'tn', 'll', 'nu', 'sn', 'hk', 'kn', 'kc', 'as', 'bu', 'kl', 'su', 'ke', 'tu', 'eq', 'nk', 'lm', 'mn', 'sk', 'kr', 'hl', 'Kr', 'tp', 'mg', 'it', 'md', 'kg', 'ks']
    to_delete = [' Aire de Santé', " Zone de Santé", " Province"]
    for x in to_delete:
        s = s.replace(x, '')
    for prefix in prefixes:
        s = s.replace(prefix + ' ', '')
    return s.strip()


class Command(BaseCommand):
    help = 'Import new villages from the case_location table into normalized tables'

    def handle(self, *args, **options):
        f = open('pyramid.csv')
        outputf = open('snis.csv', 'wt')
        writer = csv.writer(outputf)

        reader = csv.reader(f)
        for row in reader:
            area = clean(row[0])
            zone = clean(row[1])
            province = clean(row[2])
            writer.writerow([area, zone, province])
            print("-------")
            print(area)
            print(zone)
            print(province)

            #
            # province, province_created = Province.objects.get_or_create(name=province)
            # if province_created:
            #     print("province %s created" % province)
            #
            # health_zone, health_zone_created = ZS.objects.get_or_create(name=zone, province=province)
            # if health_zone_created:
            #     print("---- ZS %s created" % zone)
            #
            # health_area, health_area_created = AS.objects.get_or_create(name=area, ZS=health_zone)
            # if health_area_created:
            #     print("-------- AS %s created" % area)

