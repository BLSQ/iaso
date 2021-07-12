from plugins.polio.preparedness.client import get_client


def create_spreadsheet(title):
    client = get_client()
    spreadsheet = client.create(title)
    spreadsheet.share(None, perm_type='anyone', role='writer')
    return spreadsheet
