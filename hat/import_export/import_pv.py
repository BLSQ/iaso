from typing import Dict
import logging
import pandas
from pandas import DataFrame
from hat.common.mdb import extract_mdbtable_via_db
from .load import load_into_db, store_file
from .utils import capitalize, create_documentid, groupreduce
from hat.import_export.errors import handle_import_stage, ImportStage, ImportStageException

'''
Extraction, transformation and loading of the Pharmacovigilance MDB files.
'''

logger = logging.getLogger(__name__)

PV_TABLE_NAME = 'tblFishedeDeclaration'


@handle_import_stage(ImportStage.extract)
def extract(mdb_file: str) -> Dict[str, DataFrame]:
    return {
        'forms': extract_mdbtable_via_db(mdb_file, PV_TABLE_NAME),
        'followups': extract_mdbtable_via_db(mdb_file, 'tblSuivi'),
        'treatments': extract_mdbtable_via_db(mdb_file, 'tblTraitementPrescrit'),
    }


@handle_import_stage(ImportStage.transform)
def transform(tables: Dict[str, DataFrame]):
    # Reduce related tables and join them into the forms
    red_followups = groupreduce(tables['followups'], 'PersId') #sortby
    red_treatments = groupreduce(tables['treatments'], 'PersID') #sortby
    source = pandas.merge(tables['forms'], red_followups,
                          how='left', left_on='PersID', right_index=True)
    source = pandas.merge(source, red_treatments,
                          how='left', left_on='PersID', right_index=True)
    result = DataFrame()

    '''
    groupreduce stuff

    Forms
    | id | name | test |
    |  1 | xxx  | xxx  |

    Followups
    | id | outcome |  foo   |
    |  1 | alive   |  42    |
    |  1 | dead    |  null  |

    ===>
    | id | outcome | foo |
    |  1 | dead    | 42  |


    Forms+Folloups
    | id | name | test | outcome |
    |  1 | xxx  | xxx  | alive   |
    '''

    result['document_date'] = source['Date_de_diagnostique']
    result['mobile_unit'] = source['UM'].apply(capitalize)

    # Centre recommandé2 OR Centre recommandé
    result['treatment_center'] = source['Centre_recommandé2']

    # In traitment table: Date début réel
    result['treatment_start_date'] = source['Date_début_réel']
    # In traitment table: Date fin
    result['treatment_end_date'] = source['Date_fin']
    # Traitement Prescrit2 AND Traitement Prescrit specifique2
    result['treatment_prescribed'] = source['Traitement_Prescrit2']

    # In traitment table: Effets Secondaires?
    result['treatment_secondary_effects'] = source['Effets_Secondaires_'] == 'Oui'
    # TODO
    # result['treatment_result'] =

    result['name'] = source['Nom']
    result['lastname'] = source['Postnom']
    result['prename'] = source['Prénom']

    def parse_sex(x):
        return {'Feminin': 'female', 'Masculin': 'male'}.get(x, None)
    result['sex'] = source['Sexe'].apply(parse_sex)

    result['age'] = source['Age']
    result['year_of_birth'] = source['Année_de_naissance']
    result['mothers_surname'] = source['Nom_de_la_mère']

    # cs = transform_participants(tables['forms'])
    # ts = transform_tests(tables['form'])
    # result = pandas.concat([cs, ts], axis=1)
    # print('source')

    result['hat_id'] = 'TODO' #source['ID']
    result['document_id'] = result.apply(create_documentid, axis=1)
    return result


def import_pv(orgname: str, filename: str, store=False):
    logger.info('Importing pharmacovigilance file: ' + orgname)
    stats = {
        'type': 'pv_import',
        'version': 1,
        'orgname': orgname,
        'filename': filename,
        'stored': store,
        'num_total': 0,
        'num_imported': 0,
        'errors': [],
    }
    try:
        e = extract(filename)
        t = transform(e)
        l = load_into_db(t)
        stats['num_total'] = len(e['forms'])
        stats['num_imported'] = len(l)
        if store:
            store_id = store_file(stats.copy(), filename, 'application/x-msaccess')
            stats['store_id'] = store_id
    except ImportStageException as exc:
        stats['errors'].append({'stage': exc.stage.name, 'message': str(exc)})
        logger.exception(exc)
    except Exception as exc:
        stats['errors'].append({'stage': ImportStage.other.name, 'message': str(exc)})
        logger.exception(exc)
    return stats
