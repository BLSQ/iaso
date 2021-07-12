import os

import gspread

from plugins.polio.preparedness.client import get_client

PREPAREDNESS_TEMPLATE_ID = os.environ.get("PREPAREDNESS_TEMPLATE_ID", None)


def create_spreadsheet(title: str):
    client = get_client()
    spreadsheet = client.copy(PREPAREDNESS_TEMPLATE_ID, title, copy_permissions=True)
    spreadsheet.share(None, perm_type='anyone', role='writer')
    return spreadsheet


def update_national_worksheet(sheet: gspread.Worksheet, **kwargs):
    updates = [
        {'range': 'C4', 'values': [[kwargs.get('payment_mode', '')]]},
        {'range': 'C11', 'values': [[kwargs.get('vacine', '')]]},
        {'range': 'C6', 'values': [[kwargs.get('country', '')]]},
    ]

    sheet.batch_update(updates)
