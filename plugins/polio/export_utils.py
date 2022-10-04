from ctypes import alignment
from curses import start_color
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.styles.borders import Border, Side
import datetime as dt
import calendar


def generate_xlsx_campaigns_calendar(filename, datas):
    """Takes two parameters: 1. The Xlsx filename 2. An array of datas to display in Xlsx file
    The method will loop over datas and assign values to cells in the Xlsx file
    After assignement it will save the Xlsx file
    It will return the saved xlsx file"""
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    columns = get_columns_names()
    # display columns in the xlsx file
    for column in range(1, len(columns) + 1):
        cell_header = sheet.cell(column=column, row=1, value=columns[column - 1])
        cell_header = format_cell(cell_header, "12", True)
        sheet = cell_dimension_pattern_fill(sheet, cell_header, None, 25.75, True)
    # display calendar data in the xlsx file by looping over each row representing a country campaign rounds
    for row in range(1, len(datas) + 1):
        cell_country = sheet.cell(column=1, row=row + 1, value=datas[row - 1]["country_name"])
        cell_country = format_cell(cell_country, "12", True)
        sheet = cell_dimension_pattern_fill(sheet, cell_country, 35.00, 50.75, True)
        # loop over rounds for each month
        for month in range(1, 13):
            cell = None
            if str(month) in datas[row - 1]["rounds"].keys():
                cell = sheet.cell(
                    column=month + 1, row=row + 1, value=get_cell_data(datas[row - 1]["rounds"][str(month)])
                )
            else:
                cell = sheet.cell(column=month + 1, row=row + 1, value="")
            cell = format_cell(cell, "10")
            sheet = cell_dimension_pattern_fill(sheet, cell, 22.00, 80.00)

    file.save(filename)
    return file


def get_cell_data(rounds):
    cell_data = ""
    for round in rounds:
        started_at = format_date(round["started_at"], False)
        ended_at = format_date(round["ended_at"], True)
        obr_name = round["obr_name"] if round["obr_name"] is not None else ""
        round_number = round["round_number"] if round["round_number"] is not None else ""
        cell_data += obr_name + "\n"
        cell_data += "Round " + str(round_number) + "\n"
        cell_data += "Dates: " + started_at + " - " + ended_at + "\n"
        cell_data += round["vacine"] + "\n\n" if round["vacine"] is not None else "\n"
    return cell_data


def format_date(date, with_year):
    date_format = "%d %B"
    if with_year:
        date_format += " %Y"
    formated_date = dt.datetime.strptime(date, "%Y-%m-%d")
    return formated_date.strftime(date_format)


def cell_dimension_pattern_fill(sheet, cell, width, height, pattern_fill=False):
    if width is not None:
        sheet.column_dimensions[cell.column_letter].width = float(width)
    if height is not None:
        sheet.row_dimensions[cell.row].height = float(height)
    if pattern_fill:
        sheet[cell.column_letter + str(cell.row)].fill = PatternFill("solid", start_color="999791")
    return sheet


def format_cell(cell, size, is_header=False):
    cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    cell.border = border_style(is_header)
    cell.font = Font(size=size)
    return cell


def border_style(is_header):
    return Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin" if not is_header else "medium"),
    )


def get_columns_names():
    columns_names = []
    for month_num in range(1, 13):
        month_name = calendar.month_name[month_num]
        columns_names.append(month_name)
    columns_names.insert(0, "COUNTRY")
    return columns_names


def xlsx_file_name(name, params):
    current_date = params.get("currentDate")
    campaign_type = params.get("campaignType")
    filename = name
    filename += "_" + current_date if current_date is not None else ""
    filename += "_" + campaign_type if campaign_type is not None else ""
    filename += "_" + "_".join(params.get("countries").split(",")) if params.get("countries") is not None else ""
    filename += (
        "_" + "_".join(params.get("campaignGroups").split(",")) if params.get("campaignGroups") is not None else ""
    )
    return filename
