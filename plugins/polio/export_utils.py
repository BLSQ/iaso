from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook

def generate_xlsx(filename):
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    sheet['A1'] = "test"
    sheet['A2'] = "test 2"

    now = "Hello test"
    sheet['A3'] = now
    file.save(filename+".xlsx")
    return file