from django.core.management.base import BaseCommand
from hat.vector_control.models import Site, HABITAT_CHOICES
import csv
from datetime import datetime
from django.contrib.gis.geos import Point

habitats = [x[0] for x in HABITAT_CHOICES]


class Command(BaseCommand):
    help = 'Import traps from csv'

    def handle(self, *args, **options):
        f = open('hat/vector_control/data/traps/Traps-Table 1.csv', 'rt')

        traps = csv.reader(f, delimiter=';')
        count = 0
        for line in traps:
            print(line)
            if count != 0:
                try:
                    site = Site()
                    site.name = line[0].strip()
                    # site.zone = line[1]
                    latitude = line[3].replace(',', '.')
                    longitude = line[4].replace(',', '.')
                    site.location = Point(x=float(longitude), y=float(latitude), z=0, srid=4326)
                    habitat = line[5].lower()
                    if habitat not in habitats:
                        habitat = 'unknown'
                    site.habitat = habitat
                    # site.first_survey = line[6]
                    site.created_at = datetime.strptime(line[7], '%m/%d/%y')
                    # site.count = line[8]
                    site.total = line[9]
                    site.save()
                except:
                    pass
            count += 1

