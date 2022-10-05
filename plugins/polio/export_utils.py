from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.styles.borders import Border, Side
import datetime as dt
import calendar

CALENDAR_COLUMNS_CELL_WIDTH = 25.75
CALENDAR_FIRST_COLUMN_CELL_WIDTH = 35.00
CALENDAR_FIRST_COLUMN_CELL_HEIGHT = 50.75
CALENDAR_CELL_WIDTH = 22.00
CALENDAR_CELL_HEIGHT = 80.00
CALENDAR_COLUMN_FONT_SIZE = "12"
CALENDAR_CELL_FONT_SIZE = "10"


def generate_xlsx_campaigns_calendar(filename, datas):
    """
    Create the XLSX file for the campaigns calendar

        Parameters:
                filename (str): a filename String
                datas (list[dict]): a list of data dictionaries

        returns:
                file (openpyxl.workbook): Saved file openpyxl.workbook object
    """
    file = Workbook()
    sheet = file.active
    sheet.title = filename
    columns = get_columns_names()
    # display columns in the xlsx file
    for column in range(1, len(columns) + 1):
        cell_header = sheet.cell(column=column, row=1, value=columns[column - 1])
        cell_header = format_cell(cell_header, CALENDAR_COLUMN_FONT_SIZE, True)
        sheet = cell_dimension_pattern_fill(sheet, cell_header, None, CALENDAR_COLUMNS_CELL_WIDTH, True)
    # display calendar data in the xlsx file by looping over each row representing a country campaign rounds
    for row in range(1, len(datas) + 1):
        cell_country = sheet.cell(column=1, row=row + 1, value=datas[row - 1]["country_name"])
        cell_country = format_cell(cell_country, CALENDAR_COLUMN_FONT_SIZE, True)
        sheet = cell_dimension_pattern_fill(
            sheet, cell_country, CALENDAR_FIRST_COLUMN_CELL_WIDTH, CALENDAR_FIRST_COLUMN_CELL_HEIGHT, True
        )
        # loop over rounds for each month
        for month in range(1, 13):
            if str(month) in datas[row - 1]["rounds"].keys():
                cell = sheet.cell(
                    column=month + 1, row=row + 1, value=get_cell_data(datas[row - 1]["rounds"][str(month)])
                )
            else:
                cell = sheet.cell(column=month + 1, row=row + 1, value="")
            cell = format_cell(cell, CALENDAR_CELL_FONT_SIZE)
            sheet = cell_dimension_pattern_fill(sheet, cell, CALENDAR_CELL_WIDTH, CALENDAR_CELL_HEIGHT)

    file.save(filename)

    return file


def get_cell_data(rounds):
    """
    Returns a value(string of rounds in same month) to be assigned in an XLSX cell

            parameters:
                rounds (list): a rounds list

            returns:
                cell_data (string): a cell_data string
    """
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
    """
    Returns a formatted date into "%d %B" or "%d %B %Y" format

            parameters:
                date (str): a date string
                with_year (bool): a with_year boolean
            returns:
                formatted_date (str): a formatted_date string
    """
    date_format = "%d %B"
    if with_year:
        date_format += " %Y"
    # There are some legacy campaigns which have rounds without started_at and ended_at date(None)
    # This check(if date is None) helps to avoid to format a None date
    if date is None:
        formatted_date = ""
    else:
        formatted_date = dt.datetime.strptime(date, "%Y-%m-%d").strftime(date_format)
    return formatted_date


def cell_dimension_pattern_fill(sheet, cell, width, height, pattern_fill=False):
    """
    Return the openpyxl.worksheet object after applying fill color on a cell

            parameters:
                sheet (openpyxl.worksheet): a sheet openpyxl.worksheet object
                cell (openpyxl.cell): a cell openpyxl.cell object
                width (float): a width float
                height (float): a height float
                pattern_fill (boolean): a pattern_fill boolean with false as default value

            returns:
                sheet (openpyxl.worksheet): a sheet openpyxl.worksheet object
    """
    if width is not None:
        sheet.column_dimensions[cell.column_letter].width = float(width)
    if height is not None:
        sheet.row_dimensions[cell.row].height = float(height)
    if pattern_fill:
        sheet[cell.column_letter + str(cell.row)].fill = PatternFill("solid", start_color="999791")
    return sheet


def format_cell(cell, size, is_header=False):
    """
    Return the openpyxl.cell object after applying alignement, border and font

            parameters:
                cell (openpyxl.cell): a cell openpyxl.cell object
                size (str): a size string
                is_header (boolean): a is_header boolean with false as default value

            returns:
                cell (openpyxl.cell): a sheet openpyxl.cell object
    """
    cell.alignment = Alignment(horizontal="left", vertical="top", wrap_text=True)
    cell.border = border_style(is_header)
    cell.font = Font(size=size)

    return cell


def border_style(is_header):
    """
    Return the border(openpyxl.styles.borders.Border) object for each cell

            parameters:
                is_header (boolean): a is_header boolean

            returns:
                border (openpyxl.styles.borders.Borderl): a border openpyxl.styles.borders.Border object
    """
    return Border(
        left=Side(style="thin"),
        right=Side(style="thin"),
        top=Side(style="thin"),
        bottom=Side(style="thin" if not is_header else "medium"),
    )


def get_columns_names():
    """
    Return the list of columns name(COUNTRY and year's months)

            parameters:
                No parameters

            returns:
                columns_names (list): a columns_names list
    """
    columns_names = []
    for month_num in range(1, 13):
        month_name = calendar.month_name[month_num]
        columns_names.append(month_name)
    columns_names.insert(0, "COUNTRY")
    return columns_names


def xlsx_file_name(name, params):
    """
    Return the exported XLSX file name

            parameters:
                name (str): a default name(calendar) string
                params (django.http.request.QueryDict): django query dict params
            returns:
                filename (str): filename string
    """
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
