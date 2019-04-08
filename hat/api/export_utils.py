import csv
import io

import xlsxwriter
from django.conf import settings
from xlsxwriter.utility import xl_rowcol_to_cell


def write_sheet(wb, sheet_name, col_descs, queryset, get_row, with_link):
    ws = wb.add_worksheet(sheet_name)

    bold = wb.add_format({'bold': True})
    bold.set_text_wrap()

    max_height = max([c["title"].count("\n") for c in col_descs]) + 1  # Nb of lines in titles
    ws.set_row(0, 15 * max_height, bold)  # default height is 15
    ws.freeze_panes(1, 0)

    for i, col_desc in enumerate(col_descs):
        xl_col = xl_rowcol_to_cell(0, i)
        size = col_desc["width"] if col_desc["width"] else len(col_desc["title"])
        ws.set_column(xl_col + ':' + xl_col, size)

    row_num = 1
    col_titles = [cd["title"] for cd in col_descs]
    ws.write_row('A' + str(row_num), col_titles, bold)

    for item in queryset:
        row_num += 1
        if row_num % 1000 == 0 and settings.DEBUG:
            print(f"Sheet {sheet_name} row {row_num}")

        if not with_link:
            ws.write_row('A' + str(row_num), get_row(item, row_num=row_num))
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
    """
    Generate an XLSX file with the provided parameters.
    :param sheet_name: Array of sheet names
    :param columns: Array of column descriptors. First array per sheet, second Array per column, then dict. Example
                    [[{"title": "This is the\ntitle", "width": 10}, {"title": "foo"}]]
                    title: Title of the columns, shown in bold in the header row. This can contain crlf to force
                           multiple lines. The row height will be computed depending on the nb of crlf
                    width: roughly equivalent to the number of characters. If unspecified, the length of the title
                           is used.
                    format: format of the content. This is only necessary for "percent" for example
    :param queryset: Array of querysets to use for each sheet
    :param get_row: Array of functions to fetch data values.
                    Minimal version: get_row(row, **kwargs) where row is a queryset item
                    **kwargs allows the XLSX generator to pass additional params without rewriting all get_row methods
                    Additional params include:
                    * row_num that is useful to make basic formulas.
    :param with_link: Will be renamed to advanced. By default, rows are processed as a whole to be faster. Specifying
                      this parameter will process data by cell and set the proper format (like links)
    :return: the XLSX result to be included in the response. This is always using a temporary file.
    """
    output = io.BytesIO()
    wb = xlsxwriter.Workbook(output, {'constant_memory': True})
    if isinstance(sheet_name, list):
        i = 0
        for sheet in sheet_name:
            write_sheet(wb, sheet, columns[i], queryset[i], get_row[i],
                        with_link[i] if with_link is list else with_link)
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
