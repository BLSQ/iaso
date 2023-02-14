import csv
import sys

from django.core.management.base import BaseCommand

from iaso.models import Instance

csv.field_size_limit(sys.maxsize)


class Command(BaseCommand):
    help = "Import a set of external_id from a csv file with headers for columns id and export_id"

    def add_arguments(self, parser):
        parser.add_argument("csv_file", type=str, help="Path to the  csv file")
        parser.add_argument("id_column_name", type=str, help="id column name")
        parser.add_argument("export_id_column_name", type=str, help="export id column name")

    def handle(self, *args, **options):
        file_name = options.get("csv_file")
        id_column_name = options.get("id_column_name", "id")
        export_id_column_name = options.get("export_id_column_name", "export_id")
        with open(file_name, encoding="utf-8") as csvfile:
            csv_reader = csv.reader(csvfile)
            index = 0
            id_index = None
            export_id_index = None
            for row in csv_reader:
                if index == 0:  # header
                    print(row)
                    id_index = row.index(id_column_name)
                    export_id_index = row.index(export_id_column_name)
                else:
                    pk = row[id_index]
                    export_id = row[export_id_index]
                    print(pk, export_id)
                    Instance.objects.filter(pk=pk).update(export_id=export_id)
                index = index + 1
                if index % 100 == 0:
                    print(index)
