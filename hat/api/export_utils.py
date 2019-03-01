import csv
import io

import xlsxwriter
from django.conf import settings
from xlsxwriter.utility import xl_rowcol_to_cell


def write_sheet(wb, sheet_name, columns, queryset, get_row, with_link):
    ws = wb.add_worksheet(sheet_name)

    bold = wb.add_format({'bold': True})
    row_num = 1
    ws.write_row('A' + str(row_num), columns, bold)

    for item in queryset:
        row_num += 1
        if row_num % 1000 == 0 and settings.DEBUG:
            print(f"Sheet {sheet_name} row {row_num}")

        if not with_link:
            ws.write_row('A' + str(row_num), get_row(item))
        else:
            col_num = 0
            for column in get_row(item):
                cell = xl_rowcol_to_cell(row_num - 1, col_num)
                col_num += 1
                if 'http' in str(column):
                    ws.write_url(cell, str(column), string='Lien')
                else:
                    ws.write(cell, column)


def generate_xlsx(sheet_name, columns, queryset, get_row, with_link=False):
    output = io.BytesIO()
    wb = xlsxwriter.Workbook(output, {'constant_memory': True})
    if isinstance(sheet_name, list):
        i = 0
        for sheet in sheet_name:
            write_sheet(wb, sheet, columns[i], queryset[i], get_row[i], with_link[i] if with_link is list else with_link)
            i += 1
    else:
        write_sheet(wb, sheet_name, columns, queryset, get_row, with_link)

    wb.close()

    output.seek(0)
    return output


class Echo:
    def write(self, value):
        return value


def iter_items(queryset, pseudo_buffer, columns, get_row):
    writer = csv.writer(pseudo_buffer)
    yield writer.writerow(columns)
    for site in queryset.iterator(chunk_size=5000):
        yield writer.writerow(get_row(site))
