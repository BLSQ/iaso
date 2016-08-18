from pandas import DataFrame
from hat.participants.models import HatParticipant


GENERIC_FIELDS = [
    'document_id',
    'document_date',
    'entry_date',
    'entry_name',
    'mobile_unit',
]
LOCATION_FIELDS = [
    'village',
    'province',
    'ZS',
    'AZ',
]
PERSON_FIELDS = [
    'hat_id',
    'name',
    'lastname',
    'prename',
    'sex',
    'age',
    'year_of_birth',
    'mothers_surname',
]
ANON_PERSON_FIELDS = [
    'age',
]
TREATMENT_FIELDS = [
    'treatment_center',
    'treatment_start_date',
    'treatment_end_date',
    'treatment_prescribed',
    'treatment_secondary_effects',
    'treatment_result',
]
TEST_FIELDS = [
    # from both sources
    'test_rdt',
    'test_catt',
    'test_maect',
    'test_ge',

    # from mobile data
    'test_pg',
    'test_ctcwoo',
    'test_pl',

    # from historic data
    'test_catt_total_blood',
    'test_catt_dilution',
    'test_lymph_node_puncture',
    'test_sf',
    'test_woo',
    'test_maec',
    'test_maect_bc',
    'test_lcr',
    'test_lcr_fr',
    'test_lcr_scm',
    'test_dil',
    'test_parasit',
    'test_sternal_puncture',
    'test_ifat',
    'test_clinical_sickness',
    'test_other',
    'test_pl_liquid',
    'test_pl_trypanosome',
    'test_pl_gb_mm3',
    'test_pl_albumine',
    'test_pl_lcr',
    'test_pl_comments',
    'test_pl_result',
]
FOLLOWUP_FIELDS = [
    'followup_done',
    'test_followup_pg',
    'test_followup_sf',
    'test_followup_ge',
    'test_followup_woo',
    'test_followup_maect',
    'test_followup_woo_maect',
    'test_followup_pl',
    'test_followup_pl_trypanosome',
    'test_followup_pl_gb',
    'test_followup_decision',
]

ALL_FIELDS = [
    'source',
    *GENERIC_FIELDS,
    *LOCATION_FIELDS,
    *PERSON_FIELDS,
    *TEST_FIELDS,
    *FOLLOWUP_FIELDS,
    *TREATMENT_FIELDS,
]
ANON_FIELDS = [
    'source',
    *GENERIC_FIELDS,
    *LOCATION_FIELDS,
    *ANON_PERSON_FIELDS,
    *TEST_FIELDS,
    *FOLLOWUP_FIELDS,
    *TREATMENT_FIELDS,
]

DATE_FORMAT = '%Y-%m-%d %H:%M:%S'


def export_csv(
        anon=False,
        start_date=None,
        end_date=None,
        sources=None
) -> str:
    filters = {}
    if start_date:
        filters['document_date__gte'] = start_date
    if end_date:
        filters['document_date__lte'] = end_date
    if sources:
        filters['source__in'] = sources

    qs = HatParticipant.objects.filter(**filters).order_by('document_date')
    df = DataFrame(list(qs.values()))

    if len(df):
        columns = ANON_FIELDS if anon else ALL_FIELDS
        return df.to_csv(index=False, columns=columns, sep=',', date_format=DATE_FORMAT)
    else:
        return ''
