from openpyxl import Workbook
from openpyxl.styles import Font

from plugins.polio.api.vaccines.common import sort_results


def get_sheet_configs():
    common_columns = ["Country", "Vaccine", "Date", "Action Type", "Action"]
    common_keys = ["country", "vaccine", "date", "type", "action"]

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
        sheet.cell(row=total_row_index, column=col).font = Font(bold=True)


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

    stock_balances_row[sum_columns_indices[0]] = sums["vials_in"] - sums["vials_out"]

    if "doses_in" in sums and "doses_out" in sums:
        stock_balances_row[sum_columns_indices[2]] = sums["doses_in"] - sums["doses_out"]

    sheet.append(stock_balances_row)

    stock_balances_row_index = sheet.max_row
    for col in range(1, len(config["columns"]) + 1):
        sheet.cell(row=stock_balances_row_index, column=col).font = Font(bold=True)


def download_xlsx_summary(request, filename, results, lambda_methods, tab):
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
        sheet.append(config["columns"])

        datas = results if sheet_name == tab else sort_results(request, lambda_methods.get(sheet_name, lambda: [])())

        sum_columns_indices = [config["keys"].index(col) for col in config["sum_columns"]]
        sums = vials_doses_totals(datas, config["sum_columns"])

        for entry in datas:
            row = [entry[key] if entry[key] is not None else "" for key in config["keys"]]
            sheet.append(row)

        sheet.append([""] * len(config["columns"]))

        write_vials_doses_totals(sheet, config, sums, sum_columns_indices)

        write_vials_doses_stock_balance(sheet, config, sums, sum_columns_indices)

    workbook._sheets = [sheets[name] for name in sheets_order]
    workbook.save(filename)
    return workbook
