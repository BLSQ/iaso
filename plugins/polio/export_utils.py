from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook

def generate_xlsx(filename, columns):
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    sheet.append(columns)
    file.save(filename+".xlsx")
    return file