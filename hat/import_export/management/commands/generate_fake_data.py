import tempfile
import string
import random
import datetime
from collections import OrderedDict
from uuid import uuid4
from django.core.management.base import BaseCommand
from django.conf import settings
from hat.common.utils import run_cmd

'''
This command generates fake sql data for locations and cases.
It does this by creating a temporary sql file with the commands
to create the data and feeds that file to the `psql` executable.
This is way faster than creating those records via djangos orm.
'''

vowels = ['a', 'e', 'i', 'o', 'u']
consonants = [a for a in string.ascii_lowercase if a not in vowels]


def randstr(length):
    return ''.join([random.choice(vowels) if x % 2 == 0 else random.choice(consonants)
                    for x in range(length)])


def randdate(start, end):
    return start + datetime.timedelta(
        seconds=random.randint(0, int((end - start).total_seconds())))


def add_locations(file, num):
    # Some geo rect in DRC
    topleft = (3.485321, 19.083252)
    bottomright = (-6.365117, 28.443604)

    pop_min = 1
    pop_max = 10000

    zones = [randstr(random.randint(7, 11)) for _ in range(25)]
    areas = [randstr(random.randint(7, 11)) for _ in range(100)]
    locations = []

    file.write(
        """COPY cases_location ("""
        """"ZS", "AS", village, village_official, latitude, longitude, population"""
        """) FROM stdin;\n"""
    )

    for _ in range(num):
        l = OrderedDict([
            ('ZS', random.choice(zones)),
            ('AS', random.choice(areas)),
            ('village', randstr(random.randint(7, 11))),
            ('village_official', random.choice(['YES', 'NO', 'OTHER', 'NA'])),
            ('latitude', str(random.uniform(topleft[0], bottomright[0]))),
            ('longitude', str(random.uniform(topleft[1], bottomright[1]))),
            ('population', str(random.randint(pop_min, pop_max))),
            ('village_official', random.choice(['YES', 'NO', 'OTHER']))
        ])
        locations.append(l)
        file.write('\t'.join(l.values()) + '\n')

    file.write('\\.\n')
    return locations


def add_cases(file, num, locations):
    # Daterange for the cases is from 52 weeks ago until today
    today = datetime.datetime.today()
    backthen = today - datetime.timedelta(weeks=52)

    file.write(
        """COPY cases_case ("""
        """hat_id, source, document_date, document_id,"""
        """name, lastname, prename, sex, year_of_birth, mothers_surname,"""
        """village, "ZS", "AZ","""
        """test_catt, test_maect, test_pl_result, latitude, longitude"""
        """) FROM stdin;\n"""
    )

    for i in range(num):
        location = random.choice(locations)
        c = [
            'XXXX',  # hat_id
            random.choice(['historic', 'mobile_backup', 'pv']),  # source
            randdate(backthen, today).isoformat(),  # document_date
            str(uuid4()),  # document_id
            randstr(random.randint(7, 11)),  # name
            randstr(random.randint(7, 11)),  # lastname
            randstr(random.randint(7, 11)),  # prename
            random.choice(['female', 'male']),  # sex
            str(random.randint(1933, 2016)),  # year_of_birth
            randstr(random.randint(7, 11)),  # mothers_surname
            location['village'],  # village
            location['ZS'],  # ZS
            location['AS'],  # AZ
            random.choice(['t', 'f', '\\N']),  # test_catt
            random.choice(['t', 'f', '\\N']),  # test_maect
            random.choice(['stage1', 'stage2', 'unknown', '\\N']),  # test_pl_result
            location['latitude'],  # latitude
            location['longitude'],  # longitude
        ]
        # All fields for a record go on one line with values tab seperated
        file.write('\t'.join(c) + '\n')

    file.write('\\.\n')


class Command(BaseCommand):
    help = 'Generate fake data in postgres'

    def add_arguments(self, parser):
        parser.add_argument('num_locations', type=int,
                            help='Number of locations to generate')
        parser.add_argument('num_cases', type=int,
                            help='Number of cases to generate')

    def handle(self, *args, **options):
        num_locations = options['num_locations']
        num_cases = options['num_cases']

        with tempfile.TemporaryFile('w') as temp_file:
            self.stdout.write('creating locations...')
            locations = add_locations(temp_file, num_locations)

            self.stdout.write('creating cases...')
            add_cases(temp_file, num_cases, locations)

            self.stdout.write('inserting data...')
            temp_file.seek(0)
            r = run_cmd(['psql',
                         '-v', 'ON_ERROR_STOP=1',
                         '-h', settings.DB_HOST,
                         '-p', str(settings.DB_PORT),
                         '-U', settings.DB_USERNAME,
                         '-d', settings.DB_NAME],
                        stdin=temp_file,
                        env={'PGPASSWORD': settings.DB_PASSWORD or ''})
            self.stdout.write(r)
            self.stdout.write('done.')
