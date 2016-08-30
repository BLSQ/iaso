from typing import Dict
import logging
import pandas
from pandas import DataFrame
from hat.common.mdb import extract_mdbtable_via_db
from .load import load_into_db, store_file
from .utils import capitalize, create_documentid, groupreduce, hat_id
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


# These should not be re-used, since they are specific to PharmaCO
def identity(x):
    return x


def get_result(x):
    if pandas.isnull(x):
        return None
    # 0, +, NF
    return x == '+'


def get_catt_blood_result(x):
    if pandas.isnull(x):
        return None
    if x == 'NEG':
        return False
    # POS+, POS++, POS+++
    return True


def get_pl_result(x):
    # convert to same as historic
    return {
        'STADE 1': 'stage1',
        'STADE 2': 'stage2',
        'INCONNU(non faite)': 'unknown'
    }.get(x, None)


def get_pl_liquid_result(x):
    # convert to same as historic
    return {
        'clair': 'clear',
        'trouble': 'unclear',
        'hémorragique': 'hemorrhagic',
    }.get(x, None)


def get_treatment(row: pandas.Series) -> str:
    # Is there a nicer way to do this in python?
    if not row['Traitement_Prescrit2']:
        return None
    if not row['Traitement_Prescrit_specifique2']:
        return row['Traitement_Prescrit2']

    return (
        row['Traitement_Prescrit2'] +
        ' - ' +
        row['Traitement_Prescrit_specifique2']
    )


test_fields = [
    # card test fields
    ("CATT_sang_total", int, 'catt_total_blood', get_catt_blood_result),
    ("CATT_dilution", int, 'catt_dilution', identity),  # already has converted values, 1/32 etc
    ("Suc_ganglionnaire", int, 'lymph_node_puncture', get_result),
    ("Sang_SF", int, 'sf', get_result),
    ("Sang_GE", int, 'ge', get_result),
    ("Sang_W00", int, 'woo', get_result),
    ("Sang_mAECT", int, 'maect', get_result),
    ("LCR", int, 'lcr', get_result),
    ("Aspect_LCR", int, 'pl_liquid', get_pl_liquid_result),
    ("Présence_trypanosomes", str, 'pl_trypanosome', identity),
    ("GB_mm3", str, 'pl_gb_mm3', identity),
    ("Latex_LCR", int, 'pl_lcr', identity),  # already converted
    ("Stade", int, 'pl_result', get_pl_result),

    # followup test fields
    ("PG", str, 'followup_pg', identity),
    ("SF", str, 'followup_sf', identity),
    ("GE", str, 'followup_ge', identity),
    ("Woo", str, 'followup_woo', identity),
    ("mAECT", str, 'followup_maect', identity),
    ("PL_Tryp", str, 'followup_pl_trypanosome', identity),
    ("PL_GB", str, 'followup_pl_gb', identity),
    ("Décision_médicale", str, 'followup_decision', identity),
]


@handle_import_stage(ImportStage.transform)
def transform(tables: Dict[str, DataFrame]):
    # Reduce related tables and join them into the forms
    red_followups = groupreduce(tables['followups'], 'PersId')  # sortby
    red_treatments = groupreduce(tables['treatments'], 'PersID')  # sortby
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

    # META

    result['document_date'] = source['Date_de_diagnostique']
    result['mobile_unit'] = source['UM'].apply(capitalize)

    # Form numbers/month/year
    result['form_number'] = source['Numero_du_cas']
    result['form_month'] = source['Mois']
    result['form_year'] = source['Année']

    # TREATMENT
    result['treatment_center'] = source['Centre_recommandé2']
    result['treatment_start_date'] = source['Date_début_réel']
    result['treatment_end_date'] = source['Date_fin']
    result['treatment_prescribed'] = source.apply(get_treatment, axis=1)

    result['treatment_secondary_effects'] = source['Effets_Secondaires_'] == 'Oui'
    # TODO
    # treatment_result

    # PERSONAL INFO

    result['name'] = source['Nom']
    result['lastname'] = source['Postnom']
    result['prename'] = source['Prénom']

    def parse_sex(x):
        return {'Feminin': 'female', 'Masculin': 'male'}.get(x, None)
    result['sex'] = source['Sexe'].apply(parse_sex)

    result['age'] = source['Age']
    result['year_of_birth'] = source['Année_de_naissance']
    result['mothers_surname'] = source['Nom_de_la_mère']

    # LOCATION
    result['village'] = source['Village'].apply(capitalize)
    result['province'] = source['Provence'].apply(capitalize)
    result['ZS'] = source['ZS'].apply(capitalize)
    result['AZ'] = source['AS'].apply(capitalize)

    # TEST RESULTS & FOLLOWUP
    for (src_col, _, dest_col, f) in test_fields:
        if src_col in source:
            result['test_' + dest_col] = source[src_col].apply(f)

    # the PersID key is different in the different tables
    result['followup_done'] = tables['forms']['PersID'].isin(list(tables['followups']['PersId']))

    # MORE META
    result['source'] = 'pv'
    result['hat_id'] = result.apply(hat_id, axis=1)
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


''' # noqa
Description of the tables:
========


PCV Field Name                                  Our Field Name  Comment

tblFishedeDeclaration
====
PersID                                          ----
ID                                              ----
CT_UM_Nouveau_Fiche                             ----
Prov                                            ----
UM                                              mobile_unit
Numero_du_cas                                   form_number     New field, didn't previously exist in our DB
Mois                                            ----            Skipping, always null, in all 3 files
Année                                           entry_date      Filling in Jan 1 for a complete timestamp, in all 3 files
Identification_Unique                           hat_id          but we generate our own from name, etc
FS                                              ----
Numero                                          ----
Nom                                             name
Postnom                                         lastname
Prénom                                          prename
Sexe                                            sex
Année_de_naissance                              year_of_birth
Nom_de_la_mère                                  mothers_surname
Age                                             age
Etat_Civil                                      ----
Conjoint_e_                                     ----
Nom_du_père                                     ----
Village                                         village
Groupement                                      ----
Secteur                                         ----
Territoire                                      ----
Provence                                        province
ZS                                              ZS
AS                                              AZ
Résident_depuis                                 ----
Résidence_précédentes_1                         ----
de                                              ----
à                                               ----
Résidence_précédentes_2                         ----
de2                                             ----
à2                                              ----
Plaintes_spontanées                             ----
Quelle_plaintes_spontanées                      ----
Céphalée                                        ----
Asthénie                                        ----
Aménorrhée                                      ----
Amaigrissemeny                                  ----
Fièvre_rebelle_aux_antipaludéens                ----
Douleurs_articulaires                           ----
Impuissance_sexuelle                            ----
Troubles_de_comportement                        ----
Démangeaisons                                   ----
Somnolence                                      ----
Autres                                          ----
Quelle_autres                                   ----
Néant                                           ----
Occupation___Activités                          ----
Autres_occupation                               ----
Antécédents_familiaux                           ----
Quelles_antécédents_familiaux                   ----
Antécédents_transfusion_sanguine                ----
Combien_de_fois                                 ----
Années                                          ----
Antécédents_médicaux_chirurgaux_obstétricaux    ----
Etat_général                                    ----
Poids__kg_                                      ----
TA                                              ----
Pouls___min_                                    ----
Conjonctives                                    ----
Ausc__CardPulm                                  ----
Adénopathies                                    ----
Typiques                                        ----
Oedèmes                                         ----
Autres2                                         ----
Examen_neurologique                             ----
Date_de_diagnostique                            ----
Lieu_de_diagnostic                              ----
Circonstances                                   ----
Type                                            ----
Type__specifique_                               ----
Laboratin                                       ----
Autorité_medicale                               ----
Village2                                        ----
Groupement2                                     ----
Secteur2                                        ----
Territoire2                                     ----
Province2                                       ----
ZS2                                             ----
AS2                                             ----
Foyer                                           ----
Rivière                                         ----
CATT_sang_total                                 catt_total_blood    Null, POS+, POS++, POS+++
----                                            rdt
CATT_dilution                                   catt_dilution       Same as we have and >1/32
Suc_ganglionnaire                               lymph_node_puncture 0, +, NF, Null
Sang_SF                                         sf                  "
Sang_GE                                         ge                  "
Sang_W00                                        woo                 "
----                                            maec
Sang_mAECT                                      maect               "
----                                            maect_bc
LCR                                             lcr                 "
-----                                           lcr_fr
-----                                           lcr_csm
-----                                           dil
-----                                           parasit
-----                                           sternal_puncture
-----                                           ifat
-----                                           catt
-----                                           clinical_sickness
-----                                           other
Aspect_LCR                                      pl_liquid           Null, clair, hémorragique, trouble
Présence_trypanosomes                           pl_tryponasome      Null, NEG, POS
GB_mm3                                          pl_gb_mm3           Int
---                                             pl_albumine
Latex_LCR                                       pl_lcr_result       Null, 1/16, 1/32
Stade                                           pl_result           Null, STADE 1, STADE 2
---                                             pl_comments
Traitement_Prescrit2                            treatment_prescribed***    this field is joined with the one below
Traitement_Prescrit_specifique2                 treatment_prescribed***
Centre_recommandé2                              treatment_center
Centre_recommandé                               ----                Skipped, always null
Identification_Unique2                          ----
Qualification_de_la_personne2                   ----
UM_CT_FchDecede                                 ----
Patient_décédé_                                 ----                Always 0
Date_du_décès                                   ----
Encéphalopathie                                 ----
Septicémie                                      ----
Troubles_respiratoires_cause_                   ----
Troubles_cardiaques                             ----
Autre_cause_                                    ----
On_n_a_pas_pu_déterminer_la_cause               ----
Fiévre                                          ----
Céphalées                                       ----
Troubles_respiratoires_signes_                  ----
Palpiations__arrhytmies_                        ----
Convulsions                                     ----
Coma                                            ----
Saignement_hémorragies_                         ----
Paleur                                          ----
Chute_de_tension                                ----
Désorientation__obnubilation                    ----
Autres_signes                                   ----
Autres_signes1                                  ----
Autres_signes2                                  ----
Autres_signes3                                  ----
Autres_signes4                                  ----
Infection_du_site_d_injection                   ----


tSuivi
=========
if the person has a followup entry, `followup_done` is set to true

SuiviId                  ----
PersId                   ----
Identification_Unique    ----
No                       ----
CT_UM_FchSuivi           ----
Date_RDV                 ----
Date_Exam                ----
Evolution_clinique       ----
CATT                     ----
PG                       followup_pg
SF                       followup_sf
GE                       followup_ge
Woo                      followup_woo
mAECT                    followup_maect
----                     followup_woo_maect
----                     followup_pl
PL_Tryp                  followup_pl_trypanosome    Null, NF, None, Oui
PL_GB                    followup_pl_gb
Décision_médicale        test_followup_decision
Autre_décision           test_followup_decision


tblTraitementPrescrit
========================
Prescritid                        ----
PersID                            ----
CT_UM_FchTraitement               ----
Traitement                        treatment_prescribed***
Traitement_Autre                  ----
Date_début_réel                   treatment_start_date
Date_fin                          treatment_end_date
Compliance_du_traitement          ----
Effets_Secondaires_               treatment_secondary_effects   Non, Oui, Null
Femme_enceinte                    ----
Mois_enceinte                     ----
DDR                               ----
Fréq_pouls                        ----
Température                       ----
Tension_artériel                  ----
Fréq_respiratoire                 ----
Dose_j_nombre_de_j                ---- #treatment_prescribed***
Traitement_spécifique             ----
Observation                       ----
Traitement_Prescrit               ---- #treatment_prescribed***
Traitement_Prescrit_specifique    ---- #treatment_prescribed***
Date_de_prescription              ----
Centre_recommandé                 ----


***=
the field treatment prescribed seems to be all over the place,
i suggest joining all those fields together and see what we get out of it
'''
