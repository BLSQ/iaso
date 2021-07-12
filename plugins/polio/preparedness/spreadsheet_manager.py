import os

from plugins.polio.preparedness.client import get_client

PREPAREDNESS_TEMPLATE_ID = os.environ.get("PREPAREDNESS_TEMPLATE_ID", None)


def create_spreadsheet(title):
    client = get_client()
    spreadsheet = client.copy(PREPAREDNESS_TEMPLATE_ID, title, copy_permissions=True)
    spreadsheet.share(None, perm_type='anyone', role='writer')
    return spreadsheet
