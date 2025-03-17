"""Generation of the Preparedness Google Sheet for a Campaign

Use a template configured in polio.Config preparedness_template_id.

The general logic is that we copy a template Spreadsheet file stored in Google Spreadsheet,
and we adapt the value for the particular campaign we are generating to.
We copy the Regional worksheet for each region in the Campaign scope, then add a column for each district.
"""

import copy

from logging import getLogger
from typing import Optional

import gspread  # type: ignore

from django.contrib.sites.shortcuts import get_current_site
from django.utils.translation import gettext_lazy as _
from gspread.utils import Dimension, a1_range_to_grid_range, rowcol_to_a1  # type: ignore
from rest_framework import exceptions

from hat.__version__ import VERSION
from iaso.models import OrgUnit
from plugins.polio.models import Campaign, CountryUsersGroup
from plugins.polio.preparedness.client import get_client, get_google_config


logger = getLogger(__name__)

# you need to create a polio.Config object with this key in the DB
PREPAREDNESS_TEMPLATE_CONFIG_KEY = "preparedness_template_id"
TEMPLATE_VERSION = "v3.3"


def get_config_for_country(config, country):
    config = get_google_config(PREPAREDNESS_TEMPLATE_CONFIG_KEY)
    if str(country.id) in config:
        return config[str(country.id)], str(country.id)
    if TEMPLATE_VERSION not in config:
        raise Exception(f"Template config for {TEMPLATE_VERSION} not found")
    return config[TEMPLATE_VERSION], TEMPLATE_VERSION


def create_spreadsheet(title: str, lang: str, config_for_country):
    client = get_client()
    if lang not in ("EN", "FR", "PT"):
        # We allow it for future dev but display an error to avoid carelessly adding new language
        logger.error("Unsupported lang for preparedness template")
    template = config_for_country.get(lang.lower())
    logger.info(f"Creating spreadsheet {title} from {template}")

    spreadsheet = client.copy(template, title)
    logger.info(f"Created spreadsheet {spreadsheet.url}")
    spreadsheet.share(None, perm_type="anyone", role="writer", with_link=True)
    return spreadsheet


def update_national_worksheet(sheet: gspread.Worksheet, vaccines: str, country=None, payment_mode=""):
    country_name = country.name if country else ""
    updates = [
        {"range": "C4", "values": [[payment_mode]]},
        {"range": "C11", "values": [[vaccines]]},
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


def setup_multilingual_sheets(config_for_country, campaign):
    # Setup alt configs for bilingual spreadsheets
    alt_configs = config_for_country.get("replace", None)
    # template sheets for alternate langauges. key = language code, eg: "fr" (lower case)
    alt_sheets = {} 
    # key = region org unit id, value = language code. Used to find which language to apply when looping through regions
    alt_regions = {}
    # key = region org unit id, value = name to use in worksheet title instead of region.name (which is in the default language)
    alt_names = {}
    if alt_configs is not None:
      #Generate alt spreadsheets to copy from
      for alt_lang in alt_configs.keys():
          alt_sheets[alt_lang] = create_spreadsheet(campaign.obr_name, alt_lang.upper(), config_for_country)
      for key,value in alt_configs.items():
          for config in value :
              alt_regions[config["id"]]=key
              alt_names[config["id"]] = config["name"]
    # List for easier looping
    alt_regions_list = alt_regions.keys()
    return alt_sheets, alt_regions, alt_names, alt_regions_list

def import_alt_worksheet(region,spreadsheet, alt_regions, alt_sheets, alt_names):
    alt_lang = alt_regions[region.id]
    alt_spreadsheet = alt_sheets[alt_lang]
    alt_regional_template_worksheet = alt_spreadsheet.worksheet("Regional")
    alt_meta = alt_spreadsheet.fetch_sheet_metadata()
    alt_template_range = alt_meta["sheets"][alt_regional_template_worksheet.index]["protectedRanges"] 
    copied_sheet_dict = copy_worksheet_to_spreadsheet(alt_regional_template_worksheet, spreadsheet.id)
    copied_sheet = spreadsheet.get_worksheet_by_id(copied_sheet_dict["sheetId"])
    copied_sheet.update_title(alt_names[region.id])
    copy_protected_range_to_sheet(alt_template_range,copied_sheet)
    return copied_sheet

def update_regional_worksheet(sheet: gspread.Worksheet, region_name: str, region_districts, config_for_country):
    general_cells = config_for_country.get("general", "E6:E70")
    summary_cells = config_for_country.get("summary", "C73:C79")
    district_names = [d.name for d in region_districts]
    num_district = len(district_names)
    district_name_range = f"{rowcol_to_a1(7, 6)}:{rowcol_to_a1(7, 6 + num_district)}"
    updates = [{"range": "c4", "values": [[region_name]]}, {"range": district_name_range, "values": [district_names]}]
    # Make a columns for each district
    # General
    duplicate_cells(sheet, general_cells, num_district)  # E6:E66
    # Summary
    duplicate_cells(sheet, summary_cells, num_district)  # C69:C75

    sheet.batch_update(updates, value_input_option="USER_ENTERED")


def copy_worksheet_to_spreadsheet(source_worksheet, destination_spreadsheet_id):
    return source_worksheet.copy_to(destination_spreadsheet_id)
    
    
# Google Sheet don't automatically copy the protected ranges when duplicating a sheet, so we do it by hand
def copy_protected_range_to_sheet(template_protected_ranges, new_sheet):
    new_sheet_id = new_sheet.id
    new_protected_ranges = []
    for template_protected_range in template_protected_ranges:
        new_protected_range = copy.deepcopy(template_protected_range)
        del new_protected_range["protectedRangeId"]
        # Parameter "requestingUserCanEdit" is read only
        if "requestingUserCanEdit" in new_protected_range:
            del new_protected_range["requestingUserCanEdit"]
        # Editor property not allowed in warningOnly protection
        #  The original editors list from the template is keep otherwise the protection is listed but don't actually
        #  prevent edition. Seems a bug in Google Sheet, probably related to the fact that the new owner is a Service
        #  Account.
        if new_protected_range.get("warningOnly"):
            if "editors" in new_protected_range:
                del new_protected_range["editors"]
        new_protected_range["range"]["sheetId"] = new_sheet_id
        if "unprotectedRanges" in new_protected_range:
            for unprotected_range in new_protected_range["unprotectedRanges"]:
                unprotected_range["sheetId"] = new_sheet_id
        new_protected_ranges.append(new_protected_range)
    # Return requests, don't execute them in order to batch execute all of them at the end
    requests = []
    for pr in new_protected_ranges:
        requests.append({"addProtectedRange": {"protectedRange": pr}})
    return requests


def get_region_from_district(districts):
    # May not be the most efficient
    return OrgUnit.objects.filter(id__in=districts.values_list("parent_id", flat=True).distinct())


def generate_spreadsheet_for_campaign(campaign: Campaign, round_number: Optional[int]):
    lang = "EN"

    try:
        country = campaign.country
        if not country:
            exceptions.ValidationError({"message": _("No country found for campaign")})
        cug = CountryUsersGroup.objects.get(country=country)
        lang = cug.language
    except Exception as e:
        logger.exception(e)
        logger.error(f"Could not find template language for {campaign}")
    config = get_google_config(PREPAREDNESS_TEMPLATE_CONFIG_KEY)
    config_for_country, template_version = get_config_for_country(config=config, country=country)
    spreadsheet = create_spreadsheet(campaign.obr_name, lang, config_for_country)
    
    alt_sheets, alt_regions, alt_names, alt_regions_list = setup_multilingual_sheets(config_for_country,campaign)
    
    # README worksheet
    # set some meta data for debugging
    domain = get_current_site(None).domain
    spreadsheet.sheet1.batch_update(
        [
            {"range": "A28", "values": [[domain]]},
            {"range": "B28", "values": [[VERSION]]},
            {"range": "B29", "values": [[template_version]]},
        ]
    )
    # National worksheet
    update_national_worksheet(
        spreadsheet.worksheet("National"),
        vaccines=campaign.vaccines_extended,
        payment_mode=campaign.payment_mode,
        country=campaign.country,
    )
    
    # Regional worksheet
    regional_template_worksheet = spreadsheet.worksheet("Regional")
    meta = spreadsheet.fetch_sheet_metadata()
    template_range = meta["sheets"][regional_template_worksheet.index]["protectedRanges"]  # regional_template_worksheet
    batched_requests = []
    districts = campaign.get_districts_for_round_number(round_number)
    regions = get_region_from_district(districts)
   
    current_index = 2
    for index, region in enumerate(regions):
        if region.id in alt_regions_list:
           imported_sheet = import_alt_worksheet(region,spreadsheet, alt_regions, alt_sheets, alt_names)
           update_regional_worksheet(imported_sheet, region.name, region_districts, config_for_country)
        else: 
            regional_worksheet = regional_template_worksheet.duplicate(current_index, None, region.name)
            batched_requests += copy_protected_range_to_sheet(template_range, regional_worksheet)
            region_districts = districts.filter(parent=region)
            update_regional_worksheet(regional_worksheet, region.name, region_districts, config_for_country)
        current_index += 1
    spreadsheet.batch_update({"requests": batched_requests})
    spreadsheet.del_worksheet(regional_template_worksheet)
    return spreadsheet
