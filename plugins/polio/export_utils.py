from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook

def generate_xlsx(filename, columns, datas):
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    sheet.append(columns)
    for data in datas:
        data_to_display = []
        data_to_display.append(data["country_name"])
        for month in range(1,13):
            if str(month) in data["rounds"].keys():
                data_to_display.append(get_cell_data(data["rounds"][str(month)]))
            else:
                data_to_display.append("")
        sheet.append(data_to_display)
    file.save(filename+".xlsx")
    return file

def get_cell_data(rounds):
    cell_data = ""
    for round in rounds:
        cell_data += round["obr_name"]+"\n"
        cell_data += "Dates: "+round["started_at"]+"-"+round["ended_at"]+"\n"
        cell_data += round["vacine"]+"\n" if round["vacine"] is not None else "\n"
    return cell_data
