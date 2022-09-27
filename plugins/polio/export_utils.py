from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Alignment  

def generate_xlsx(filename, columns, datas):
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    # display columns in the xlsx file
    for row in range(1,2):
        for column in range(1, len(columns) + 1):
            cell = sheet.cell(column=column, row=row, value=columns[column-1])
            cell.alignment = Alignment(horizontal='left', vertical='top') 
    # display calendar data in the xlsx file
    for data in datas:
        # loop over each row representing a country campaign rounds
        for row in range(1, len(datas)):
            cell = sheet.cell(column=1, row=row+1, value=datas[row-1]["country_name"])
            cell.alignment = Alignment(horizontal='left', vertical='top') 
            # loop over rounds for each month
            for month in range(1,13):
                if str(month) in datas[row-1]["rounds"].keys():
                    cell = sheet.cell(column=month+1, row=row+1, value=get_cell_data(datas[row-1]["rounds"][str(month)]))
                else:
                    cell = sheet.cell(column=month+1, row=row+1, value="")
                cell.alignment = Alignment(horizontal='left', vertical='top')  
    file.save(filename+".xlsx")
    return file

def get_cell_data(rounds):
    cell_data = ""
    for round in rounds:
        cell_data += round["obr_name"]+"\n"
        cell_data += "Dates: "+round["started_at"]+"-"+round["ended_at"]+"\n"
        cell_data += round["vacine"]+"\n" if round["vacine"] is not None else "\n"
    return cell_data
