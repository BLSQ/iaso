from django.test import TestCase
import pandas
from .. import utils


class UtilsTests(TestCase):
    def test_hat_id(self):
        r1 = pandas.Series({
            'lastname': 'Foo',
            'name': 'Bar',
            'prename': 'Baz',
            'sex': 'Male',
            'year_of_birth': '1999',
            'mothers_surname': 'Mo',
        })
        self.assertEqual(utils.hat_id(r1), 'FOBABAM1999M')

        r2 = pandas.Series({})
        self.assertEqual(utils.hat_id(r2), 'XXXXXXXXXXXX')

        r3 = pandas.Series({
            'lastname': 'ÀZ',
            'name': 'ÈÉÊ',
            'prename': 'ÛZ',
            'mothers_surname': 'M'
        })
        self.assertEqual(utils.hat_id(r3), 'AZEEUZXXXXXM')

    def test_capitalize(self):
        self.assertEqual(utils.capitalize(None), None)
        self.assertEqual(utils.capitalize('foo bar'), 'Foo Bar')

    def test_create_documentid(self):
        df = pandas.DataFrame({
            'prename': [11, 11, 11],
            'lastname': [12, 12, None]
        })
        self.assertEqual(
            utils.create_documentid(df.loc[0]), utils.create_documentid(df.loc[1]))
        self.assertNotEqual(
            utils.create_documentid(df.loc[0]), utils.create_documentid(df.loc[2]))
