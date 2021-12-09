"""Generation of the Preparedness Google Sheet

Use a template configured in polio.Config preparedness_template_id
"""
import gspread
from gspread.utils import rowcol_to_a1, Dimension, a1_range_to_grid_range

from plugins.polio.preparedness.client import get_client, get_google_config

from logging import getLogger

logger = getLogger(__name__)

# you need to create a polio.Config object with this key in the DB
PREPAREDNESS_TEMPLATE_CONFIG_KEY = "preparedness_template_id"
TEMPLATE_VERSION = "v3"


def create_spreadsheet(title: str, lang: str):
    client = get_client()
    config = get_google_config(PREPAREDNESS_TEMPLATE_CONFIG_KEY)
    if lang not in ("EN", "FR"):
        # We allow it for future dev but display an error to avoid carelessly adding new language
        logger.error("Unsupported lang for preparedness template")
    if TEMPLATE_VERSION not in config:
        raise Exception(f"Template config for {TEMPLATE_VERSION} not found")

    template = config[TEMPLATE_VERSION].get(lang.lower())

    if not template:
        raise Exception(f"Template for {lang} and version {TEMPLATE_VERSION} not found")
    logger.info(f"Creating spreadsheet {title} from {template}")

    spreadsheet = client.copy(template, title, copy_permissions=True)
    spreadsheet.share(None, perm_type="anyone", role="writer")
    return spreadsheet


def update_national_worksheet(sheet: gspread.Worksheet, country=None, payment_mode="", vacine=""):
    country_name = country.name if country else ""
    updates = [
        {"range": "C4", "values": [[payment_mode]]},
        {"range": "C11", "values": [[vacine]]},
        {"range": "C6", "values": [[country_name]]},
    ]

    sheet.batch_update(updates)


def duplicate_cells(sheet, template_range, num_time):
    """Duplicate cells vertically to the right"""
    copy_range = a1_range_to_grid_range(template_range)

    if not copy_range["startColumnIndex"] == copy_range["endColumnIndex"] - 1:
        raise Exception("Not only we support a vertical range on the same col")

    copy_range["sheetId"] = sheet.id
    paste_range = {
        "sheetId": sheet.id,
        "startRowIndex": copy_range["startRowIndex"],
        "endRowIndex": copy_range["endRowIndex"],
        "startColumnIndex": copy_range["startColumnIndex"] + 1,
        "endColumnIndex": copy_range["endColumnIndex"] + num_time,
    }
    body = {
        "requests": [
            {
                "insertRange": {
                    "range": paste_range,
                    "shiftDimension": Dimension.cols,
                },
            },
            {
                "copyPaste": {
                    "source": copy_range,
                    "destination": paste_range,
                    "pasteType": "PASTE_NORMAL",
                    "pasteOrientation": "NORMAL",
                },
            },
        ]
    }

    sheet.spreadsheet.batch_update(body)


def update_regional_worksheet(sheet: gspread.Worksheet, region_name: str, region_districts):
    district_names = [d.name for d in region_districts]
    num_district = len(district_names)
    district_name_range = f"{rowcol_to_a1(7, 6)}:{rowcol_to_a1(7, 6 + num_district)}"
    print("district_name_range")
    updates = [{"range": "c4", "values": [[region_name]]}, {"range": district_name_range, "values": [district_names]}]
    # Make the column for district
    # General
    duplicate_cells(sheet, "E6:E54", num_district)
    # Summary
    duplicate_cells(sheet, "C64:C72", num_district)

    sheet.batch_update(updates, value_input_option="USER_ENTERED")
