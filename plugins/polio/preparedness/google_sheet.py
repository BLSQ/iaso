from __future__ import print_function
import gspread
from oauth2client.service_account import ServiceAccountCredentials


SCOPES = ['https://spreadsheets.google.com/feeds']
creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', SCOPES)
client = gspread.authorize(creds)


def get_national_level_preparedness(spreadsheet_id):
    sheet = client.open_by_key(spreadsheet_id)

    for worksheet in sheet.worksheets():
        try:
            cell = worksheet.find("Summary of National Level Preparedness")
            print(f"Data found on worksheet: {worksheet.title}")
            overall_scores = worksheet.cell(cell.row, cell.col + 1)
            planning_coordination_financing_score = worksheet.cell(
                                                        overall_scores.row + 1,
                                                        overall_scores.col
                                                    )
            training_sias_score = worksheet.cell(
                                            planning_coordination_financing_score.row + 1,
                                            planning_coordination_financing_score.col
                                    )
            monitoring_supervision_score = worksheet.cell(
                                            training_sias_score.row + 1,
                                            training_sias_score.col
                                    )
            vaccine_cold_chain_logistics_score = worksheet.cell(
                                            monitoring_supervision_score.row + 1,
                                            monitoring_supervision_score.col
                                    )
            advocacy_social_mob_commu_score = worksheet.cell(
                                            vaccine_cold_chain_logistics_score.row + 1,
                                            vaccine_cold_chain_logistics_score.col
                                    )
            adverse_event_score = worksheet.cell(
                                            advocacy_social_mob_commu_score.row + 1,
                                            advocacy_social_mob_commu_score.col
                                    )
            status_score = worksheet.cell(
                                            adverse_event_score.row + 1,
                                            adverse_event_score.col
                                    )

            return {
                "1.Planning, coordination and financing":
                    planning_coordination_financing_score.value,
                "2.Training for SIAs": training_sias_score.value,
                "3.Monitoring and Supervision": monitoring_supervision_score.value,
                "4.Vaccine, cold chain and logistics": vaccine_cold_chain_logistics_score.value,
                "5.Advocacy, social mobilization and communication":
                    advocacy_social_mob_commu_score.value,
                "6. Adverse event following Immunization": adverse_event_score.value,
                "Status of preparedness ": status_score.value,
            }
        except gspread.CellNotFound:
            print(f"No data found on worksheet: {worksheet.title}")
    raise Exception("`Summary of National Level Preparedness` was not found in this document")


if __name__ == '__main__':
    get_national_level_preparedness('1rMMcRd5Nv8-Pgax2CUFwVQrVfBP-HHHrAizK-6xTdZQ')
