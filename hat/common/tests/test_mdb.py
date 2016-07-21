from django.test import TestCase
from hat.common import mdb

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
