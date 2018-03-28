from django.core.management.base import BaseCommand
from hat.vector.models import Target
import csv
from datetime import datetime


class Command(BaseCommand):
    help = 'Import targets from csv'
    #ID;NAME;Deployment;FullName;GPS;Lat;Long;Altitude;DateTimeS;Date;River
    #1;A0001;1;1A0001;A;-4,764186;17,914579;365,7;2015-07-27T08:12:43Z;7/27/15;Lukula

    def handle(self, *args, **options):
        f = open('hat/vector/data/targets/Targets_Aug_2017_Compiled-Table 1.csv', 'rt')

        targets = csv.reader(f, delimiter=';')
        count = 0
        for line in targets:
            print(line)
            if count != 0:
                target = Target()
                target.id = line[0]
                target.name = line[1]
                target.deployment = line[2]
                target.full_name = line[3]
                target.gps = line[4]
                target.latitude = line[5].replace(',', '.')
                target.longitude = line[6].replace(',', '.')
                target.altitude = line[7].replace(',', '.')
                target.date_time = line[8]
                target.river = line[10]
                target.save()
            count += 1






