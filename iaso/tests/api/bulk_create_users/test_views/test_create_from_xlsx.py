# def csv_to_xlsx(csv_path: str, xlsx_path: str):
#     # Read CSV
#     df = pd.read_csv(csv_path)
#
#     # Write Excel
#     df.to_excel(xlsx_path, index=False, engine="openpyxl")
#
from iaso.tests.api.bulk_create_users.test_views.test_create_from_csv import BulkCreateFromCsvTestCase


class BulkCreateFromXlsxTestCase(BulkCreateFromCsvTestCase):
    pass
