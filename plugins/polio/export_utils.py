from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook

def generate_xlsx(filename, columns, datas):
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    sheet.append(columns)
    for index in range(len(datas)):
        for key in datas[index]:
            sheet.append([datas[index][key]["country_name"]])
            
    file.save(filename+".xlsx")
    return file