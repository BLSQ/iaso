from django.core.management.base import BaseCommand
from hat.vector_control.models import Trap, HABITAT_CHOICES
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
                    trap = Trap()
                    trap.name = line[0].strip()
                    latitude = line[3].replace(',', '.')
                    longitude = line[4].replace(',', '.')
                    trap.location = Point(x=float(longitude), y=float(latitude), z=0, srid=4326)
                    habitat = line[5].lower()
                    if habitat not in habitats:
                        habitat = 'unknown'
                    trap.habitat = habitat

                    trap.created_at = datetime.strptime(line[7], '%m/%d/%y')
                    trap.total = line[9]
                    trap.save()
                except:
                    pass
            count += 1

