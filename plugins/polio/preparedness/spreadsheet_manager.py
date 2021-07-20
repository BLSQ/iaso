import os
from typing import List

import gspread
from gspread.utils import rowcol_to_a1
from gspread_formatting import get_conditional_format_rules, ConditionalFormatRule, GridRange, format_cell_ranges

from plugins.polio.preparedness.client import get_client
from plugins.polio.preparedness.conditional_formatting import (
    DARK_YELLOW,
    LIGHT_YELLOW,
    LIGHT_GREEN,
    DARK_GREEN,
    get_between_rule,
    NOT_BLANK,
    IS_BLANK,
    PERCENT_FORMAT,
    TEXT_CENTERED,
)

PREPAREDNESS_TEMPLATE_ID = os.environ.get("PREPAREDNESS_TEMPLATE_ID", None)


def create_spreadsheet(title: str):
    client = get_client()
    spreadsheet = client.copy(PREPAREDNESS_TEMPLATE_ID, title, copy_permissions=True)
    spreadsheet.share(None, perm_type="anyone", role="writer")
    return spreadsheet


def update_national_worksheet(sheet: gspread.Worksheet, country=None, **kwargs):
    country_name = country.name if country else ""
    updates = [
        {"range": "C4", "values": [[kwargs.get("payment_mode", "")]]},
        {"range": "C11", "values": [[kwargs.get("vacine", "")]]},
        {"range": "C6", "values": [[country_name]]},
    ]

    sheet.batch_update(updates)


def update_regional_worksheet(sheet: gspread.Worksheet, region_name: str, region_districts):
    updates = [
        {"range": "c4", "values": [[region_name]]},
    ]

    rules = get_conditional_format_rules(sheet)
    rules.clear()

    for idx, district in enumerate(region_districts):
        col_index = 7 + idx
        sheet.insert_cols([[]], col_index)
        first_district_cell = rowcol_to_a1(7, col_index)
        district_name_cell = f"={first_district_cell}"

        updates += [
            generate_planning_coord_funding_section(col_index, district),
            generate_training_section(col_index, district_name_cell),
            generate_monitoring_section(col_index, district_name_cell),
            generate_vaccine_logistics_section(col_index, district_name_cell),
            generate_advocacy_section(col_index, district_name_cell),
            generate_adverse_section(col_index, district_name_cell),
        ]

    final_column = 6 + region_districts.count()
    summary_range_a1 = [
        f"F11:{rowcol_to_a1(11, final_column)}",
        f"F24:{rowcol_to_a1(24, final_column)}",
        f"F30:{rowcol_to_a1(30, final_column)}",
        f"F40:{rowcol_to_a1(40, final_column)}",
        f"F50:{rowcol_to_a1(50, final_column)}",
        f"F58:{rowcol_to_a1(58, final_column)}",
    ]
    district_data_range = [
        f"F7:{rowcol_to_a1(10, final_column)}",
        f"F16:{rowcol_to_a1(16, final_column)}",
        f"F28:{rowcol_to_a1(29, final_column)}",
        f"F35:{rowcol_to_a1(37, final_column)}",
        f"F39:{rowcol_to_a1(39, final_column)}",
        f"F44:{rowcol_to_a1(49, final_column)}",
        f"F55:{rowcol_to_a1(56, final_column)}",
    ]

    ranges = [GridRange.from_a1_range(data, sheet) for data in district_data_range]

    summary_ranges = [GridRange.from_a1_range(range_cell, sheet) for range_cell in summary_range_a1]

    non_blank_ranges = [
        GridRange.from_a1_range(f"F17:{rowcol_to_a1(23, final_column)}", sheet),
        GridRange.from_a1_range(f"F38:{rowcol_to_a1(38, final_column)}", sheet),
        GridRange.from_a1_range(f"F57:{rowcol_to_a1(57, final_column)}", sheet),
    ]

    custom_rules = (
        get_conditional_rules(ranges)
        + get_summary_conditional_rules(summary_ranges)
        + get_non_blank_rules(non_blank_ranges)
    )

    [rules.append(rule) for rule in custom_rules]

    format_cell_ranges(worksheet=sheet, ranges=[(range_cells, PERCENT_FORMAT) for range_cells in summary_range_a1])
    format_cell_ranges(
        worksheet=sheet, ranges=[(range_cells, TEXT_CENTERED) for range_cells in summary_range_a1 + district_data_range]
    )

    sheet.batch_update(updates, value_input_option="USER_ENTERED")
    rules.save()


def generate_planning_coord_funding_section(col_index: int, district):
    return {
        "range": get_range(col_index, 7, 11),
        "values": map_to_column_value(
            [
                district.name,
                "0",
                "0",
                "0",
                get_average_of_range(col_index, 7, 10),
            ]
        ),
    }


def generate_monitoring_section(col_index: int, district_name):
    return {
        "range": get_range(col_index, 27, 30),
        "values": map_to_column_value(
            [
                district_name,
                "0",
                "0",
                get_average_of_range(col_index, 28, 29),
            ]
        ),
    }


def generate_advocacy_section(col_index: int, district_name):
    return {
        "range": get_range(col_index, 43, 50),
        "values": map_to_column_value(
            [
                district_name,
                "0",
                "0",
                "0",
                "0",
                "0",
                "0",
                get_average_of_range(col_index, 44, 45),
            ]
        ),
    }


def generate_adverse_section(col_index: int, district_name):
    return {
        "range": get_range(col_index, 54, 58),
        "values": map_to_column_value(
            [
                district_name,
                "0",
                "0",
                "",
                get_average_of_range(col_index, 55, 56),
            ]
        ),
    }


def generate_vaccine_logistics_section(col_index: int, district_name):
    return {
        "range": get_range(col_index, 34, 40),
        "values": map_to_column_value(
            [
                district_name,
                "0",
                "0",
                "0",
                "",
                "0",
                f"=AVERAGE({get_range(col_index, 35, 37)}, {rowcol_to_a1(39, col_index)})*0.1",
            ]
        ),
    }


def generate_training_section(col_index: int, district_name: str):
    return {
        "range": get_range(col_index, 15, 24),
        "values": map_to_column_value(
            [district_name, "0", None, None, None, None, None, None, None, f"={rowcol_to_a1(16, col_index)}*0.1"]
        ),
    }


def get_average_from(range: str) -> str:
    return f'=AVERAGEIF({range},"<>NA")*0.1'


def get_average_of_range(col_index: int, initial_row: int, final_row: int):
    return get_average_from(get_range(col_index, initial_row, final_row))


def get_conditional_rules(ranges: List[str]) -> List[ConditionalFormatRule]:
    return [
        ConditionalFormatRule(ranges=ranges, booleanRule=get_between_rule(["0", "4"])),
        ConditionalFormatRule(
            ranges=ranges,
            booleanRule=get_between_rule(["5", "8"], text_foreground_color=DARK_YELLOW, background_color=LIGHT_YELLOW),
        ),
        ConditionalFormatRule(
            ranges=ranges,
            booleanRule=get_between_rule(["9", "10"], text_foreground_color=DARK_GREEN, background_color=LIGHT_GREEN),
        ),
    ]


def get_non_blank_rules(ranges: List[str]) -> List[ConditionalFormatRule]:
    return [
        ConditionalFormatRule(ranges=ranges, booleanRule=NOT_BLANK),
        ConditionalFormatRule(ranges=ranges, booleanRule=IS_BLANK),
    ]


def get_summary_conditional_rules(ranges: List[str]) -> List[ConditionalFormatRule]:
    return [
        ConditionalFormatRule(ranges=ranges, booleanRule=get_between_rule(["0", "0.49"])),
        ConditionalFormatRule(
            ranges=ranges,
            booleanRule=get_between_rule(
                ["0.5", "0.79"], text_foreground_color=DARK_YELLOW, background_color=LIGHT_YELLOW
            ),
        ),
        ConditionalFormatRule(
            ranges=ranges,
            booleanRule=get_between_rule(
                ["0.8", "1.0"], text_foreground_color=DARK_GREEN, background_color=LIGHT_GREEN
            ),
        ),
    ]


def map_to_column_value(data: List[str]) -> List[List[str]]:
    return [[value] for value in data]


def get_range(column, initial_row, final_row):
    return f"{rowcol_to_a1(initial_row, column)}:{rowcol_to_a1(final_row, column)}"
