from enum import Enum
from io import StringIO
from functools import reduce
from typing import Dict
import pandas
from pandas import DataFrame, Series
from pandas.io.json import json_normalize

import hat.common.mdb as mdb
from .errors import handle_import_stage, ImportStage
from .utils import hat_id, capitalize, create_documentid

# This file contains the extraction and transformation functions.
#
# The extraction is straight forward and will convert mdb files or json data to
# pandas dataframes.
#
# The transformation uses a mapping data structure that groups related source
# and import fields. The transformation will walk over that list and grab the
# source values, apply optional transformations and assign these as columns to
# to a single result DataFrame that contains all the import values.
#
# Some of the data is in multiple related tables. For the transformations to
# return the right result, it is important to use the foreign keys of related
# tables as DataFrame indices, so that columns of Series assigned to the
# DataFrame end up in the correct row.


def series_to_str(s: Series) -> str:
    return ', '.join(str(x) for x in s.dropna().values)


################################################################################
# Historic transform helper functions
################################################################################


def historic_get_sex(x):
    return {'Féminin': 'female', 'Masculin': 'male'}.get(x, None)


def historic_get_result(x):
    if pandas.isnull(x) or x == 99:
        return None
    return x == -1


def historic_get_catt_blood_result(x):
    if pandas.isnull(x) or x == 99:
        return None
    return x < 0


def historic_get_catt_dil_result(x):
    return {
        1: '1/2',
        2: '1/4',
        3: '1/8',
        4: '1/16',
        5: '1/32',
    }.get(x, None)


def historic_get_pl_result(x):
    return {1: 'stage1', 2: 'stage2', 3: 'unknown'}.get(x, None)


def historic_get_pl_liquid_result(x):
    return {
        1: 'clear',
        2: 'unclear',
        3: 'hemorrhagic',
    }.get(x, None)


def historic_get_pl_lcr_result(x):
    return {
        1: '1/8',
        2: '1/16',
        3: '1/32',
        4: '1/64',
        5: '1/128',
        6: '1/256',
        7: '1/512',
        8: '1/1024',
    }.get(x, None)


def historic_get_followup_done(main_table, related_table, field):
    return Series(main_table.index, index=main_table.index).isin(related_table.index)


def historic_get_secondary_effects(x):
    if pandas.isnull(x) or x == 99:
        return None
    return x == 1


def historic_get_followup_test_result(main_table, related_table, field):
    groups = related_table[field].groupby(related_table.index.values)
    return groups.agg(series_to_str)


################################################################################
# Mobile transform helper functions
################################################################################


def mobile_get_sex(x):
    if pandas.isnull(x):
        return None
    return x.lower()


def mobile_get_result(x):
    if pandas.isnull(x):
        return None
    return x == 'positive'


def mobile_get_age(table, field):
    age_years = 0
    age_months = 0
    if 'person.age.years' in table:
        age_years = table['person.age.years'].fillna(0).astype(float)
    if 'person.age.months' in table:
        age_months = table['person.age.months'].fillna(0).astype(float) / 12
    return age_years + age_months


################################################################################
# Pharmacovigilance transform helper functions
################################################################################


def pv_get_sex(value) -> str:
    return {'Feminin': 'female', 'Masculin': 'male'}.get(value, None)


def pv_get_result(x):
    if pandas.isnull(x):
        return None
    # 0, +, NF
    return x == '+'


def pv_get_catt_blood_result(x):
    if pandas.isnull(x):
        return None
    if x == 'NEG':
        return False
    # POS+, POS++, POS+++
    return True


def pv_get_pl_result(x):
    # convert to same as historic
    return {
        'STADE 1': 'stage1',
        'STADE 2': 'stage2',
        'INCONNU(non faite)': 'unknown'
    }.get(x, None)


def pv_get_pl_liquid_result(x):
    # convert to same as historic
    return {
        'clair': 'clear',
        'trouble': 'unclear',
        'hémorragique': 'hemorrhagic',
    }.get(x, None)


# The following apply functions for treatment and followup fields all
# operate on two tables, the main table and some related table like "followups"
# or "treatments". Each of these is very similar or even the same, it
# groups the related data by the index, which is the foreign key(PersID)
# and then reduces each group to a single value for each group.
# Those values are then returned as a Series with the foreign key as index.
# Because the result DataFrame the values are merged into uses the same index,
# all the fields will be assigned to the right rows automatically.
# It might make sense to combine some of these in the future.


def pv_get_treatment_date(main_table, related_table, field) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    # need to drop invalid dates and start on 'none'
    # otherwise invalid dates may be chosen over real dates
    return groups.agg(lambda series: reduce(lambda a, x: x or a, series.dropna(), None))


def pv_get_treatment(main_table, related_table, field) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    return groups.agg(lambda series: reduce(lambda a, x: x or a, series))


def pv_get_treatment_result(main_table, related_table, field) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    return groups.agg(lambda series: reduce(lambda a, x: x or a, series))


def pv_has_secondary_effects(main_table, related_table, field) -> Series:
    df_yes = related_table[related_table[field] == 'Oui']
    return Series(main_table.index, index=main_table.index).isin(df_yes.index)


def pv_get_followup_done(main_table, related_table, field) -> Series:
    return Series(main_table.index, index=main_table.index).isin(related_table.index)


def pv_get_followup_test_result(main_table, related_table, field) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    return groups.agg(series_to_str)


################################################################################
# Common transform helper functions
################################################################################


def reduce_test_result(a, b):
    # Values can be True, False or null. We have to handle null explicitely
    # to not accidentially have this return null in favor of False.
    if pandas.isnull(b):
        return a
    return a or b


################################################################################
# Mapping for import and export fields
#
# For the export every field needs to define a `export_levels` property that
# is used to collect the export fields for `anon` and `full` export.
#
# For the import each field must define the `field` property and a
# `sources` property that contains the field configuration for each import source.
# In some cases this can be a one-to-one mapping, but in others we need to apply a
# function to transform from the source value to the import value.
#
# Each source field can be either a two element tuple of the form:
# `(table_name, field_name)`
# Or a dict with a `field` or `fields` property and an optional apply function.
# The supported apply functions are:
#
# - `apply_to_column(x: Value) -> t`
#   Gets called on each item in the source column and should return a single value
#
# - `apply_to_row(row: Series) -> t`
#   Gets called on each row in the source table and should return a single value
#
# - `apply_to_table(table, field) -> Series(t)`
#   Gets called once for the tables and should return a Series of values
#
# - `apply_to_table(main_table, related_table, field) -> Series(t)`
#   If the table specified in `field` is not the main table as set in the import
#   options, the transformation will call this variant of the function which gets
#   called once and receives the main table and the related table as parameters.
#   The related table is the one specified in the `field` property
#
# Multiple source fields can be specified for a single import field via the `fields`
# property. The value must be a list of dicts, where each item has to have a `field`
# configuration like described above. Additionaly a reduce function must be given,
# that will combine the series from the multiple source fields input the import field.
#

# The export levels
class Export(Enum):
    full = 1
    anon = 2
    suspects_full = 3
    suspects_anon = 4


SCREENING_TEST = 'screening'
CONFIRMATION_TEST = 'confirmation'
STAGING_TEST = 'staging'
UNKNOWN_TEST = 'unknown'

MAPPING = [
    # meta fields
    {
        "field": "source",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
    },
    {
        "field": "document_id",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
    },
    {
        "field": "document_date",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Date de diagnostique"),
            "historic": ("T_CARDS", "D_DATE"),
            "mobile": ("main", "dateModified",)
        },
    },
    {
        "field": "device_id",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": ("main", "deviceId",)
        },
    },
    {
        "field": "entry_date",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": ("T_CARDS", "F_TIMESTAMP"),
            "mobile": ("main", "dateCreated",)
        }
    },
    {
        "field": "entry_name",
        "export_levels": [Export.full, Export.anon],
    },
    {
        "field": "mobile_unit",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "UM"),
                "apply_to_column": capitalize
            },
            "historic": {
                "field": ("T_CARDS", "IF_UM"),
                "apply_to_column": capitalize
            },
        }
    },
    {
        "field": "form_number",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Numero du cas"),
            "historic": ("T_CARDS", "IF_NBR"),
        }
    },
    {
        "field": "form_month",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Mois"),
            "historic": ("T_CARDS", "IF_MONTH"),
        }
    },
    {
        "field": "form_year",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Année"),
            "historic": ("T_CARDS", "IF_YEAR"),
        }
    },
    # person fields
    {
        "field": "hat_id",
        "export_levels": [Export.full, Export.suspects_full]
    },
    {
        "field": "name",
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Nom"),
            "historic": ("T_CARDS", "IM_NAME"),
            "mobile": ("main", "person.postname")
        }
    },
    {
        "field": "lastname",
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Postnom"),
            "historic": ("T_CARDS", "IM_LASTNAME"),
            "mobile": ("main", "person.surname")
        }
    },
    {
        "field": "prename",
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Prénom"),
            "historic": ("T_CARDS", "IM_PRENAME"),
            "mobile": ("main", "person.forename"),
        }
    },
    {
        "field": "sex",
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Sexe"),
                "apply_to_column": pv_get_sex
            },
            "historic": {
                "field": ("T_CARDS", "IM_SEX"),
                "apply_to_column": historic_get_sex
            },
            "mobile": {
                "field": ("main", "person.gender"),
                "apply_to_column": mobile_get_sex
            }
        }
    },
    {
        "field": "year_of_birth",
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Année de naissance"),
            "historic": ("T_CARDS", "IM_BIRTHYEAR"),
            "mobile": ("main", "person.birthYear")
        }
    },
    {
        "field": "age",
        "export_levels": [Export.full, Export.anon, Export.suspects_full],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Age"),
            "historic": ("T_CARDS", "IM_AGE"),
            "mobile": {
                "field": ("main", "person.age.years"),
                "apply_to_table": mobile_get_age
            }
        }
    },
    {
        "field": "mothers_surname",
        "export_levels": [Export.full],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Nom de la mère"),
            "historic": ("T_CARDS", "IM_MERE"),
            "mobile": ("main", "person.mothersSurname")
        }
    },
    # location fields
    {
        "field": "province",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Provence"),
                "apply_to_column": capitalize
            },
            "historic": {
                "field": ("T_CARDS", "IM_AD_PROVINCE"),
                "apply_to_column": capitalize
            },
        }
    },
    {
        "field": "ZS",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "ZS"),
                "apply_to_column": capitalize
            },
            "historic": {
                "field": ("T_CARDS", "IM_AD_HEALTH_ZONE"),
                "apply_to_column": capitalize,
            },
            "mobile": {
                "field": ("main", "person.location.zone"),
                "apply_to_column": capitalize,
            },
        }
    },
    {
        "field": "AS",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "AS"),
                "apply_to_column": capitalize,
            },
            "historic": {
                "field": ("T_CARDS", "IM_AD_HEALTH_AREA"),
                "apply_to_column": capitalize,
            },
            "mobile": {
                "field": ("main", "person.location.area"),
                "apply_to_column": capitalize,
            },
        }
    },
    {
        "field": "village",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Village"),
                "apply_to_column": capitalize
            },
            "historic": {
                "field": ("T_CARDS", "IM_AD_VILLAGE"),
                "apply_to_column": capitalize,
            },
            "mobile": {
                "field": ("main", "person.location.village"),
                "apply_to_column": capitalize,
            },
        }
    },
    # treatment fields
    {
        "field": "treatment_center",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Centre recommandé2"),
            "historic": ("T_CARDS", "IM_UM_CT"),
        }
    },
    {
        "field": "treatment_start_date",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblTraitementPrescrit", "Date début réel"),
                "apply_to_table": pv_get_treatment_date
            },
            "historic": ("T_CARDS", "TP_DATE"),
        }
    },
    {
        "field": "treatment_end_date",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblTraitementPrescrit", "Date fin"),
                "apply_to_table": pv_get_treatment_date
            },
            "historic": ("T_CARDS", "TP_DATE_END"),
        }
    },
    {
        "field": "treatment_prescribed",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblTraitementPrescrit", "Traitement"),
                "apply_to_table": pv_get_treatment
            },
            "historic": ("T_CARDS", "TP_TREATMENT"),
        }
    },
    {
        "field": "treatment_secondary_effects",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblTraitementPrescrit", "Effets Secondaires?"),
                "apply_to_table": pv_has_secondary_effects
            },
            "historic": {
                "field": ("T_CARDS", "TP_ADVERSE_EVENTS"),
                "apply_to_column": historic_get_secondary_effects
            },
        }
    },
    {
        "field": "treatment_result",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv":  {
                "field": ('tblTraitementPrescrit', 'Compliance du traitement'),
                "apply_to_table": pv_get_treatment_result
            },
            "historic": ("T_CARDS", "TP_RESULT"),
        }
    },
    # test fields
    {
        "field": "test_rdt",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "D_TDR"),
                "apply_to_column": historic_get_result
            },
            "mobile": {
                "field": ("main", "participant.screenings.rdt.result"),
                "apply_to_column": mobile_get_result
            },
        },
        "test_type": SCREENING_TEST
    },
    {
        "field": "test_catt",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "CATT sang total"),
                "apply_to_column": pv_get_catt_blood_result
            },
            "historic": {
                "fields": [
                    {
                        "field": ("T_CARDS", "MD_CATT"),
                        "apply_to_column": historic_get_result
                    },
                    {
                        "field": ("T_CARDS", "D_CATT_TOTAL_BLOOD"),
                        "apply_to_column": historic_get_catt_blood_result
                    }
                ],
                "reduce": reduce_test_result
            },
            "mobile": {
                "field": ("main", "participant.screenings.catt.result"),
                "apply_to_column": mobile_get_result
            },
        },
        "test_type": SCREENING_TEST
    },
    {
        "field": "test_maect",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Sang mAECT"),
                "apply_to_column": pv_get_result
            },
            "historic": {
                "fields": [
                    {
                        "field": ("T_CARDS", "MD_MAEC"),
                        "apply_to_column": historic_get_result
                    },
                    {
                        "field": ("T_CARDS", "MD_MAECT"),
                        "apply_to_column": historic_get_result
                    },
                    {
                        "field": ("T_CARDS", "MD_MAECT_BC"),
                        "apply_to_column": historic_get_result
                    }
                ],
                "reduce": reduce_test_result
            },
            "mobile": {
                "field": ("main", "participant.screenings.maect.result"),
                "apply_to_column": mobile_get_result
            },
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_ge",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Sang GE"),
                "apply_to_column": pv_get_result
            },
            "historic": {
                "field": ("T_CARDS", "MD_GE"),
                "apply_to_column": historic_get_result
            },
            "mobile": {
                "field": ("main", "participant.screenings.ge.result"),
                "apply_to_column": mobile_get_result
            }
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_pg",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.pg.result"),
                "apply_to_column": mobile_get_result
            }
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_ctcwoo",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Sang W00"),
                "apply_to_column": pv_get_result
            },
            "historic": {
                "field": ("T_CARDS", "MD_WOO"),
                "apply_to_column": historic_get_result
            },
            "mobile": {
                "field": ("main", "participant.screenings.ctcwoo.result"),
                "apply_to_column": mobile_get_result
            }
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_pl",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.pl.result"),
                "apply_to_column": mobile_get_result
            }
        },
        "test_type": STAGING_TEST
    },
    {
        "field": "test_catt_dilution",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "CATT dilution"),
            "historic": {
                "field": ("T_CARDS", "D_CATT_DILUTION"),
                "apply_to_column": historic_get_catt_dil_result
            },
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_lymph_node_puncture",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Suc ganglionnaire"),
                "apply_to_column": pv_get_result
            },
            "historic": {
                "field": ("T_CARDS", "MD_LYMPH_NODE_PUNCTURE"),
                "apply_to_column": historic_get_result
            },
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_sf",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Sang SF"),
                "apply_to_column": pv_get_result
            },
            "historic": {
                "field": ("T_CARDS", "MD_SF"),
                "apply_to_column": historic_get_result
            },
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_lcr",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "LCR"),
                "apply_to_column": pv_get_result
            },
            "historic": {
                "fields": [
                    {
                        "field": ("T_CARDS", "MD_LCR"),
                        "apply_to_column": historic_get_result
                    },
                    {
                        "field": ("T_CARDS", "MD_LCR_FR"),
                        "apply_to_column": historic_get_result
                    },
                    {
                        "field": ("T_CARDS", "MD_LCR_SCM"),
                        "apply_to_column": historic_get_result
                    }
                ],
                "reduce": reduce_test_result
            },
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_dil",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "MD_DIL"),
                "apply_to_column": historic_get_result
            },
        },
        "test_type": UNKNOWN_TEST
    },
    {
        "field": "test_parasit",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "MD_PARASIT"),
                "apply_to_column": historic_get_result
            },
        },
        "test_type": UNKNOWN_TEST
    },
    {
        "field": "test_sternal_puncture",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "MD_STERNAL_PUNCTURE"),
                "apply_to_column": historic_get_result
            },
        },
        "test_type": UNKNOWN_TEST
    },
    {
        "field": "test_ifat",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "MD_IFAT"),
                "apply_to_column": historic_get_result
            },
        },
        "test_type": UNKNOWN_TEST
    },
    {
        "field": "test_clinical_sickness",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "MD_CLINICAL_SICKNESS"),
                "apply_to_column": historic_get_result
            },
        },
        "test_type": UNKNOWN_TEST
    },
    {
        "field": "test_other",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "MD_OTHER"),
                "apply_to_column": historic_get_result
            },
        },
        "test_type": UNKNOWN_TEST
    },
    {
        "field": "test_pl_liquid",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Aspect LCR"),
                "apply_to_column": pv_get_pl_liquid_result
            },
            "historic": {
                "field": ("T_CARDS", "DS_PL_LIQUID"),
                "apply_to_column": historic_get_pl_liquid_result
            },
        },
    },
    {
        "field": "test_pl_trypanosome",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Présence trypanosomes"),
            "historic": ("T_CARDS", "DS_PL_TRYPANOSOME"),
        }
    },
    {
        "field": "test_pl_gb_mm3",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "GB/mm3"),
            "historic": ("T_CARDS", "DS_PL_GB_MM3"),
        }
    },
    {
        "field": "test_pl_albumine",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": ("T_CARDS", "DS_PL_ALBUMINE"),
        }
    },
    {
        "field": "test_pl_lcr",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": ("tblFishedeDeclaration", "Latex LCR"),
            "historic": {
                "field": ("T_CARDS", "DS_PL_LCR"),
                "apply_to_column": historic_get_pl_lcr_result
            },
        }
    },
    {
        "field": "test_pl_comments",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": ("T_CARDS", "DS_PL_COMMENTS"),
        }
    },
    {
        "field": "test_pl_result",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Stade"),
                "apply_to_column": pv_get_pl_result
            },
            "historic": {
                "field": ("T_CARDS", "DS_PL_RESULT"),
                "apply_to_column": historic_get_pl_result
            },
        },
        "test_type": STAGING_TEST
    },
    # followup fields
    {
        "field": "followup_done",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "SuiviId"),
                "apply_to_table": pv_get_followup_done
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_ID"),
                "apply_to_table": historic_get_followup_done
            },
        }
    },
    {
        "field": "test_followup_pg",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "PG"),
                "apply_to_table": pv_get_followup_test_result
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_PG"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_sf",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "SF"),
                "apply_to_table": pv_get_followup_test_result
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_SF"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_ge",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "GE"),
                "apply_to_table": pv_get_followup_test_result
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_GE"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_woo",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "Woo"),
                "apply_to_table": pv_get_followup_test_result
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_WOO"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_maect",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "mAECT"),
                "apply_to_table": pv_get_followup_test_result
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_MAECT"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_woo_maect",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_FOLLOWUPS", "S_WOO_MAECT"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_pl",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_FOLLOWUPS", "S_PL"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_pl_trypanosome",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "PL Tryp"),
                "apply_to_table": pv_get_followup_test_result
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_PL_TRYP"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_pl_gb",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "PL GB"),
                "apply_to_table": pv_get_followup_test_result
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_PL_GB"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },
    {
        "field": "test_followup_decision",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblSuivi", "Décision médicale"),
                "apply_to_table": pv_get_followup_test_result
            },
            "historic": {
                "field": ("T_FOLLOWUPS", "S_DECISION"),
                "apply_to_table": historic_get_followup_test_result
            },
        }
    },

    # These fields might get added later and are currently placeholders with no source fields.
    # For now these are supported through the case sql view.
    {
        "field": "screening_result",
        "export_levels": [Export.suspects_full, Export.suspects_anon],
    },
    {
        "field": "confirmation_result",
        "export_levels": [Export.suspects_full, Export.suspects_anon],
    },
    {
        "field": "stage_result",
        "export_levels": [Export.suspects_full, Export.suspects_anon],
    }
]

ANON_EXPORT_FIELDS = [f['field'] for f in MAPPING
                      if Export.anon in f['export_levels']]

FULL_EXPORT_FIELDS = [f['field'] for f in MAPPING
                      if Export.full in f['export_levels']]

SUSPECT_FULL_EXPORT_FIELDS = [f['field'] for f in MAPPING
                              if Export.suspects_full in f['export_levels']]

SUSPECT_ANON_EXPORT_FIELDS = [f['field'] for f in MAPPING
                              if Export.suspects_anon in f['export_levels']]


def extract_mdb(filename: str, import_options: Dict) -> Dict[str, DataFrame]:
    result = {}
    for table_name, options in import_options.items():
        csv = mdb.get_table_csv(filename, table_name)
        kwargs = {'sep': ';', **options}
        df = pandas.read_csv(StringIO(csv), **kwargs)
        if "parse_dates" in options:
            # Add utc timezone to dates. The dates in the data are naive and have no timezone.
            # The datebases requires timezones to be set on dates.
            for date_field in options["parse_dates"]:
                df[date_field] = df[date_field].dt.tz_localize('UTC')
        result[table_name] = df
    return result


def extract_backup(filename: str, import_options=None) -> Dict[str, DataFrame]:
    import json
    from django.conf import settings
    from hat.common.utils import run_cmd
    r = run_cmd(['./scripts/decrypt_mobilebackup.js', settings.MOBILE_KEY, filename])
    data = json.loads(r)
    # keep cases only for this import,
    # (might be locations in the data as well)
    data = [doc for doc in data if 'type' in doc and doc['type'] == 'participant']
    df = json_normalize(data)

    # TODO: We upgrade some fields manually here until we have the versioning module
    #       ready that is supposed to provide upgrade functions for mobile data.
    if 'person.mothersForename' in df:
        if 'person.mothersSurname' not in df:
            df['person.mothersSurname'] = df['person.mothersForename']
        else:
            df['person.mothersSurname'].fillna(df['person.mothersForename'], inplace=True)
    if 'person.middlename' in df:
        if 'person.postname' not in df:
            df['person.postname'] = df['person.middlename']
        else:
            df['person.postname'].fillna(df['person.middlename'], inplace=True)
    if 'person.postname' not in df:
        df['person.postname'] = ''

    # the transformation supports multiple tables -- here we only have one that we call 'main'
    return {"main": df}


def historic_post_process(transformed: DataFrame, orgname: str) -> DataFrame:
    parts = orgname.split('-')
    parts.pop()
    entry_name = ' '.join(parts)
    transformed['entry_name'] = entry_name
    return transformed


################################################################################
# Configuration for the different sources
#
# `type` - The value that will be set as `source` on the model
# `mapping_field` - the field in the mapping
# `extract` - the function used for extracting the data from the file
# `main_table` - name of the table with the cases/persons
# `import_options` - Dict of tables to extract from the files.
#                    In the case of mdb files, those are the options passed to pandas.
# `post_process` - Optional function to do additional transformations after the
#                  mapping has been applied.
#
IMPORT_CONFIG = {
    "historic": {
        "type": "historic",
        "mapping_field": "historic",
        "extract": extract_mdb,
        "main_table": "T_CARDS",
        "import_options": {
            "T_CARDS": {
                "index_col": 0,
                "parse_dates": ['D_DATE', 'F_TIMESTAMP', "TP_DATE", "TP_DATE_END"],
                "infer_datetime_format": True,
            },
            "T_FOLLOWUPS": {
                "index_col": 1,
                "infer_datetime_format": True,
            }
        },
        "post_process": historic_post_process
    },
    "pv": {
        "type": "pv",
        "mapping_field": "pv",
        "extract": extract_mdb,
        "main_table": "tblFishedeDeclaration",
        "import_options": {
            "tblFishedeDeclaration": {
                "index_col": 0,
                "parse_dates": ['Date de diagnostique'],
                "dtype": {
                    'Années': 'str',           # nan, year(2006) or year range(2006-2007)
                    'Latex LCR': 'str',        # nan, string('1/16')
                    'Qualification de la personne2': 'str',  # can be nan or string
                    'UM/CT_FchDecede': 'str',  # nan or string
                    'Date du décès': 'str',    # nan or '02/01/09 00:00:00' datetime
                    'Autre cause:': 'str',     # nan or string
                    'Autres signes': 'str',    # nan or string
                    'Autres signes1': 'str',   # nan or string
                    'Autres signes2': 'str',   # nan or string
                    'Autres signes3': 'str',   # nan or string
                    "Infection du site d'injection": 'str',   # nan or string
                },
                "infer_datetime_format": True,
            },
            "tblTraitementPrescrit": {
                "index_col": 1,
                "parse_dates": ["Date début réel", "Date fin"],
                "dtype": {
                    "DDR": 'str',                   # nan and datetime
                    "Fréq pouls": 'str',            # numbers and dates
                    "Température": 'str',           # numbers, strings like "normal", nan
                    "Tension artériel": "str",      # fractions(9/8) and nan
                    "Fréq respiratoire": 'str',     # numbers, dates, strings, "NF"
                    "Traitement Prescrit": "str",   # strings and nan
                    "Traitement Prescrit specifique": 'str',  # strings and nan
                    "Date de prescription": 'str',  # datetimes and nan
                    "Centre recommandé": 'str',     # nan and strings
                },
                "infer_datetime_format": True,
            },
            "tblSuivi": {
                "index_col": 1
            }
        }
    },
    "backup": {
        "type": "mobile_backup",
        "mapping_field": "mobile",
        "extract": extract_backup,
        "main_table": "main",
    }
}


def transform_field(source_field, main_table_name, tables) -> Series:
    if isinstance(source_field, tuple):
        # source field is the field name, just transfer the value
        (table_name, field) = source_field
        if table_name != main_table_name:
            raise ValueError('Use apply_to_table for foreign field: ' + field +
                             ' from: ' + table_name)
        if field not in tables[table_name]:
            return None
        return tables[table_name][field]

    elif isinstance(source_field, dict):
        if "fields" in source_field:
            # We have multiple source fields that must be reduced to a single import field
            reduce_func = source_field.get('reduce', None)
            if reduce_func is None:
                raise ValueError('Multifield: ' + field + ' in: ' + table_name +
                                 ' must have a "reduce" property')
            result_series = []
            for acc_field in source_field["fields"]:
                if 'field' not in acc_field:
                    raise ValueError('Multifield: ' + field + ' in: ' + table_name +
                                     ' must have a "field" property')
                result_series.append(transform_field(acc_field, main_table_name, tables))
            # Reduce the result set by combining the result Series one by one after another
            # The result of each combination is used for the next reduce iteration.
            r = reduce(lambda s1, s2: s1.combine(s2, reduce_func), result_series)
            return r

        # We have a single source field that maps to a single import field
        if "field" not in source_field:
            raise ValueError('Specify a field')

        (table_name, field) = source_field['field']

        # Skip fields which do not exist.
        if field not in tables[table_name]:
            return None

        # Fields in tables different from the main one need to define `apply_to_table`
        # That needs to resolve the relation and transform the column accordingly
        if table_name != main_table_name and "apply_to_table" not in source_field:
            raise ValueError('Use apply_to_table for foreign fields: {}#{}'.format(
                table_name, field))

        table = tables[table_name]

        if "apply_to_column" in source_field:
            return table[field].apply(source_field['apply_to_column'])

        elif "apply_to_row" in source_field:
            return table.apply(source_field['apply_to_row'], axis=1)

        elif "apply_to_table" in source_field:
            if table_name == main_table_name:
                return source_field['apply_to_table'](table, field)
            else:
                # source field is in a related table
                main_table = tables[main_table_name]
                return source_field['apply_to_table'](main_table, table, field)

        elif "field" in source_field:
            return tables[table_name][field]

        else:
            raise ValueError("Unable to map: " + field + ' in table: ' + table_name)


def transform(mapping_field: str, main_table_name: str, tables: Dict[str, DataFrame]) -> DataFrame:
    '''
    Transforms the data in the source tables to it's import representation.
    It will loop over every field specified in the `MAPPING` and convert from
    the source field to the import field.
    '''
    result = DataFrame(index=tables[main_table_name].index)

    for field_mapping in MAPPING:
        if 'sources' not in field_mapping or mapping_field not in field_mapping['sources']:
            # Not mapping this field
            continue

        import_field = field_mapping['field']
        source_field = field_mapping['sources'][mapping_field]

        try:
            r = transform_field(source_field, main_table_name, tables)
            if r is None:
                continue
            result[import_field] = r
        except Exception as e:
            raise ValueError('Error mapping to: ' + import_field +
                             ' from: ' + mapping_field) from e
    return result


@handle_import_stage(ImportStage.extract)
def extract_file(config: Dict, filename: str) -> Dict[str, DataFrame]:
    return config['extract'](filename, config.get('import_options', None))


@handle_import_stage(ImportStage.transform)
def transform_source(config: Dict, extracted: Dict[str, DataFrame], orgname: str):
    transformed = transform(config['mapping_field'], config['main_table'], extracted)

    # add common fields
    transformed['source'] = config['type']
    transformed['hat_id'] = transformed.apply(hat_id, axis=1)
    transformed['document_id'] = transformed.apply(create_documentid, axis=1)

    if 'post_process' in config:
        transformed = config['post_process'](transformed, orgname)

    return transformed
