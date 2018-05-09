from django.db.models import Case
from django.test import TestCase
from pandas import DataFrame

from hat.cases.models import Case
from hat.import_export.load import create_cases, update_cases


class TestLoad(TestCase):
    fixtures = ['users', 'devices']

    def test_create_cases(self):
        data_dict = {
            'document_date': ['2018-04-19T08:57:46.696Z'],
            'device_id': ['6c3a222b-78ca-462b-9590-e4c64c3fcfff'],
            'entry_date': ['2018-04-19T08:57:44.284Z'],
            'json_document_id': [1],
            'name': ['Un'],
            'lastname': ['Un'],
            'prename': ['Un'],
            'sex': ['male'],
            'year_of_birth': [None],
            'mothers_surname': ['Une'],
            'ZS': ['Bokoro'],
            'AS': ['Kempimpi'],
            'village': ['Wangile'],
            'test_rdt': ['1'],
            'test_rdt_session_type': ['onTheSpot'],
            'source': ['mobile_sync'],
            'hat_id': ['UNUNUNMU'],
            'document_id': ['8c33a22be290b956acab90c6d8c93814'],
            'version_number': ['0'],
        }
        dataframe = DataFrame.from_dict(data_dict)

        create_cases(dataframe)

        cases = Case.objects.filter(document_id='8c33a22be290b956acab90c6d8c93814')
        self.assertEqual(cases.count(), 1)
        case = cases[0]
        self.assertEqual(case.hat_id, 'UNUNUNMU')
        self.assertEqual(case.test_rdt, 1)

    def test_update_cases_existing(self):
        self.test_create_cases()

        data_dict = {
            'document_date': ['2018-04-19T08:57:46.696Z'],
            'device_id': ['6c3a222b-78ca-462b-9590-e4c64c3fcfff'],
            'entry_date': ['2018-04-19T08:57:44.284Z'],
            'json_document_id': [1],
            'name': ['Deux'],
            'lastname': ['Deux'],
            'prename': ['Deux'],
            'sex': ['male'],
            'year_of_birth': [None],
            'mothers_surname': ['Une'],
            'ZS': ['Bokoro'],
            'AS': ['Kempimpi'],
            'village': ['Wangile'],
            'test_rdt': ['1'],
            'test_rdt_session_type': ['onTheSpot'],
            'source': ['mobile_sync'],
            'hat_id': ['DEDEDEMU'],
            'document_id': ['8c33a22be290b956acab90c6d8c93814'],
            'version_number': ['0'],
        }
        dataframe = DataFrame.from_dict(data_dict)

        update_cases(dataframe)

        cases = Case.objects.filter(document_id='8c33a22be290b956acab90c6d8c93814')
        self.assertEqual(cases.count(), 1)
        case = cases[0]
        self.assertEqual(case.hat_id, 'DEDEDEMU')
        self.assertEqual(case.test_rdt, 1)
