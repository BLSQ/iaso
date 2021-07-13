import os
from typing import List

import gspread
from gspread.utils import rowcol_to_a1

from plugins.polio.preparedness.client import get_client

PREPAREDNESS_TEMPLATE_ID = os.environ.get("PREPAREDNESS_TEMPLATE_ID", None)


def create_spreadsheet(title: str):
    client = get_client()
    spreadsheet = client.copy(PREPAREDNESS_TEMPLATE_ID, title, copy_permissions=True)
    spreadsheet.share(None, perm_type='anyone', role='writer')
    return spreadsheet


def update_national_worksheet(sheet: gspread.Worksheet, **kwargs):
    country_name = kwargs.get('country').name if 'country' in kwargs else ''
    updates = [
        {'range': 'C4', 'values': [[kwargs.get('payment_mode', '')]]},
        {'range': 'C11', 'values': [[kwargs.get('vacine', '')]]},
        {'range': 'C6', 'values': [[country_name]]},
    ]

    sheet.batch_update(updates)


def update_regional_worksheet(sheet: gspread.Worksheet, region_name: str, region_districts):
    updates = [
        {'range': 'c4', 'values': [[region_name]]},
    ]
    for idx, district in enumerate(region_districts):
        col_index = 7 + idx
        sheet.insert_cols([[]], col_index)
        first_district_cell = rowcol_to_a1(7, col_index)
        district_name_cell = f'={first_district_cell}'

        updates += [
            generate_planning_coord_funding_section(col_index, district),
            generate_training_section(col_index, district_name_cell),
            generate_monitoring_section(col_index, district_name_cell),
            generate_vaccine_logistics_section(col_index, district_name_cell),
            generate_advocacy_section(col_index, district_name_cell),
            generate_adverse_section(col_index, district_name_cell),
        ]

    sheet.batch_update(updates, value_input_option='USER_ENTERED')


def generate_planning_coord_funding_section(col_index: int, district):
    return {
        'range': get_range(col_index, 7, 11),
        'values': map_to_column_value([
            district.name,
            '0',
            '0',
            '0',
            get_average_of_range(col_index, 7, 10),
        ])
    }


def generate_monitoring_section(col_index: int, district_name):
    return {
        'range': get_range(col_index, 27, 30),
        'values': map_to_column_value([
            district_name,
            '0',
            '0',
            get_average_of_range(col_index, 28, 29),
        ])
    }


def generate_advocacy_section(col_index: int, district_name):
    return {
        'range': get_range(col_index, 43, 50),
        'values': map_to_column_value([
            district_name,
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            get_average_of_range(col_index, 44, 45),
        ])
    }


def generate_adverse_section(col_index: int, district_name):
    return {
        'range': get_range(col_index, 54, 58),
        'values': map_to_column_value([
            district_name,
            '0',
            '0',
            '',
            get_average_of_range(col_index, 55, 56),
        ])
    }


def generate_vaccine_logistics_section(col_index: int, district_name):
    return {
        'range': get_range(col_index, 34, 40),
        'values': map_to_column_value([
            district_name,
            '0',
            '0',
            '0',
            '',
            '0',
            f'=AVERAGE({get_range(col_index, 35, 37)}, {rowcol_to_a1(39, col_index)})*0.1'
        ])
    }


def generate_training_section(col_index: int, district_name: str):
    return {
        'range': get_range(col_index, 15, 24),
        'values': map_to_column_value([
            district_name,
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            f'={rowcol_to_a1(16, col_index)}*0.1'
        ])
    }


def get_average_from(range: str) -> str:
    return f'=AVERAGEIF({range},"<>NA")*0.1'


def get_average_of_range(col_index: int, initial_row: int, final_row: int):
    return get_average_from(get_range(col_index, initial_row, final_row))


def map_to_column_value(data: List[str]) -> List[List[str]]:
    return [[value] for value in data]


def get_range(column, initial_row, final_row):
    return f'{rowcol_to_a1(initial_row, column)}:{rowcol_to_a1(final_row, column)}'
