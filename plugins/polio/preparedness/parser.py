from enum import Enum
from typing import Optional, Dict, Any

from gspread.utils import absolute_range_name, rowcol_to_a1

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
    "penmarkers_supply": 36,  # date
    "sia_training": 17,
    "sia_micro_planning": 26,
    "communication_sm_fund": 43,
    "communication_sm_activities": 46,  # percent (score for section)
    "communication_c4d": 45,  # date
    "aefi_easi_protocol": 51,
    "pharmacovigilance_committee": 50,
}


indicators = [
    (1, "operational_fund", "Operational funds", "number"),
    (2, "vaccine_and_droppers_received", "Vaccines and droppers received", "number"),
    (3, "vaccine_cold_chain_assessment", "Vaccine cold chain assessment  ", "number"),
    (4, "vaccine_monitors_training_and_deployment", "Vaccine monitors training & deployment  ", "number"),
    (5, "penmarkers_supply", "Penmarkers  ", "number"),
    (6, "sia_training", "Supervisor training & deployment  ", "number"),
    (7, "sia_micro_planning", "Micro/Macro plan  ", "number"),
    (8, "communication_sm_fund", "SM funds --> 2 weeks  ", "number"),
    (9, "communication_sm_activities", "SM activities  ", "percent"),
    (10, "communication_c4d", "C4d", "date"),
    (0, "status_score", "Total score", "percent"),
    # not used atm
    # (0, "training_score", "training_score", "number"),
    # (0, "monitoring_score", "monitoring_score", "number"),
    # (3, "vaccine_score", "vaccine_score", "number"),
    # (4, "advocacy_score", "advocacy_score", "number"),
    # (5, "adverse_score", "adverse_score", "number"),
    # (7, "region", "region", "number"),
]
"sn, key, title, kind"


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


class RoundNumber(str, Enum):
    round1 = "Round1"
    round2 = "Round2"
    unknown = "Unknown"


def get_national_level_preparedness(spread: CachedSpread):
    for worksheet in spread.worksheets():
        if worksheet.is_hidden:
            continue
        cell = worksheet.find_one_of(
            "Summary of National Level Preparedness",
            "Résumé du niveau de préparation au niveau national ",
            "Résumé de la préparation au niveau national",
            "Resumo da preparação em Nível Central",
        )
        if not cell:
            print(f"No national data found on worksheet: {worksheet.title}")
            continue

        print(f"Data found on worksheet: {worksheet.title}")
        kv = worksheet.get_dict_position(NATIONAL_INDICATORS)
        if kv.get("communication_sm_activities"):
            kv["communication_sm_activities"] = from_percent(kv["communication_sm_activities"])
        score = _get_scores(worksheet, cell)
        round_name = worksheet.get_a1("C8")
        if round_name == "Tour 1 / Rnd 1":
            round = RoundNumber.round1
        elif round_name == "Tour 2 / Rnd 2":
            round = RoundNumber.round2
        else:
            round = RoundNumber.unknown

        kv["round"] = round
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
        if sheet.is_hidden:
            continue
        # detect if we are in a Regional Spreadsheet form the title
        # and find position of the total score box
        cell = sheet.find_one_of(
            "Summary of Regional Level Preparedness",
            "Résumé du niveau de préparation",
            "Résumé du niveau de préparation Lomé Commune",
            "Résumé de la préparation au niveau régional",
            "Resumo da preparação em Nível Regional",
            "Summary of district Level Preparedness",
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
        districts_indicators: Dict[str, Any] = {}

        # noinspection SpellCheckingInspection
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


def get_regional_level_preparedness_v2(spread: CachedSpread):
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
        if sheet.is_hidden:
            continue
        # detect if we are in a Regional Spreadsheet form the title
        # and find position of the total score box
        cell = sheet.find_one_of(
            "Summary of Regional Level Preparedness",
            "Résumé du niveau de préparation",
            "Résumé du niveau de préparation Lomé Commune",
            "Résumé de la préparation au niveau régional",
            "Resumo da preparação em Nível Regional",
        )
        if not cell:
            print(f"No regional data found on worksheet: {sheet.title}")
            continue
        print(f"Regional Data found on worksheet: {sheet.title}")

        regional_name_range = absolute_range_name(sheet.title, "regional_name")
        if regional_name_range in spread.range_dict:
            start_region = spread.get_range_row_col(regional_name_range)
        else:
            start_region = sheet.find_formula("=C4")
            if not start_region:
                start_region = sheet.find_formula("=C5")
            if not start_region:
                print(f"start of data for region not found in {sheet.title}, using hard coded")
                start_region = (7, 5)

        print(start_region)
        regional_name = sheet.get_rc(*start_region)
        # for indicators
        # Detect List of districts, and in which column they are
        region_districts = sheet.get_line_start(start_region[0], start_region[1])
        # ignore last column since it is the comments
        region_districts = region_districts[:-1]
        districts_indicators: Dict[str, Any] = {}
        region_indicators: Dict[str, Any] = {}
        for _, indicator_key, _, kind in indicators:
            range_name = f"regional_{indicator_key}"
            regional_name_range = absolute_range_name(sheet.title, range_name)
            if regional_name_range not in spread.range_dict:
                regional_name_range = regional_name_range.replace("!", "_")
            if regional_name_range not in spread.range_dict:
                regional_name_range = range_name
            if regional_name_range not in spread.range_dict:
                for _, _, district_region_name in region_districts:
                    districts_indicators.setdefault(district_region_name, {})[indicator_key] = "Error"

            indicator_row, indicator_col = spread.get_range_row_col(regional_name_range)
            for i, (_, district_col, district_region_name) in enumerate(region_districts):
                # take un-alignement of tables into account (for the score box that don't start on the same column)
                col = (indicator_col - start_region[1]) + district_col
                value = sheet.get_rc(indicator_row, col)
                if kind == "percent":
                    value = from_percent(value)
                if i == 0:  # first column is the region
                    # this new logic avoid the problem where there was a district with the same name as the region
                    region_indicators[indicator_key] = value
                else:
                    districts_indicators.setdefault(district_region_name, {})[indicator_key] = value

        regions[regional_name] = {**region_indicators}
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


def get_national_level_preparedness_v2(spread: CachedSpread):
    for worksheet in spread.worksheets():
        if worksheet.is_hidden:
            continue
        cell = worksheet.find_one_of(
            "Summary of National Level Preparedness",
            "Résumé du niveau de préparation au niveau national ",
            "Résumé de la préparation au niveau national",
            "Resumo da preparação em Nível Central",
        )
        if not cell:
            continue

        print(f"Data found on worksheet: {worksheet.title}")
        kv = {}
        for i, indicator_key, _, kind in indicators:
            range_name = f"national_{indicator_key}"
            rc = spread.get_range_row_col(range_name)
            value = worksheet.get_rc(*rc)
            if kind == "percent":
                value = from_percent(value)
            kv[indicator_key] = value
            print(indicator_key, value, rowcol_to_a1(*rc))

        kv["round"] = RoundNumber.unknown
        return kv
    raise Exception(
        "Summary of National Level Preparedness or Summary of Regional Level Preparedness was not found in this document"
    )


def parse_prepardness_v2(spread: CachedSpread):
    preparedness_data = {
        "national": get_national_level_preparedness_v2(spread),
        **get_regional_level_preparedness_v2(spread),
        "format": "v3.3",
    }
    preparedness_data["totals"] = get_preparedness_score(preparedness_data)
    return preparedness_data


def get_preparedness(spread: CachedSpread):
    #  use New system with named range
    if "national_status_score" in spread.range_dict:
        return parse_prepardness_v2(spread)
    # old system with hard code emplacement
    preparedness_data = {
        "national": get_national_level_preparedness(spread),
        **get_regional_level_preparedness(spread),
    }
    preparedness_data["totals"] = get_preparedness_score(preparedness_data)
    return preparedness_data


# Layout of surge spreadsheet, there is only one worksheet
# one row per country and one indicator per column: e.g.
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
