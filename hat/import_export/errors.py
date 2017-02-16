from typing import Dict
from enum import Enum
from functools import wraps
from django.template.defaultfilters import truncatechars
from django.utils.translation import ugettext as _


class ImportStage(Enum):
    filetype = 1
    extract = 2
    transform = 3
    load = 4
    store = 5
    exists = 6
    other = 99


class ImportStageException(Exception):
    def __init__(self, message: str, stage: ImportStage):
        super(Exception, self).__init__(message)
        self.stage = stage


def handle_import_stage(stage: ImportStage):
    '''Decorator to wrap exceptions in ImportStageExceptions'''
    def decorator(func):
        @wraps(func)
        def func_wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as exc:
                raise ImportStageException(str(exc), stage) from exc
        return func_wrapper
    return decorator


messages = dict([
    (ImportStage.filetype.name, _('Unknown file type. Only .mdb, .accdb and .enc accepted')),
    (ImportStage.extract.name, _('Could not extract data from file for import')),
    (ImportStage.transform.name, _('File is missing values, can not be automatically imported')),
    (ImportStage.load.name, _('Could not load data into database')),
    (ImportStage.store.name, _('Could not store file for re-import')),
    (ImportStage.exists.name, _('File has already been uploaded')),
    (ImportStage.other.name, _('An unforseen error occurred')),
])


def error_helper(err: Dict[str, dict]) -> Dict[str, dict]:
    '''tries to return a user friendly error message, and the full message in a dict'''
    stage = err['stage']
    message = err['message']

    if stage in messages:
        short_message = messages[stage]
    else:
        short_message = truncatechars(message, 60)

    return {
        'type': stage,
        'full_message': message,
        'short_message': short_message
    }
