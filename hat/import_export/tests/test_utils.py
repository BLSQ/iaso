from django.test import TestCase
import pandas
from .. import utils


class UtilsTests(TestCase):
    def test_capitalize(self):
        self.assertEqual(utils.capitalize(None), None)
        self.assertEqual(utils.capitalize('foo bar'), 'Foo Bar')

    def test_tz_localize_cd(self):
        s = pandas.Series(['2011/11/01', '2012/12/01', '2013/01/01'])
        r = utils.tz_localize_cd(s)
        self.assertRegex(str(r.dtype), r'datetime.+Africa/Kinshasa')

    def test_create_documentid(self):
        df = pandas.DataFrame({
            'prename': [11, 11, 11],
            'lastname': [12, 12, None]
        })
        self.assertEqual(
            utils.create_documentid(df.loc[0]), utils.create_documentid(df.loc[1]))
        self.assertNotEqual(
            utils.create_documentid(df.loc[0]), utils.create_documentid(df.loc[2]))
