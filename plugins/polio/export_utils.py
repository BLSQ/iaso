from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook
from openpyxl.utils import get_column_letter

def generate_xlsx(filename, columns, datas):
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    sheet.append(columns)
    for data in datas:
        data_to_display = []
        for row in range(1, len(datas)):
            _ = sheet.cell(column=1, row=row+1, value=datas[row-1]["country_name"].format(get_column_letter(1)))
            for month in range(1,13):
                if str(month) in datas[row-1]["rounds"].keys():
                    _ = sheet.cell(column=month+1, row=row+1, value=get_cell_data(datas[row-1]["rounds"][str(month)]).format(get_column_letter(month+1)))
                else:
                    _ = sheet.cell(column=month+1, row=row+1, value="".format(get_column_letter(month+1)))
    file.save(filename+".xlsx")
    return file

def get_cell_data(rounds):
    cell_data = ""
    for round in rounds:
        cell_data += round["obr_name"]+"\n"
        cell_data += "Dates: "+round["started_at"]+"-"+round["ended_at"]+"\n"
        cell_data += round["vacine"]+"\n" if round["vacine"] is not None else "\n"
    return cell_data
