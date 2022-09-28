from ctypes import alignment
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
    alignment = {"horizontal": "left", "vertical": "top"}
    header_border = {"left": "thin", "right": "thin", "top": "thin", "bottom": "medium"}
    cell_border = {"left": "thin", "right": "thin", "top": "thin", "bottom": "thin"}
    # display columns in the xlsx file
    for row in range(1,2):
        for column in range(1, len(columns) + 1):
            cell_header = sheet.cell(column=column, row=row, value=columns[column-1])
            cell_header = format_cell(cell_header, "12", alignment , header_border)
            sheet = cell_dimension(sheet, cell_header, None, 25.75)
            sheet[cell_header.column_letter+str(cell_header.row)].fill = PatternFill("solid", start_color="999791")
    # display calendar data in the xlsx file
    for data in datas:
        # loop over each row representing a country campaign rounds
        for row in range(1, len(datas)):
            max_length = get_max_rounds_length(datas[row-1]["rounds"])
            cell_country = sheet.cell(column=1, row=row+1, value=datas[row-1]["country_name"])
            cell_country = format_cell(cell_country, "12", alignment , header_border)
            sheet = cell_dimension(sheet, cell_country, 35.00, 50.75)
            sheet[cell_country.column_letter+str(row+1)].fill = PatternFill("solid", start_color="999791")
            # loop over rounds for each month
            for month in range(1,13):
                cell = None
                if str(month) in datas[row-1]["rounds"].keys():
                    cell = sheet.cell(column=month+1, row=row+1, value=get_cell_data(datas[row-1]["rounds"][str(month)]))
                else:
                    cell = sheet.cell(column=month+1, row=row+1, value="")
                cell = format_cell(cell, "10", alignment , cell_border)
                sheet = cell_dimension(sheet, cell, 22.00, 80.00)
     
    file.save(filename)
    return file

def get_cell_data(rounds):
    cell_data = ""
    for round in rounds:
        started_at = format_date(round["started_at"])
        ended_at = format_date(round["ended_at"])
        obr_name = round["obr_name"] if round["obr_name"] is not None else ""
        cell_data += obr_name+"\n"
        cell_data += "Dates: "+started_at+" - "+ended_at+"\n"
        cell_data += round["vacine"]+"\n\n" if round["vacine"] is not None else "\n"
    return cell_data

def format_date(date):
    formated_date = dt.datetime.strptime(date, "%Y-%m-%d")
    return formated_date.strftime("%d %B")

def get_max_rounds_length(rounds):
    rounds_lenth = []
    for x in rounds:
        rounds_lenth.append(len(rounds[x]))
    return max(rounds_lenth)

def cell_dimension(sheet, cell, width, height):
    if width is not None:
        sheet.column_dimensions[cell.column_letter].width = float(width)
    if height is not None:
        sheet.row_dimensions[cell.row].height = float(height)
    return sheet

def format_cell(cell, size, alignement, border):
    cell.alignment = Alignment(horizontal=alignement['horizontal'], vertical=alignement['vertical']) 
    cell.border = border_style(border["left"],border["right"],border["top"], border["bottom"])
    cell.font = Font(size = size)
    return cell

def border_style(left, right, top, bottom):
    return Border(
        left=Side(style=left), 
        right=Side(style=right), 
        top=Side(style=top), 
        bottom=Side(style=bottom)
        )

