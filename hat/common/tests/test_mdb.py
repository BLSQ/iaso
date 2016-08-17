from django.test import TestCase
from pandas import DataFrame
from ..sqlalchemy import engine
from .. import mdb

mdb_file = 'testdata/HAT-Historical-Data-Forms-TEST-v1.mdb'


class MdbTests(TestCase):
    def test_get_schema(self):
        schema = mdb.get_schema(mdb_file)
        self.assertIsInstance(schema, str)
        self.assertRegex(schema, r'CREATE TABLE "T_CARDS"')
        self.assertRegex(schema, r'CREATE TABLE "T_FOLLOWUPS"')

    def test_get_table_schema(self):
        schema = mdb.get_schema(mdb_file, 'T_CARDS')
        self.assertIsInstance(schema, str)
        self.assertRegex(schema, r'CREATE TABLE "T_CARDS"')
        self.assertNotRegex(schema, r'CREATE TABLE "T_FOLLOWUPS"')

    def test_get_tablenames(self):
        names = mdb.get_tablenames(mdb_file)
        self.assertIn('T_CARDS', names)

    def test_get_table_csv(self):
        csv = mdb.get_table_csv(mdb_file, 'T_CARDS')
        self.assertIsInstance(csv, str)
        self.assertRegex(csv, r'F_ID')

    def test_convert_intbool_cols(self):
        df = DataFrame({'a': [0, 1, 0]})
        schema = '''
        "a" BOOL NOT NULL
        '''
        mdb.convert_intbool_cols(df, schema)
        self.assertListEqual(list(df['a'].values), [False, True, False])

    def test_extract_mdbtable(self):
        (df, schema) = mdb.extract_mdbtable(mdb_file, 'T_CARDS')
        self.assertIsInstance(schema, str)
        self.assertIsInstance(df, DataFrame)
        self.assertIn('F_ID', df)
        # check that 0/1 bools have been converted to False/True
        self.assertEqual(df['A_SYMPTOMS'].dtype, 'bool')


class MdbTestsWithDB(TestCase):
    def tearDown(self):
        # The sqlalchemy engine needs to be disposed to kill its connection
        # to the DB. Otherwise django will not be able to drop the test DB.
        engine.dispose()

    def test_extract_mdbtable_via_db(self):
        df = mdb.extract_mdbtable_via_db(mdb_file, 'T_CARDS')
        self.assertIsInstance(df, DataFrame)
        self.assertIn('F_ID', df)
        # pandas should have datetime type info after reading from a db-table
        self.assertRegex(str(df['F_TIMESTAMP'].dtype), r'datetime')
