from django.template.defaultfilters import truncatechars
from typing import Dict

FILETYPE = 'filetype'
READFILE = 'readfile'
INSERT = 'insert'
COUCHDB = 'couchdb'

messages = {
    FILETYPE: 'Unknown file type, only .mdb, .accdb and .enc accepted',
    READFILE: 'Could not read file for import',
    INSERT: 'File is missing values, can not be automatically imported',
    COUCHDB: 'Could not store file for re-import'
}


def error_helper(err: Dict[str, str]) -> Dict[str, str]:
    '''tries to return a user friendly error message, and the full message in a dict'''
    origin = err['origin']
    message = err['message']

    if origin in messages:
        short_message = messages[origin]
    else:
        short_message = truncatechars(message, 60)

    return {
        'type': origin,
        'full_message': message,
        'short_message': short_message
    }
