
import xlsxwriter
import io
import csv

def generate_xlsx(sheet_name, columns, queryset, get_row):
    output = io.BytesIO()
    wb = xlsxwriter.Workbook(output, {'constant_memory': True})
    ws = wb.add_worksheet(sheet_name)

    bold = wb.add_format({'bold': True})
    row_num = 1

    ws.write_row('A' +str(row_num), columns, bold)

    for item in queryset:
        row_num += 1
        ws.write_row('A' +str(row_num), get_row(item))
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