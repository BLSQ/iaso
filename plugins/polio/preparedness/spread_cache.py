import gspread  # type: ignore
import gspread.utils  # type: ignore
import gspread.utils  # type: ignore


class CachedSpread:
    def __init__(self, cache_dict):
        self.c = cache_dict
        ranges = self.c.get("named_ranges", [])
        range_dict = {named_range["name"]: named_range for named_range in ranges}
        self.range_dict = range_dict

    @staticmethod
    def from_spread(spread: gspread.Spreadsheet):
        dict_spread = {}
        dict_spread["title"] = spread.title
        dict_spread["id"] = spread.id
        dict_spread["properties"] = spread._properties
        dict_spread["named_ranges"] = spread.list_named_ranges()
        dict_spread["sheets"] = sheets = []
        for sheet in spread.worksheets():
            # Google sheet has some kind of special "chart" as a sheet
            # which will fail import. their sheetType is "OBJECT"
            if sheet._properties["sheetType"] != "GRID":
                continue
            dict_sheet = {
                "title": sheet.title,
                "id": sheet.id,
                "formulas": sheet.get(value_render_option=gspread.utils.ValueRenderOption.formula),
                "values": sheet.get(
                    value_render_option=gspread.utils.ValueRenderOption.unformatted,
                    date_time_render_option="SERIAL_NUMBER",
                ),
                "properties": sheet._properties,
            }
            sheets.append(dict_sheet)
        return CachedSpread(dict_spread)

    @property
    def title(self):
        return self.c["title"]

    def get_range_row_col(self, name):
        "get start of range, useful for range of size one"
        r = self.range_dict[name]
        row = r["range"]["startRowIndex"] + 1
        col = r["range"]["startColumnIndex"] + 1
        return row, col

    def worksheets(self):
        return [CachedSheet(cd) for cd in self.c["sheets"]]


class CachedSheet:
    def __init__(self, cache_dict: dict):
        self.c = cache_dict
        self.values = cache_dict["values"]
        self.formulas = cache_dict["formulas"]
        self.properties = cache_dict.get("properties", {})

    def _cache_get(self, linenum, colnum):
        if linenum >= len(self.values):
            return None
        line = self.values[linenum]
        if colnum >= len(line):
            return None
        return line[colnum]

    def get_a1(self, a1_pos):
        row, col = gspread.utils.a1_to_rowcol(a1_pos)
        return self._cache_get(row - 1, col - 1)

    def get_rc(self, row: int, col: int):
        return self._cache_get(row - 1, col - 1)

    def get_dict_position(self, key_position):
        "From {KeyName -> Position name}  return dict of {keyName -> value at position}"
        r = {}
        for key, position in key_position.items():
            r[key] = self.get_a1(position)
        return r

    @property
    def title(self):
        return self.c["title"]

    @property
    def is_hidden(self) -> bool:
        return self.properties.get("hidden", False)

    def __repr__(self):
        return f'<CachedSheet title="{self.c["title"]}">'

    def find(self, query: str):
        "Return first cell for sprint, searching right down"
        for row_num, row in enumerate(self.values):
            for col_num, cell in enumerate(row):
                if cell == query:
                    return row_num + 1, col_num + 1
        return None

    def find_formula(self, query: str):
        for row_num, row in enumerate(self.formulas):
            for col_num, cell in enumerate(row):
                if cell == query:
                    return row_num + 1, col_num + 1
        return None

    def find_one_of(self, *queries: str):
        for query in queries:
            cell = self.find(query)
            if cell:
                return cell
        return None

    def get_line_start(self, row_num, col_start):
        "get cell in a line starting from a value to the end"
        row = self.values[row_num - 1]
        values = row[col_start - 1 :]
        r = [(row_num, col_start + i, value) for i, value in enumerate(values)]
        return r
