from typing import Optional

import gspread
from gspread.utils import a1_to_rowcol

from plugins.polio.preparedness.client import get_client
from plugins.polio.preparedness.exceptions import InvalidFormatError


def parse_value(value: str):
    try:
        return int(value.replace("%", ""))
    except ValueError:
        return 0


def open_sheet_by_url(spreadsheet_url):
    client = get_client()
    return client.open_by_url(spreadsheet_url)


def from_percent(x: Optional[float]):
    return x * 100 if (x is not None and isinstance(x, (int, float))) else None


class CachedSpread:
    def __init__(self, cache_dict):
        self.c = cache_dict

    @staticmethod
    def from_spread(spread: gspread.Spreadsheet):
        dict_spread = {}
        dict_spread["title"] = spread.title
        dict_spread["id"] = spread.id
        dict_spread["properties"] = spread._properties
        dict_spread["sheets"] = sheets = []
        for sheet in spread.worksheets():
            dict_sheet = {
                "title": sheet.title,
                "id": sheet.id,
                # "formula": sheet.get(value_render_option=gspread.utils.ValueRenderOption.formula),
                "values": sheet.get(
                    value_render_option=gspread.utils.ValueRenderOption.unformatted,
                    date_time_render_option="FORMATTED_STRING",
                ),
            }
            sheets.append(dict_sheet)
        return CachedSpread(dict_spread)

    @property
    def title(self):
        return self.c["title"]

    def worksheets(self):
        return [CachedSheet(cd) for cd in self.c["sheets"]]


class CachedSheet:
    def __init__(self, cache_dict: dict):
        self.c = cache_dict
        self.values = cache_dict["values"]

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

    def get_rc(self, row, col):
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

    def __repr__(self):
        return f'<CachedSheet title="{self.c["title"]}">'

    def find(self, query: str):
        for row_num, row in enumerate(self.values):
            for col_num, cell in enumerate(row):
                if cell == query:
                    return row_num + 1, col_num + 1
        return None

    def get_line_start(self, row_num, col_start):
        "get cell in a line starting from a value to the end"
        row = self.values[row_num - 1]
        values = row[col_start - 1 :]
        r = [(row_num, col_start + i, value) for i, value in enumerate(values)]
        return r


# Key  indicator and their positions in the sheets
NATIONAL_INDICATORS = {
    "operational_fund": "E18",
    "vaccine_and_droppers_received": "E35",
    "vaccine_cold_chain_assessment": "E34",
    "vaccine_monitors_training_and_deployment": "E36",
    "ppe_materials_and_others_supply": "E39",
    "penmarkers_supply": "E38",
    "sia_training": "E23",
    "sia_micro_planning": "E17",
    "communication_sm_fund": "E45",
    "communication_sm_activities": "E47",
    "communication_c4d": "E46",
    "aefi_easi_protocol": "E52",
    "pharamcovigilence_committee": "E51",
}


# Key indicator and their positions in the "REGIONAL" sheets
REGIONAL_INDICATORS = {
    "operational_fund": "F8",
    "vaccine_and_droppers_received": "F34",
    "vaccine_cold_chain_assessment": "F33",
    "vaccine_monitors_training_and_deployment": "F35",
    "ppe_materials_and_others_supply": "F37",
    "penmarkers_supply": "F36",  # date
    "sia_training": "F17",
    "sia_micro_planning": "F26",
    "communication_sm_fund": "F43",
    "communication_sm_activities": "F46",
    "communication_c4d": "F45",  # date
    "aefi_easi_protocol": "F52",
    "pharamcovigilence_committee": "F51",
}


# District indicator row, save a Region instead it's only the line number because the number of district isn't fix
DISTRICT_INDICATORS = {
    "operational_fund": 8,
    "vaccine_and_droppers_received": 34,
    "vaccine_cold_chain_assessment": 33,
    "vaccine_monitors_training_and_deployment": 35,
    "ppe_materials_and_others_supply": 37,
    "penmarkers_supply": 36,  # date
    "sia_training": 17,
    "sia_micro_planning": 26,
    "communication_sm_fund": 43,
    "communication_sm_activities": 46,
    "communication_c4d": 45,  # date
    "aefi_easi_protocol": 52,
    "pharamcovigilence_committee": 51,
}

DISTRICT_LIST_LINE_NUMBER = 7
DISTRICT_LIST_START = 7


def _get_scores(sheet: CachedSheet, cell_pos):
    """The scores are fetched from a box
    Starting at the "Summary of {Regional|National} Level Preparedness" cell, the scores will be one column ahead and one row below.
    For example, given the summary cell is at A1, the score's range will be B2:B8.

    Regardless type of content (national, regional or district) the summary
    should always have the same structure and the scores must be in this order:

    1. Planning, coordination and funding
    2. Training for SIAs quality
    3. Monitoring and Supervision
    4. Vaccine, cold chain and logistics
    5. Advocacy, social mobilization and communication
    6. Adverse Event Following Immunization (AEFI)
    Status of preparedness
    """

    row, col = cell_pos
    return {
        "planning_score": from_percent(sheet.get_rc(row + 1, col + 1)),
        "training_score": from_percent(sheet.get_rc(row + 2, col + 1)),
        "monitoring_score": from_percent(sheet.get_rc(row + 3, col + 1)),
        "vaccine_score": from_percent(sheet.get_rc(row + 4, col + 1)),
        "advocacy_score": from_percent(sheet.get_rc(row + 5, col + 1)),
        "adverse_score": from_percent(sheet.get_rc(row + 6, col + 1)),
        "status_score": from_percent(sheet.get_rc(row + 7, col + 1)),
    }


def get_national_level_preparedness(spread: CachedSpread):
    for worksheet in spread.worksheets():
        cell = worksheet.find("Summary of National Level Preparedness")
        if not cell:
            cell = worksheet.find("Résumé du niveau de préparation au niveau national ")
        if not cell:
            print(f"No data found on worksheet: {worksheet.title}")
            continue
        if cell:
            print(f"Data found on worksheet: {worksheet.title}")
            kv = worksheet.get_dict_position(NATIONAL_INDICATORS)
            score = _get_scores(worksheet, cell)
            return {**kv, **score}
    raise Exception(
        "Summary of National Level Preparedness`or Summary of Regional Level Preparedness was not found in this document"
    )


def get_indicator_per_districts(sheet: CachedSheet):
    # Detect List of districts, and in which colum they are
    districts = sheet.get_line_start(DISTRICT_LIST_LINE_NUMBER, DISTRICT_LIST_START)
    # ignore last column since it the comments
    districts = districts[:-1]
    districts_indicators = {}
    for rownum, colnum, district_name in districts:
        if not district_name:
            continue
        districts_indicators[district_name] = {}
        for indicator_key, indicator_row in DISTRICT_INDICATORS.items():
            districts_indicators[district_name][indicator_key] = sheet.get_rc(indicator_row, colnum)
    return districts_indicators


def get_regional_level_preparedness(spread: CachedSpread):

    """Parse the region sheet
    There is two section we parse the General table, and the score table. They are not aligned.
    for the first table we assume it's always in the same place only the number of district change
    but for the second we actually search for the start of the box, via the magic strings
    also in some sheet for the score table there is a gap between the region and the district, which is why we ignore
    empty district_name
    """
    regions = {}
    districts = {}

    sheet: CachedSheet
    for sheet in spread.worksheets():
        if sheet.title != "MBARARA":
            continue
        # detect if we are in a Regional Spreadsheet form the title
        # and find position of the total score box
        cell = sheet.find("Summary of Regional Level Preparedness")
        if not cell:
            cell = sheet.find("Résumé du niveau de préparation")
        if not cell:
            print(f"No regional data found on worksheet: {sheet.title}")
            continue
        print(f"Regional Data found on worksheet: {sheet.title}")

        indicators = sheet.get_dict_position(REGIONAL_INDICATORS)
        indicators["communication_sm_activities"] = from_percent(indicators["communication_sm_activities"])
        regional_name = sheet.get_rc(cell[0], cell[1] + 1)
        regional_score = _get_scores(sheet, cell)
        regions[regional_name] = {**indicators, **regional_score}

        # for indicators
        district_indicators = get_indicator_per_districts(sheet)

        # Find district box
        # start juste after the region
        col_district = sheet.get_line_start(cell[0], cell[1] + 2)
        ligne_score_district = cell[0]
        for row_num, col_num, district_name in col_district:
            if not district_name:
                continue
            district_scores = _get_scores(sheet, (row_num, col_num))
            districts[district_name] = {**district_scores, "region": regional_name}

        # merge both dict
        for district_name, values in district_indicators.items():
            if district_name in districts:
                districts[district_name].update(values)
            else:
                districts[district_name] = values

    if not regions:
        raise InvalidFormatError("Summary of Regional Level Preparedness` was not found in this document")
    return {"regions": regions, "districts": districts}
