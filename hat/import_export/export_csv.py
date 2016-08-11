import pandas
from hat.common.sqlalchemy import engine
from hat.participants.models import HatParticipant


def export_csv(anon: bool) -> str:
    generic_fields = [
        'document_id',
        'document_date',
        'entry_date',
        'entry_name',
        'mobile_unit',
    ]
    location_fields = [
        'village',
        'province',
        'ZS',
        'AZ',
    ]
    person_fields = [
        'hat_id',
        'name',
        'lastname',
        'prename',
        'sex',
        'age',
        'year_of_birth',
        'mothers_surname',
    ]
    anon_person_fields = [
        'age',
    ]
    treatment_fields = [
        'treatment_center',
        'treatment_start_date',
        'treatment_end_date',
        'treatment_result',
    ]
    test_fields = [
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
    followup_fields = [
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

    all_fields = [
        'source',
        *generic_fields,
        *location_fields,
        *person_fields,
        *treatment_fields,
        *test_fields,
        *followup_fields
    ]
    anon_fields = [
        'source',
        *generic_fields,
        *location_fields,
        *anon_person_fields,
        *treatment_fields,
        *test_fields,
        *followup_fields
    ]

    table_name = HatParticipant.objects.model._meta.db_table
    with engine.begin() as conn:
        df = pandas.read_sql_table(table_name, conn)

    columns = anon_fields if anon else all_fields
    return df.to_csv(index=False, columns=columns, sep=';')
