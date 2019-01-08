from unittest import skip

from django.test import TransactionTestCase
from ..export_csv import export_csv


class ExportTests(TransactionTestCase):

    @skip("Cannot run on dev machines")
    def test_export(self):
        def read_file(filename):
            with open(filename, 'r') as file:
                return file.read()

        sql = 'SELECT 1 as "A", 2 as "B", 3 as "C"'

        csv_default = read_file(export_csv(sql_sentence=sql))
        csv_comma = read_file(export_csv(sql_sentence=sql, sep=','))
        csv_custom = read_file(export_csv(sql_sentence=sql, sep='$'))

        self.assertEqual(csv_default, csv_comma)
        self.assertNotEqual(csv_default, csv_custom)

        self.assertEqual(csv_comma, 'A,B,C\n1,2,3\n')
        self.assertEqual(csv_custom, 'A$B$C\n1$2$3\n')
