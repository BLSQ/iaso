import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import base64
import os
import json

DIRNAME = os.path.dirname(__file__)
SCOPES = ["https://spreadsheets.google.com/feeds"]


class InvalidFormatError(Exception):
    pass


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


def _get_scores(worksheet, initial_cell):
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

    [
        planning_coordination_financing_score,
        training_sias_score,
        monitoring_supervision_score,
        vaccine_cold_chain_logistics_score,
        advocacy_social_mob_commu_score,
        adverse_event_score,
        status_score,
    ] = worksheet.range(first_row, first_col, last_row, last_col)

    return {
        "planning_score": parse_value(planning_coordination_financing_score.value),
        "training_score": parse_value(training_sias_score.value),
        "monitoring_score": parse_value(monitoring_supervision_score.value),
        "vaccine_score": parse_value(vaccine_cold_chain_logistics_score.value),
        "advocacy_score": parse_value(advocacy_social_mob_commu_score.value),
        "adverse_score": parse_value(adverse_event_score.value if bool(status_score.value) else "0"),
        "status_score": parse_value(status_score.value if bool(status_score.value) else adverse_event_score.value),
    }


def get_national_level_preparedness(sheet: gspread.Spreadsheet):
    for worksheet in sheet.worksheets():
        try:
            cell = worksheet.find("Summary of National Level Preparedness")
            print(f"Data found on worksheet: {worksheet.title}")
            return _get_scores(worksheet, cell)

        except gspread.CellNotFound:
            print(f"No data found on worksheet: {worksheet.title}")
    raise InvalidFormatError("Summary of National Level Preparedness` was not found in this document")


def get_regional_level_preparedness(sheet):
    regions = {}
    districts = {}

    for worksheet in sheet.worksheets():
        try:
            cell = worksheet.find("Summary of Regional Level Preparedness")
            print(f"Data found on worksheet: {worksheet.title}")
            regional_cell = worksheet.cell(cell.row, cell.col + 1)
            print(f"Processing region {regional_cell.value}")
            regions[regional_cell.value] = _get_scores(worksheet, cell)

            district = worksheet.cell(regional_cell.row, regional_cell.col + 1)
            while district.value is not None and bool(district.value.strip()):
                districts[district.value] = {**_get_scores(worksheet, district), "region": regional_cell.value}
                district = worksheet.cell(district.row, district.col + 1)

        except gspread.CellNotFound:
            print(f"No data found on worksheet: {worksheet.title}")
    if not regions:
        raise InvalidFormatError("Summary of National Level Preparedness` was not found in this document")
    return {"regions": regions, "district": districts}
