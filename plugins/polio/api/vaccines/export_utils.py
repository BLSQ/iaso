from openpyxl import Workbook
from openpyxl.styles import Font

from plugins.polio.api.vaccines.common import sort_results
from plugins.polio.export_utils import cell_border


def get_sheet_configs():
    common_columns = ["Country", "Vaccine", "Date", "Vials type", "Action Type", "Action"]
    common_keys = ["country", "vaccine", "date", "vials_type", "type", "action"]

    variants_columns_keys = {
        "Usable": {
            "extra_columns": ["Vials IN", "Vials OUT", "Doses IN", "Doses OUT"],
            "extra_keys": ["vials_in", "vials_out", "doses_in", "doses_out"],
        },
        "Unusable": {
            "extra_columns": ["Vials IN", "Vials OUT"],
            "extra_keys": ["vials_in", "vials_out"],
        },
        "Earmarked": {
            "extra_columns": ["Vials IN", "Vials OUT"],
            "extra_keys": ["vials_in", "vials_out"],
        },
    }

    return {
        name: {
            "columns": common_columns + variant["extra_columns"],
            "keys": common_keys + variant["extra_keys"],
            "sum_columns": variant["extra_keys"],
        }
        for name, variant in variants_columns_keys.items()
    }


def write_vials_doses_totals(sheet, config, sums, sum_columns_indices):
    """
    Writes the total row into the Excel sheet.
    """
    action_index = config["keys"].index("action")

    total_row = [""] * len(config["columns"])
    total_row[action_index] = "Total :"

    for col, idx in zip(config["sum_columns"], sum_columns_indices):
        total_row[idx] = sums[col]

    sheet.append(total_row)
    total_row_index = sheet.max_row
    for col in range(1, len(config["columns"]) + 1):
        cell = sheet.cell(row=total_row_index, column=col)
        cell.font = Font(bold=True)
        cell.number_format = "#,##0"


def vials_doses_totals(data, sum_columns):
    """
    Calculates the total sum for each column in sum_columns.
    """
    sums = {col: 0 for col in sum_columns}
    for entry in data:
        for col in sum_columns:
            if isinstance(entry.get(col, 0), (int, float)):
                sums[col] += entry[col]
    return sums


def write_vials_doses_stock_balance(sheet, config, sums, sum_columns_indices):
    """
    Adds stock balance row to the Excel sheet.
    """
    action_index = config["keys"].index("action")
    stock_balances_row = [""] * len(config["columns"])
    stock_balances_row[action_index] = "Stock Balances :"

    if "vials_in" in sums and "vials_out" in sums:
        stock_balances_row[sum_columns_indices[0]] = sums["vials_in"] - sums["vials_out"]

    if "doses_in" in sums and "doses_out" in sums:
        stock_balances_row[sum_columns_indices[2]] = sums["doses_in"] - sums["doses_out"]

    sheet.append(stock_balances_row)

    stock_balances_row_index = sheet.max_row
    for col in range(1, len(config["columns"]) + 1):
        cell = sheet.cell(row=stock_balances_row_index, column=col)
        cell.font = Font(bold=True)
        cell.number_format = "#,##0"


def write_colums_headers(sheet, config):
    """
    Adds columns headers.
    """
    sheet.append(config["columns"])
    for col, _ in enumerate(config["columns"], start=1):
        sheet.column_dimensions[chr(64 + col)].width = 21
        cell_header = sheet.cell(row=1, column=col)
        cell_header = cell_border(cell_header)


def write_columns_data(sheet, config, datas, sheet_name):
    """
    Adds columns data.
    """
    for entry in datas:
        row = []
        for key in config["keys"]:
            if key == "vials_type":
                row.append(sheet_name)
            else:
                row.append(entry[key] if entry[key] is not None else "")
        sheet.append(row)

        for col_index, value in enumerate(row, start=1):
            if isinstance(value, (int, float)):
                sheet.cell(row=sheet.max_row, column=col_index).number_format = "#,##0"


def get_vaccine_country(vaccine_stock):
    country = vaccine_stock.country.name
    vaccine = vaccine_stock.vaccine
    return {"country": country, "vaccine": vaccine}


def download_xlsx_stock_variants(request, filename, results, lambda_methods, vaccince_stock, tab):
    workbook = Workbook()
    sheet_configs = get_sheet_configs()

    sheets_order = sheet_configs.keys()
    sheets = {}
    for sheet_name in sheets_order:
        config = sheet_configs[sheet_name]
        if sheet_name == tab:
            sheet = workbook.active
            sheet.title = sheet_name
        else:
            sheet = workbook.create_sheet(sheet_name)

        sheets[sheet_name] = sheet

        write_colums_headers(sheet, config)

        datas = results if sheet_name == tab else sort_results(request, lambda_methods.get(sheet_name, lambda: [])())
        vaccince_country = get_vaccine_country(vaccince_stock)
        for data in datas:
            data["country"] = vaccince_country["country"]
            data["vaccine"] = vaccince_country["vaccine"]

        write_columns_data(sheet, config, datas, sheet_name)

        sheet.append([""] * len(config["columns"]))

        sum_columns_indices = [config["keys"].index(col) for col in config["sum_columns"]]
        sums = vials_doses_totals(datas, config["sum_columns"])
        write_vials_doses_totals(sheet, config, sums, sum_columns_indices)

        write_vials_doses_stock_balance(sheet, config, sums, sum_columns_indices)

    workbook._sheets = [sheets[name] for name in sheets_order]
    workbook.save(filename)
    return workbook
