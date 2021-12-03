from typing import Optional

from plugins.polio.preparedness.calculator import get_preparedness_score
from plugins.polio.preparedness.client import get_client
from plugins.polio.preparedness.exceptions import InvalidFormatError
from plugins.polio.preparedness.spread_cache import CachedSpread, CachedSheet


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
        cell = worksheet.find_one_of(
            "Summary of National Level Preparedness", "Résumé du niveau de préparation au niveau national "
        )
        if not cell:
            print(f"No national data found on worksheet: {worksheet.title}")
            continue

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
        # detect if we are in a Regional Spreadsheet form the title
        # and find position of the total score box
        cell = sheet.find_one_of(
            "Summary of Regional Level Preparedness",
            "Résumé du niveau de préparation",
            "Résumé du niveau de préparation Lomé Commune",
        )
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


def get_preparedness(spread: CachedSpread):
    preparedness_data = {
        "national": get_national_level_preparedness(spread),
        **get_regional_level_preparedness(spread),
    }
    preparedness_data["totals"] = get_preparedness_score(preparedness_data)
    return preparedness_data
