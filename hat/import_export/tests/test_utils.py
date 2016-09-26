from django.test import TestCase
import pandas
from .. import utils


class UtilsTests(TestCase):
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
