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


# Key indicator and their positions in the sheets
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
    "pharmacovigilance_committee": "E51",
}

# indicator row in Region sheet, sometime it can be shifted because of an extra empty row but we get the correction later
REGIONAL_DISTRICT_INDICATORS = {
    "operational_fund": 8,
    "vaccine_and_droppers_received": 34,
    "vaccine_cold_chain_assessment": 33,
    "vaccine_monitors_training_and_deployment": 35,
    "ppe_materials_and_others_supply": 37,
    "penmarkers_supply": 36,  # date
    "sia_training": 17,
    "sia_micro_planning": 26,
    "communication_sm_fund": 43,
    "communication_sm_activities": 46,  # percent (score for section)
    "communication_c4d": 45,  # date
    "aefi_easi_protocol": 51,
    "pharmacovigilance_committee": 50,
}


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
    7. Security score (not present in all sheet)
    Status of preparedness
    """
    row, col = cell_pos
    # check if we have the security row as it is not present in all row
    tentative_status_score_cell = sheet.get_rc(row + 8, col + 1)
    if tentative_status_score_cell is None:
        security_score = None
        status_score = from_percent(sheet.get_rc(row + 7, col + 1))
    else:
        security_score = from_percent(sheet.get_rc(row + 7, col + 1))
        status_score = from_percent(sheet.get_rc(row + 8, col + 1))
    return {
        "planning_score": from_percent(sheet.get_rc(row + 1, col + 1)),
        "training_score": from_percent(sheet.get_rc(row + 2, col + 1)),
        "monitoring_score": from_percent(sheet.get_rc(row + 3, col + 1)),
        "vaccine_score": from_percent(sheet.get_rc(row + 4, col + 1)),
        "advocacy_score": from_percent(sheet.get_rc(row + 5, col + 1)),
        "adverse_score": from_percent(sheet.get_rc(row + 6, col + 1)),
        "security_score": security_score,
        "status_score": status_score,
    }


def get_national_level_preparedness(spread: CachedSpread):
    for worksheet in spread.worksheets():
        cell = worksheet.find_one_of(
            "Summary of National Level Preparedness",
            "Résumé du niveau de préparation au niveau national ",
            "Résumé de la préparation au niveau national",
        )
        if not cell:
            print(f"No national data found on worksheet: {worksheet.title}")
            continue

        print(f"Data found on worksheet: {worksheet.title}")
        kv = worksheet.get_dict_position(NATIONAL_INDICATORS)
        if kv.get("communication_sm_activities"):
            kv["communication_sm_activities"] = from_percent(kv["communication_sm_activities"])
        score = _get_scores(worksheet, cell)
        return {**kv, **score}
    raise Exception(
        "Summary of National Level Preparedness or Summary of Regional Level Preparedness was not found in this document"
    )


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
            "Résumé de la préparation au niveau régional",
        )
        if not cell:
            print(f"No regional data found on worksheet: {sheet.title}")
            continue
        print(f"Regional Data found on worksheet: {sheet.title}")

        start_region = sheet.find_formula("=C4")
        if not start_region:
            start_region = sheet.find_formula("=C5")
        if not start_region:
            print(f"start of data for region not found in {sheet.title}")
            start_region = (7, 5)
        regional_name = sheet.get_rc(*start_region)

        # for indicators
        # Detect List of districts, and in which columm they are
        region_districts = sheet.get_line_start(start_region[0], start_region[1])
        # ignore last column since it the comments
        region_districts = region_districts[:-1]
        districts_indicators = {}

        for rownum, colnum, name in region_districts:
            if not name:
                continue
            districts_indicators[name] = {}
            for indicator_key, indicator_row in REGIONAL_DISTRICT_INDICATORS.items():
                shift = 0
                # some sheet have an extra empty row
                if sheet.get_a1("B14") == None and indicator_row >= 14:
                    shift = 1
                value = sheet.get_rc(indicator_row + shift, colnum)
                if indicator_key == "communication_sm_activities":
                    value = from_percent(value)
                districts_indicators[name][indicator_key] = value

        region_indicators = districts_indicators.pop(regional_name)
        regional_score = _get_scores(sheet, cell)
        regions[regional_name] = {**region_indicators, **regional_score}
        # Find district box
        # start juste after the region
        col_district = sheet.get_line_start(cell[0], cell[1] + 2)
        for row_num, col_num, district_name in col_district:
            if not district_name:
                continue
            district_scores = _get_scores(sheet, (row_num, col_num - 1))
            districts[district_name] = {**district_scores, "region": regional_name}

        # merge both dict
        for district_name, values in districts_indicators.items():
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


# Layout of surge spreadsheet, there is only one worksheet
# one row per country and one indicator per column: e.g
# country name | Total surge approved - WHO | Total Surge Recruited -WHO
# ALGERIA      | 5                          | 3
# In surge spreadsheet. Which indicator is on which column
SURGE_KEY_COL = {
    "who_recruitment": 2,  # Total Surge Approved -WHO
    "who_completed_recruitment": 3,  # Total Surge Recruited -WHO
    "unicef_recruitment": 6,  # Total Surge Approved -UNICEF
    "unicef_completed_recruitment": 7,  # Total Surge Recruited -UNICEF
}


def surge_indicator_for_country(cs: CachedSpread, country_name):
    r = {"title": cs.title}

    sheet = cs.worksheets()[0]
    cell = sheet.find(country_name)
    if not cell:
        raise Exception("Country not found in spreadsheet")
    row_num = cell[0]

    for key, col_num in SURGE_KEY_COL.items():
        value = sheet.get_rc(row_num, col_num)
        r[key] = value
    return r
