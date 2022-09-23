from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook

def generate_xlsx(filename, columns, datas):
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    sheet.append(columns)
    for index in range(len(datas)):
        for key in datas[index]:
            data_to_display = []
            data_to_display.append(datas[index][key]["country_name"])
            for x in datas[index][key]["rounds"]:
                data_to_display.append('-'.join(datas[index][key]["rounds"][x]))    
            sheet.append(data_to_display)

    file.save(filename+".xlsx")
    return file