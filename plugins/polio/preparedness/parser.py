import base64
import json
import os
from plugins.polio.preparedness.quota_manager import QuotaManager
from typing import List
from itertools import groupby
import gspread
from oauth2client.service_account import ServiceAccountCredentials

from plugins.polio.preparedness.exceptions import InvalidFormatError

DIRNAME = os.path.dirname(__file__)
SCOPES = ["https://spreadsheets.google.com/feeds"]


def _get_client():
    encoded_config = os.environ.get("GOOGLE_API_KEY_BASE64")
    decoded_config = base64.b64decode(encoded_config)
    data = json.loads(decoded_config)
    creds = ServiceAccountCredentials.from_json_keyfile_dict(data, SCOPES)
    return gspread.authorize(creds)


def parse_value(value: str):
    try:
        return int(value.replace("%", ""))
    except ValueError:
        return 0


def open_sheet_by_url(spreadsheet_url):
    client = _get_client()
    return client.open_by_url(spreadsheet_url)


def _process_range(range):
    [
        planning_coordination_financing_score,
        training_sias_score,
        monitoring_supervision_score,
        vaccine_cold_chain_logistics_score,
        advocacy_social_mob_commu_score,
        adverse_event_score,
        status_score,
    ] = range

    return {
        "planning_score": parse_value(planning_coordination_financing_score.value),
        "training_score": parse_value(training_sias_score.value),
        "monitoring_score": parse_value(monitoring_supervision_score.value),
        "vaccine_score": parse_value(vaccine_cold_chain_logistics_score.value),
        "advocacy_score": parse_value(advocacy_social_mob_commu_score.value),
        "adverse_score": parse_value(adverse_event_score.value if bool(status_score.value) else "0"),
        "status_score": parse_value(status_score.value if bool(status_score.value) else adverse_event_score.value),
    }


def _get_district_score(data: tuple):
    name, *scores = data

    return name.value, _process_range(scores)


def _get_scores(worksheet, initial_cell, manager: QuotaManager = QuotaManager()):
    """
    The scores are fetched using [A1 Notation](https://developers.google.com/sheets/api/guides/concepts).
    Starting at the "Summary of {Regional|National} Level Preparedness" cell, the scores will be one column ahead and one row below.
    For example, given the summary cell is at A1, the score's range will be B2:B8.

    Regardless type of content (national, regional or district) the summary
    should always have the same structure and the scores must be in this order:

    1. Planning, coordination and funding
    2. Training for SIAs quality
    3. Monitoring and Supervision
    4. Vaccine, cold chain and logistics
    5. Advocacy, social mobilization and communication
    6. Adverse Event Following Immunization (AEFI)*
    Status of preparedness

    * The Adverse Event Following Immunization (AEFI) is not required, when this happens the last value
    in the array will be the status score.
    """

    first_row = initial_cell.row + 1
    first_col = initial_cell.col + 1
    last_row = initial_cell.row + 7
    last_col = first_col

    data_range = worksheet.range(first_row, first_col, last_row, last_col)
    manager.increase()
    return _process_range(data_range)


def get_national_level_preparedness(sheet: gspread.Spreadsheet, manager: QuotaManager = QuotaManager()):
    for worksheet in sheet.worksheets():
        try:
            manager.increase(by=2)
            cell = worksheet.find("Summary of National Level Preparedness")
            print(f"Data found on worksheet: {worksheet.title}")
            return _get_scores(worksheet, cell, manager)

        except gspread.CellNotFound:
            try:
                cell = worksheet.find("Résumé du niveau de préparation au niveau national ")
                print(f"Data found on worksheet: {worksheet.title}")
                return _get_scores(worksheet, cell)
            except gspread.CellNotFound:
                print(f"No data found on worksheet: {worksheet.title}")
    raise InvalidFormatError(
        "Summary of National Level Preparedness`or Summary of Regional Level Preparedness was not found in this document"
    )


def get_regional_level_preparedness(sheet: gspread.Spreadsheet, manager: QuotaManager = QuotaManager()):
    regions = {}
    districts = {}

    for worksheet in sheet.worksheets():
        cell = None
        try:
            manager.increase(by=2)
            cell = worksheet.find("Summary of Regional Level Preparedness")
            print(f"Data found on worksheet: {worksheet.title}")
        except gspread.CellNotFound:
            try:
                cell = worksheet.find("Résumé du niveau de préparation")
                print(f"Data found on worksheet: {worksheet.title}")
            except:
                print(f"No data found on worksheet: {worksheet.title}")

        if cell is not None:
            all_scores = []
            last_cell = cell

            while last_cell is not None and bool(last_cell.value.strip()):
                district_list = worksheet.range(last_cell.row, last_cell.col + 1, last_cell.row + 7, last_cell.col + 20)
                manager.increase()

                all_districts = []
                get_col_f = lambda x: x.col
                for _, group in groupby(sorted(district_list, key=get_col_f), get_col_f):
                    all_districts.append(list(group))
                all_scores += all_districts

                last_district = all_districts[-1]
                last_cell = last_district[0]

            regional, *district_values = all_scores

            regional_name, regional_score = _get_district_score(regional)
            regions[regional_name] = regional_score

            for district in district_values:
                district_name, district_scores = _get_district_score(district)
                districts[district_name] = {**district_scores, "region": regional_name}

    if not regions:
        raise InvalidFormatError("Summary of Regional Level Preparedness` was not found in this document")
    return {"regions": regions, "districts": districts}
