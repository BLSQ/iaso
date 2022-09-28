from curses import start_color
from turtle import color
from openpyxl import Workbook
from openpyxl.writer.excel import save_virtual_workbook
from openpyxl.utils import get_column_letter
from openpyxl.styles import Alignment, Font, PatternFill  
from openpyxl.styles.borders import Border, Side
import datetime as dt
# from datetime import datetime

def generate_xlsx(filename, columns, datas):
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    thin_border = Border(left=Side(style='thin'), 
                     right=Side(style='thin'), 
                     top=Side(style='thin'), 
                     bottom=Side(style='thin'))
    bottom_medium_border = Border(left=Side(style='thin'), 
                     right=Side(style='thin'), 
                     top=Side(style='thin'), 
                     bottom=Side(style='medium'))
    # display columns in the xlsx file
    for row in range(1,2):
        for column in range(1, len(columns) + 1):
            cell = sheet.cell(column=column, row=row, value=columns[column-1])
            cell.alignment = Alignment(horizontal='left', vertical='top') 
            cell.border = bottom_medium_border
            sheet.row_dimensions[cell.row].height = float(25.75)
            sheet[cell.column_letter+str(cell.row)].fill = PatternFill("darkGrid", start_color="999791")
    # display calendar data in the xlsx file
    for data in datas:
        fontStyle = Font(size = "10")
        # loop over each row representing a country campaign rounds
        for row in range(1, len(datas)):
            max_length = get_max_rounds_length(datas[row-1]["rounds"])
            cell = sheet.cell(column=1, row=row+1, value=datas[row-1]["country_name"]+"\n"+"Bien")
            sheet[cell.column_letter+str(row+1)].fill = PatternFill("darkGrid", start_color="999791")
            cell.alignment = Alignment(horizontal='left', vertical='top') 
            cell.border = bottom_medium_border
            cell.font = fontStyle
            sheet.column_dimensions[cell.column_letter].width = float(35.00)
            sheet.row_dimensions[cell.row].height = float(50.75)
            # loop over rounds for each month
            for month in range(1,13):
                if str(month) in datas[row-1]["rounds"].keys():
                    cell = sheet.cell(column=month+1, row=row+1, value=get_cell_data(datas[row-1]["rounds"][str(month)]))
                else:
                    cell = sheet.cell(column=month+1, row=row+1, value="")
                cell.font = fontStyle
                cell.alignment = Alignment(horizontal='left', vertical='top')  
                cell.border = thin_border
                sheet.column_dimensions[cell.column_letter].width = float(22.00)
                sheet.row_dimensions[cell.row].height = float(80.00)
     
    file.save(filename+"csv")
    return file

def get_cell_data(rounds):
    cell_data = ""
    for round in rounds:
        started_at = dt.datetime.strptime(round["started_at"], "%Y-%m-%d")
        started_at = started_at.strftime("%d %B")
        ended_at = dt.datetime.strptime(round["ended_at"], "%Y-%m-%d")
        ended_at = ended_at.strftime("%d %B %Y")
        cell_data += round["obr_name"]+"\n"
        cell_data += "Dates: "+started_at+" - "+ended_at+"\n"
        cell_data += round["vacine"]+"\n" if round["vacine"] is not None else "\n"
        cell_data += "-------------------------------------------------\n"
    return cell_data

def get_max_rounds_length(rounds):
    rounds_lenth = []
    for x in rounds:
        rounds_lenth.append(len(rounds[x]))
    # print(rounds[x])
    return max(rounds_lenth)

