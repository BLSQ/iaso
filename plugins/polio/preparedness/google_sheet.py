import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import base64
import os
import json

DIRNAME = os.path.dirname(__file__)
SCOPES = ["https://spreadsheets.google.com/feeds"]


def _get_client():
    encoded_config = os.environ.get("GOOGLE_API_KEY_BASE64")
    decoded_config = base64.b64decode(encoded_config)
    data = json.loads(decoded_config)
    creds = ServiceAccountCredentials.from_json_keyfile_dict(data, SCOPES)
    return gspread.authorize(creds)


def get_national_level_preparedness_by_url(spreadsheet_url):
    client = _get_client()
    sheet = client.open_by_url(spreadsheet_url)
    return get_national_level_preparedness(sheet)


def get_national_level_preparedness(sheet):
    for worksheet in sheet.worksheets():
        try:
            cell = worksheet.find("Summary of National Level Preparedness")
            print(f"Data found on worksheet: {worksheet.title}")
            overall_scores = worksheet.cell(cell.row, cell.col + 1)
            planning_coordination_financing_score = worksheet.cell(overall_scores.row + 1, overall_scores.col)
            training_sias_score = worksheet.cell(
                planning_coordination_financing_score.row + 1, planning_coordination_financing_score.col
            )
            monitoring_supervision_score = worksheet.cell(training_sias_score.row + 1, training_sias_score.col)
            vaccine_cold_chain_logistics_score = worksheet.cell(
                monitoring_supervision_score.row + 1, monitoring_supervision_score.col
            )
            advocacy_social_mob_commu_score = worksheet.cell(
                vaccine_cold_chain_logistics_score.row + 1, vaccine_cold_chain_logistics_score.col
            )
            adverse_event_score = worksheet.cell(
                advocacy_social_mob_commu_score.row + 1, advocacy_social_mob_commu_score.col
            )
            status_score = worksheet.cell(adverse_event_score.row + 1, adverse_event_score.col)

            return {
                "planning_score": planning_coordination_financing_score.value,
                "training_score": training_sias_score.value,
                "monitoring_score": monitoring_supervision_score.value,
                "vaccine_score": vaccine_cold_chain_logistics_score.value,
                "advocacy_score": advocacy_social_mob_commu_score.value,
                "adverse_score": adverse_event_score.value,
                "status_score": status_score.value,
            }

        except gspread.CellNotFound:
            print(f"No data found on worksheet: {worksheet.title}")
    raise Exception("`Summary of National Level Preparedness` was not found in this document")
