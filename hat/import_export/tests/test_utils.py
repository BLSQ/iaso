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

    def test_hash_df_row(self):
        df = pandas.DataFrame({
            'a': [11, 11, 11],
            'b': [12, 12, 13]
        })
        self.assertEqual(
            utils.hash_df_row(df.loc[0]), utils.hash_df_row(df.loc[1]))
        self.assertNotEqual(
            utils.hash_df_row(df.loc[0]), utils.hash_df_row(df.loc[2]))
