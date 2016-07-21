from django.test import TestCase
from pandas import DataFrame
from hat.historic import extract

mdb_file = 'testdata/HAT-Historical-Data-Forms-TEST-v1.mdb'


class ExtractTests(TestCase):
    def test_convert_intbool_cols(self):
        df = DataFrame({'a': [0, 1, 0]})
        schema = '''
        "a" BOOL NOT NULL
        '''
        extract.convert_intbool_cols(df, schema)
        self.assertListEqual(list(df['a'].values), [False, True, False])

    def test_extract_mdbtable(self):
        (df, schema) = extract.extract_mdbtable(mdb_file, 'T_CARDS')
        self.assertIsInstance(schema, str)
        self.assertIsInstance(df, DataFrame)
        self.assertIn('F_ID', df)
        # check that 0/1 bools have been converted to False/True
        self.assertEqual(df['A_SYMPTOMS'].dtype, 'bool')

    def test_extract_mdbtable_via_db(self):
        df = extract.extract_mdbtable_via_db(mdb_file, 'T_CARDS')
        self.assertIsInstance(df, DataFrame)
        self.assertIn('F_ID', df)
        # pandas should have datetime type info after reading from a db-table
        self.assertRegex(str(df['F_TIMESTAMP'].dtype), r'datetime')
