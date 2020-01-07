'''
Import cases files
------------------

The ``import_cases`` module can import cases data from MS Access MDB files
and Sense HAT mobile app backup files.

'''

import logging
from typing import Dict, List, Union, cast

from django.utils.translation import ugettext as _

from hat.cases.event_log import EventFile, EventStats, log_cases_file_import, cases_file_exists
from hat.common.typing import JsonType
from hat.sync.models import JSONDocument
from .errors import ImportStage, ImportStageException, get_import_error
from .extract import extract_file_data, prepare_mdb_data, prepare_mobile_data
from .load import load_cases_into_db
from .transform import transform_source
from .typing import ImportResult
from .utils import hash_file

logger = logging.getLogger(__name__)


def import_cases_file(orgname: str, filename: str) -> ImportResult:
    '''
    Import a cases file.

    Supported files are MS Access MDB with HAT Historic schema and Pharmacovigilance schema,
    as well as HAT mobile app backup files.

    The returned dict will contain information about how many records were imported
    or any errors that happened.
    '''

    result: ImportResult = {
        'typename': None,
        'orgname': orgname,
        'filename': filename,
        'error': None,
        'stats': None
    }
    file_hash = hash_file(filename)
    try:
        if cases_file_exists(file_hash):
            err_msg = _('This file has already been uploaded: {}').format(orgname)
            raise ImportStageException(err_msg, ImportStage.exists)

        (source_type, data) = extract_file_data(filename)
        stats = import_cases_data(source_type, orgname, data, file_hash)
        result['stats'] = stats
        result['typename'] = _(source_type)

    except Exception as ex:
        logger.exception(str(ex))
        result['error'] = get_import_error(ex)

    else:
        file = EventFile(
            name=orgname,
            hash=file_hash,
            contents=data
        )
        log_cases_file_import(stats, file, source_type)
    return result


def save_documents(t_cards, file_hash, type="participant"):
    # Save the data into individual JSONDocuments
    for index, row in t_cards.iterrows():
        doc_id = f"{file_hash}-{index}"
        clean_doc = row.dropna()

        json_doc, document_created = JSONDocument.objects.get_or_create(
            doc_id=doc_id, doc_revision="", type=type,
            defaults={'doc': clean_doc.to_dict()}
        )

        # We can't modify row because it's from the iterator, so:
        t_cards.loc[index, 'json_document_id'] = json_doc.id


def import_historic_data(orgname: str, tables: Dict[str, str], file_hash: str) -> EventStats:
    extracted = prepare_mdb_data('historic', tables)
    save_documents(extracted.get("T_CARDS"), file_hash, "historic")
    transformed = transform_source('historic', extracted)

    # The name of uploaded historic files should contain
    # the entry_name and we parse it from the filename.
    parts = orgname.split('-')
    parts.pop()
    entry_name = ' '.join(parts)
    transformed['entry_name'] = entry_name
    return load_cases_into_db(transformed)


def import_pv_data(tables: Dict[str, str]) -> EventStats:
    extracted = prepare_mdb_data('pv', tables)
    transformed = transform_source('pv', extracted)
    return load_cases_into_db(transformed)


def import_backup_data(docs: List[JsonType]) -> EventStats:
    extracted = prepare_mobile_data(docs)
    transformed = transform_source('backup', extracted)
    return load_cases_into_db(transformed)


def import_cases_data(source_type: str,
                      orgname: str,
                      data: Union[Dict[str, str], List[JsonType]],
                      file_hash: str) -> EventStats:
    if source_type == 'historic':
        return import_historic_data(orgname, cast(Dict[str, str], data), file_hash)
    elif source_type == 'pv':
        return import_pv_data(cast(Dict[str, str], data))
    elif source_type == 'backup':
        return import_backup_data(cast(List[JsonType], data))
    else:
        raise TypeError('Unknown source type: {}'.format(source_type))
