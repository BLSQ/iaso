from django.core.management.base import BaseCommand
from hat.vector.models import Site
import csv
from datetime import datetime


class Command(BaseCommand):
    help = 'Import traps from csv'

    def handle(self, *args, **options):
        f = open('hat/vector/data/traps/Traps-Table 1.csv', 'rt')

        traps = csv.reader(f, delimiter=';')
        count = 0
        for line in traps:
            print(line)
            if count != 0:
                site = Site()
                site.id = line[0]
                site.zone = line[1]
                site.latitude = line[3].replace(',', '.')
                site.longitude = line[4].replace(',', '.')
                site.habitat = line[5]
                site.first_survey = line[6]
                site.first_survey_date = datetime.strptime(line[7], '%m/%d/%y')
                site.count = line[8]
                site.total = line[9]
                site.save()
            count += 1






