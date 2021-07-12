import os

from plugins.polio.preparedness.client import get_client
from plugins.polio.preparedness.exceptions import TemplateNotFound


PREPAREDNESS_TEMPLATE_ID = os.environ.get("PREPAREDNESS_TEMPLATE_ID", None)


def create_spreadsheet(title):
    if not PREPAREDNESS_TEMPLATE_ID:
        raise TemplateNotFound()
    client = get_client()
    spreadsheet = client.copy(PREPAREDNESS_TEMPLATE_ID, title, copy_permissions=True)
    spreadsheet.share(None, perm_type='anyone', role='writer')
    return spreadsheet
