'''
Transform data
--------------

This module contains the transformation functions.

The transformation uses a mapping data structure that groups related source
and import fields. The transformation will walk over that list and grab the
source values, apply optional transformations and assign these as columns to
to a single result DataFrame that contains all the import values.

Some of the data are in multiple related tables. For the transformations to
return the right result, it is important to use the foreign keys of related
tables as DataFrame indices, so that columns of Series assigned to the
DataFrame end up in the correct row.


Mapping for import and export fields
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

For the export every field needs to define a ``export_levels`` property that
is used to collect the export fields for ``anon`` and ``full`` export.

For the import each field must define the ``field`` property and a ``sources``
property that contains the field configuration for each import source.
In some cases this can be a one-to-one mapping, but in others we need to apply a
function to transform from the source value to the import value.

Each source field is a dict with a ``field`` or ``fields`` property and an optional
apply function. The supported apply functions are:

- ``apply_to_column(x: Value) -> t``

  Gets called on each item in the source column and should return a single value

- ``apply_to_row(row: Series) -> t``

  Gets called on each row in the source table and should return a single value

- ``apply_to_table(table, field) -> Series(t)``

  Gets called once for the tables and should return a Series of values

- ``apply_to_table(main_table, related_table, field) -> Series(t)``

  If the table specified in ``field`` is not the main table as set in the import
  options, the transformation will call this variant of the function which gets
  called once and receives the main table and the related table as parameters.
  The related table is the one specified in the `field` property

Multiple source fields can be specified for a single import field via the ``fields``
property. The value must be a list of dicts, where each item has to have a ``field``
configuration like described above. Additionaly a reduce function must be given,
that will combine the series from the multiple source fields input the import field.


.. code:: python

    MAPPING: List[JsonType] = [
        {
            "field": "sex",
            "export_levels": [
                Export.full,
                Export.suspects_full,
            ],

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
            "field": "treatment_secondary_effects",
            "export_levels": [
                Export.full,
                Export.anon
            ],

            "sources": {
                "pv": {
                    "field": ("tblTraitementPrescrit", "Effets Secondaires?"),
                    "apply_to_table": pv_has_secondary_effects
                },

                "historic": {
                    "field": ("T_CARDS", "TP_ADVERSE_EVENTS"),
                    "apply_to_column": historic_get_secondary_effects,
                },
            }
        },
    ]


Configuration for the extraction of data from different sources
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- ``type``           -- The value that will be set as ``source`` on the model.
- ``mapping_field``  -- the field in the mapping in ``transform.py``.
- ``main_table``     -- name of the table with the cases/persons.
- ``import_options`` -- Dict of tables to extract from the files.
  In the case of mdb files, those are the options passed to pandas.


.. code:: python

    IMPORT_CONFIG: JsonType = {
        "historic": {
            "type": "historic",
            "mapping_field": "historic",
            "main_table": "T_CARDS",
            "import_options": {
                ...
            }
        },
        "pv": {
            "type": "pv",
            "mapping_field": "pv",
            "main_table": "tblFishedeDeclaration",
            "import_options": {
                ...
            }
        },
        "backup": {
            "type": "mobile_backup",
            "mapping_field": "mobile",
            "main_table": "main",
        },
        "sync": {
            "type": "mobile_sync",
            "mapping_field": "mobile",
            "main_table": "main",
        },
    }


'''
import re
from enum import Enum
from functools import reduce
from typing import List, Optional, cast

import pandas
from django.contrib.gis.geos import Point
from pandas import DataFrame, Series

from hat.cases.filters import ResultValues
from hat.common.typing import JsonType
from hat.constants import GPS_SRID
from .utils import capitalize


def series_to_str(s: Series) -> str:
    return ', '.join(str(x) for x in s.dropna().values)


################################################################################
# Historic transform helper functions
################################################################################


def historic_get_sex(x: Optional[str]) -> Optional[str]:
    if pandas.isnull(x):
        return None
    return {
        'Féminin': 'female',
        'Masculin': 'male'
    }.get(cast(str, x), None)


def historic_get_result(x: Optional[int]) -> Optional[int]:
    if pandas.isnull(x) or x == 99:
        return None
    if cast(int, x) == -1:
        return ResultValues.positive.value
    else:
        return ResultValues.negative.value


def historic_get_catt_blood_result(x: Optional[int]) -> Optional[int]:
    if pandas.isnull(x) or x == 99:
        return None
    if cast(int, x) < 0:
        return ResultValues.positive.value
    else:
        return ResultValues.negative.value


def historic_get_catt_dil_result(x: Optional[int]) -> Optional[str]:
    if pandas.isnull(x):
        return None
    return {
        1: '1/2',
        2: '1/4',
        3: '1/8',
        4: '1/16',
        5: '1/32',
    }.get(cast(int, x), None)


def historic_get_pl_result(x: Optional[int]) -> Optional[str]:
    if pandas.isnull(x):
        return None
    return {
        1: 'stage1',
        2: 'stage2',
        3: 'unknown'
    }.get(cast(int, x), None)


def historic_get_pl_liquid_result(x: Optional[int]) -> Optional[str]:
    if pandas.isnull(x):
        return None
    return {
        1: 'clear',
        2: 'unclear',
        3: 'hemorrhagic',
    }.get(cast(int, x), None)


def historic_get_pl_lcr_result(x: Optional[int]) -> Optional[str]:
    if pandas.isnull(x):
        return None
    return {
        1: '1/8',
        2: '1/16',
        3: '1/32',
        4: '1/64',
        5: '1/128',
        6: '1/256',
        7: '1/512',
        8: '1/1024',
    }.get(cast(int, x), None)


def historic_get_followup_done(main_table: DataFrame,
                               related_table: DataFrame,
                               field: str) -> Series:
    return Series(main_table.index, index=main_table.index).isin(related_table.index)


def historic_get_secondary_effects(x: Optional[int]) -> Optional[bool]:
    if pandas.isnull(x) or x == 99:
        return None
    return cast(int, x) == 1


def historic_get_followup_test_result(main_table: DataFrame,
                                      related_table: DataFrame,
                                      field: str) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    return groups.agg(series_to_str)


def historic_get_null_boolean(x) -> Optional[bool]:
    try:
        return x.lower() in ("yes", "true", "t", "1")
    except AttributeError:
        return None


################################################################################
# Mobile transform helper functions
################################################################################


def mobile_get_sex(x: Optional[str]) -> Optional[str]:
    if pandas.isnull(x):
        return None
    return cast(str, x).lower()


mobile_year_re = re.compile(r'^(\d{4})[,.]?\d*')


def mobile_get_year(x: Optional[str]) -> Optional[int]:
    """
    return the year from x supporting legacy input like "1950." or even "1966.0"
    """
    if pandas.isnull(x):
        return None
    if type(x) == int:
        return x
    if type(x) == str:
        match = mobile_year_re.match(x)
        if match:
            return cast(int, match.group(1))
    return None


def mobile_get_safe_int(x: Optional[str]) -> Optional[int]:
    """
    Gets integer value of x or None if the string contains things like 'no-index'
    """
    if pandas.isnull(x):
        return None
    try:
        xint = int(x)
    except ValueError:
        return None
    return xint


def mobile_get_result(x: Optional[str]) -> Optional[int]:
    if pandas.isnull(x):
        return None
    try:
        return ResultValues[cast(str, x)].value
    except:
        return None


def mobile_get_age(table: DataFrame, field: str) -> int:
    age_years = 0
    age_months = 0
    if 'person.age.years' in table:
        age_years = table['person.age.years'].fillna(0).astype(float)
    if 'person.age.months' in table:
        age_months = table['person.age.months'].fillna(0).astype(float) / 12
    return age_years + age_months


mobile_get_data_regex = re.compile(r"^(\d{4})\D(\d{2})\D(\d{2})")  # yyyy-mm-dd where the separator is any non-digit chr


def mobile_get_date(x):
    if x is None:
        return None
    matcher = mobile_get_data_regex.match(x)
    if matcher:
        return "{}-{}-{}".format(matcher.group(1), matcher.group(2), matcher.group(3))
    else:
        return None


def mobile_get_null_boolean(x):
    if x is None:
        return None
    elif x == "none":
        return None
    elif type(x) == str:
        return x.lower() == "true" or x.lower() == "yes"
    elif type(x) == bool:
        return x
    elif type(x) == int:
        return bool(x)
    else:
        return None


def mobile_get_location_from_gps(gps):
    # We might also reject if "accuracy" is too bad
    if gps is not None and "latitude" in gps and "longitude" in gps:
        return Point((gps['longitude'], gps['latitude']), srid=GPS_SRID)
    else:
        return None


def mobile_get_location_from_coordinates(longitude=None, latitude=None):
    if longitude is None or latitude is None:
        return None
    else:
        return Point(longitude, latitude, srid=GPS_SRID)


################################################################################
# Pharmacovigilance transform helper functions
################################################################################


def pv_get_sex(x: Optional[str]) -> Optional[str]:
    if pandas.isnull(x):
        return None
    return {
        'Feminin': 'female',
        'Masculin': 'male'
    }.get(cast(str, x), None)


def pv_get_result(x: Optional[str]) -> Optional[int]:
    if pandas.isnull(x):
        return None
    # 0, +, NF
    if cast(str, x) == '+':
        return ResultValues.positive.value
    elif cast(str, x) == 'NF':
        return ResultValues.missing.value
    else:
        return ResultValues.negative.value


def pv_get_catt_blood_result(x: Optional[str]) -> Optional[int]:
    if pandas.isnull(x):
        return None
    # POS+, POS++, POS+++
    if cast(str, x) in ['POS+', 'POS++', 'POS+++']:
        return ResultValues.positive.value
    return ResultValues.negative.value


def pv_get_pl_result(x: Optional[str]) -> Optional[str]:
    # convert to same as historic
    if pandas.isnull(x):
        return None
    return {
        'STADE 1': 'stage1',
        'STADE 2': 'stage2',
        'INCONNU(non faite)': 'unknown'
    }.get(cast(str, x), None)


def pv_get_pl_liquid_result(x: Optional[str]) -> Optional[str]:
    # convert to same as historic
    if pandas.isnull(x):
        return None
    return {
        'clair': 'clear',
        'trouble': 'unclear',
        'hémorragique': 'hemorrhagic',
    }.get(cast(str, x), None)


################################################################################
# The following apply functions for treatment and followup fields all
# operate on two tables, the main table and some related table like "followups"
# or "treatments". Each of these is very similar or even the same, it
# groups the related data by the index, which is the foreign key(PersID)
# and then reduces each group to a single value for each group.
# Those values are then returned as a Series with the foreign key as index.
# Because the result DataFrame the values are merged into uses the same index,
# all the fields will be assigned to the right rows automatically.
# It might make sense to combine some of these in the future.
################################################################################


def pv_get_treatment_date(main_table: DataFrame,
                          related_table: DataFrame,
                          field: str) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    # need to drop invalid dates and start on 'none'
    # otherwise invalid dates may be chosen over real dates
    return groups.agg(lambda series: reduce(lambda a, x: x or a, series.dropna(), None))


def pv_get_treatment(main_table: DataFrame,
                     related_table: DataFrame,
                     field: str) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    return groups.agg(lambda series: reduce(lambda a, x: x or a, series))


def pv_get_treatment_result(main_table: DataFrame,
                            related_table: DataFrame,
                            field: str) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    return groups.agg(lambda series: reduce(lambda a, x: x or a, series))


def pv_has_secondary_effects(main_table: DataFrame,
                             related_table: DataFrame,
                             field: str) -> Series:
    df_yes = related_table[related_table[field] == 'Oui']
    return Series(main_table.index, index=main_table.index).isin(df_yes.index)


def pv_get_followup_done(main_table: DataFrame,
                         related_table: DataFrame,
                         field: str) -> Series:
    return Series(main_table.index, index=main_table.index).isin(related_table.index)


def pv_get_followup_test_result(main_table: DataFrame,
                                related_table: DataFrame,
                                field: str) -> Series:
    groups = related_table[field].groupby(related_table.index.values)
    return groups.agg(series_to_str)


################################################################################
# Common transform helper functions
################################################################################


def reduce_test_result(a: Optional[int], b: Optional[int]) -> Optional[int]:
    # Values can be positive, negative, missing and absent or null.
    # We have to handle null explicitly
    # to not accidentally have this return null in favor of missing.
    if pandas.isnull(b):
        return a
    if pandas.isnull(a):
        return b
    return max(a, b)


################################################################################
# Mapping for import and export fields
#
# For the export every field needs to define a `export_levels` property that
# is used to collect the export fields for `anon` and `full` export.
#
# For the import each field must define the `field` property and a `sources`
# property that contains the field configuration for each import source.
# In some cases this can be a one-to-one mapping, but in others we need to apply a
# function to transform from the source value to the import value.
#
# Each source field is a dict with a `field` or `fields` property and an optional
# apply function. The supported apply functions are:
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
################################################################################

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


MAPPING: List[JsonType] = [
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
            "pv": {
                "field": ("tblFishedeDeclaration", "Date de diagnostique"),
            },
            "historic": {
                "field": ("T_CARDS", "D_DATE"),
            },
            "mobile": {
                "field": ("main", "dateCreated",),
            }
        },
    },
    {
        "field": "device_id",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "deviceId",)
            }
        },
    },
    {
        "field": "entry_date",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "F_TIMESTAMP"),
            },
            "mobile": {
                "field": ("main", "dateModified",),
            }
        }
    },
    {
        "field": "entry_name",
        "export_levels": [Export.full, Export.anon],
    },
    {
        "field": "circumstances_da",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "D_CIRCUMSTANCES_DA"),
                "apply_to_column": historic_get_null_boolean
            },
        }
    },
    {
        "field": "circumstances_dp",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "D_CIRCUMSTANCES_DP"),
                "apply_to_column": historic_get_null_boolean
            },
        }
    },
    {
        "field": "circumstances_da_um",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "D_CIRCUMSTANCES_DA_UM"),
                "apply_to_column": capitalize
            },
        }
    },
    {
        "field": "circumstances_dp_um",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "D_CIRCUMSTANCES_DP_UM"),
                "apply_to_column": capitalize
            },
        }
    },
    {
        "field": "circumstances_dp_cs",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "D_CIRCUMSTANCES_DP_CS"),
                "apply_to_column": capitalize
            },
        }
    },
    {
        "field": "circumstances_dp_hgr",
        "export_levels": [Export.full, Export.anon, Export.suspects_full, Export.suspects_anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "D_CIRCUMSTANCES_DP_HGR"),
                "apply_to_column": capitalize
            },
        }
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
            "pv": {
                "field": ("tblFishedeDeclaration", "Numero du cas")
            },
            "historic": {
                "field": ("T_CARDS", "IF_NBR")
            },
        }
    },
    {
        "field": "form_month",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Mois")
            },
            "historic": {
                "field": ("T_CARDS", "IF_MONTH")
            },
        }
    },
    {
        "field": "form_year",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Année")
            },
            "historic": {
                "field": ("T_CARDS", "IF_YEAR")
            },
        }
    },
    # person fields
    {
        "field": "hat_id",
        "export_levels": [Export.full, Export.suspects_full]
    },
    {
        "field": "json_document_id",
        "case_ignore": True,
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "mobile": {
                "field": ("main", "json_document_id")
            }
        }
    },
    {
        "field": "name",
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Nom")
            },
            "historic": {
                "field": ("T_CARDS", "IM_NAME")
            },
            "mobile": {
                "field": ("main", "person.postname")
            }
        }
    },
    {
        "field": "lastname",
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Postnom")
            },
            "historic": {
                "field": ("T_CARDS", "IM_LASTNAME")
            },
            "mobile": {
                "field": ("main", "person.surname")
            }
        }
    },
    {
        "field": "prename",
        "export_levels": [Export.full, Export.suspects_full],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Prénom")
            },
            "historic": {
                "field": ("T_CARDS", "IM_PRENAME")
            },
            "mobile": {
                "field": ("main", "person.forename")
            },
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
            "pv": {
                "field": ("tblFishedeDeclaration", "Année de naissance")
            },
            "historic": {
                "field": ("T_CARDS", "IM_BIRTHYEAR")
            },
            "mobile": {
                "field": ("main", "person.birthYear"),
                "apply_to_column": mobile_get_year,
            }
        }
    },
    {
        "field": "age",
        "export_levels": [Export.full, Export.anon, Export.suspects_full],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Age"),
            },
            "historic": {
                "field": ("T_CARDS", "IM_AGE"),
            },
            "mobile": {
                "field": ("main", "person.age.years"),
                "apply_to_table": mobile_get_age,
            }
        }
    },
    {
        "field": "mothers_surname",
        "export_levels": [Export.full],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Nom de la mère")
            },
            "historic": {
                "field": ("T_CARDS", "IM_MERE")
            },
            "mobile": {
                "field": ("main", "person.mothersSurname")
            }
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
            "pv": {
                "field": ("tblFishedeDeclaration", "Centre recommandé2")
            },
            "historic": {
                "field": ("T_CARDS", "IM_UM_CT")
            },
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
            "historic": {
                "field": ("T_CARDS", "TP_DATE"),
            },
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
            "historic": {
                "field": ("T_CARDS", "TP_DATE_END"),
            },
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
            "historic": {
                "field": ("T_CARDS", "TP_TREATMENT")
            },
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
                "apply_to_column": historic_get_secondary_effects,
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
            "historic": {
                "field": ("T_CARDS", "TP_RESULT")
            },
        }
    },
    # test fields
    {
        "field": "test_rdt",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "D_TDR"),
                "apply_to_column": historic_get_result,
            },
            "mobile": {
                "field": ("main", "participant.screenings.rdt.result"),
                "apply_to_column": mobile_get_result
            },
        },
        "test_type": SCREENING_TEST
    },
    {
        "field": "test_rdt_picture_filename",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.rdt.image")
            },
        },
        "test_type": SCREENING_TEST
    },
    {
        "field": "test_rdt_session_type",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.rdt.sessionType")
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
                        "apply_to_column": historic_get_result,
                    },
                    {
                        "field": ("T_CARDS", "D_CATT_TOTAL_BLOOD"),
                        "apply_to_column": historic_get_catt_blood_result,
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
        "field": "test_catt_index",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.catt.screeningIndex"),
                "apply_to_column": mobile_get_safe_int,
            },
        },
        "test_type": SCREENING_TEST
    },
    {
        "field": "test_catt_picture_filename",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.catt.image")
            },
        },
        "test_type": SCREENING_TEST
    },
    {
        "field": "test_catt_session_type",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.catt.sessionType")
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
                        "apply_to_column": historic_get_result,
                    },
                    {
                        "field": ("T_CARDS", "MD_MAECT"),
                        "apply_to_column": historic_get_result,
                    },
                    {
                        "field": ("T_CARDS", "MD_MAECT_BC"),
                        "apply_to_column": historic_get_result,
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
        "field": "test_maect_video_filename",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.maect.video")
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
                "apply_to_column": historic_get_result,
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
        "field": "test_pg_video_filename",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.pg.video")
            },
        },
        "test_type": SCREENING_TEST
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
                "apply_to_column": historic_get_result,
            },
            "mobile": {
                "field": ("main", "participant.screenings.ctcwoo.result"),
                "apply_to_column": mobile_get_result
            }
        },
        "test_type": CONFIRMATION_TEST
    },
    {
        "field": "test_ctcwoo_video_filename",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.ctcwoo.video")
            },
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
        "field": "test_pl_video_filename",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.pl.video")
            },
        },
        "test_type": STAGING_TEST
    },
    {
        "field": "test_catt_dilution",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "CATT dilution")
            },
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
                "apply_to_column": historic_get_result,
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
                "apply_to_column": historic_get_result,
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
                        "apply_to_column": historic_get_result,
                    },
                    {
                        "field": ("T_CARDS", "MD_LCR_FR"),
                        "apply_to_column": historic_get_result,
                    },
                    {
                        "field": ("T_CARDS", "MD_LCR_SCM"),
                        "apply_to_column": historic_get_result,
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
                "apply_to_column": historic_get_result,
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
                "apply_to_column": historic_get_result,
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
                "apply_to_column": historic_get_result,
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
                "apply_to_column": historic_get_result,
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
                "apply_to_column": historic_get_result,
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
                "apply_to_column": historic_get_result,
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
                "apply_to_column": historic_get_pl_liquid_result,
            },
        },
    },
    {
        "field": "test_pl_trypanosome",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Présence trypanosomes")
            },
            "historic": {
                "field": ("T_CARDS", "DS_PL_TRYPANOSOME")
            },
        }
    },
    {
        "field": "test_pl_gb_mm3",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "GB/mm3")
            },
            "historic": {
                "field": ("T_CARDS", "DS_PL_GB_MM3")
            },
            "mobile": {
                "field": ("main", "participant.screenings.pl.whiteCount")
            },
        },
        "test_type": STAGING_TEST
    },
    {
        "field": "test_pl_albumine",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "DS_PL_ALBUMINE")
            },
        }
    },
    {
        "field": "test_pl_lcr",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "pv": {
                "field": ("tblFishedeDeclaration", "Latex LCR")
            },
            "historic": {
                "field": ("T_CARDS", "DS_PL_LCR"),
                "apply_to_column": historic_get_pl_lcr_result,
            },
        }
    },
    {
        "field": "test_pl_comments",
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "historic": {
                "field": ("T_CARDS", "DS_PL_COMMENTS")
            },
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
                "apply_to_column": historic_get_pl_result,
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
    {
        "field": "participant_member_type",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.memberType")
            },
        },
    },
    {
        "field": "participant_origin_province",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "person.traveller.travellerProvince")
            },
        },
    },
    {
        "field": "participant_origin_zone",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "person.traveller.travellerZone")
            },
        },
    },
    {
        "field": "participant_origin_area",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "person.traveller.travellerArea")
            },
        },
    },
    {
        "field": "test_catt_test_time",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.catt.testTime")
            },
        },
    },
    {
        "field": "test_rdt_test_time",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.rdt.testTime")
            },
        },
    },
    {
        "field": "test_ctcwoo_test_time",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.ctcwoo.testTime")
            },
        },
    },
    {
        "field": "test_maect_test_time",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.maect.testTime")
            },
        },
    },
    {
        "field": "test_pl_test_time",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.pl.testTime")
            },
        },
    },
    {
        "field": "test_pg_test_time",
        "case_ignore": True,
        "export_levels": [Export.full, Export.anon],
        "sources": {
            "mobile": {
                "field": ("main", "participant.screenings.pg.testTime")
            },
        },
    },
    {
        "field": "treatments",
        "case_ignore": True,
        "export_levels": [],
        "sources": {
            "mobile": {
                "field": ("main", "participant.treatments")
            },
        },
    },
    {
        "field": "dead",
        "case_ignore": True,
        "export_levels": [],
        "sources": {
            "mobile": {
                "field": ("main", "death.dead")
            },
        },
    },
    {
        "field": "death_date",
        "case_ignore": True,
        "export_levels": [],
        "sources": {
            "mobile": {
                "field": ("main", "death.deathDate")
            },
        },
    },
    {
        "field": "death_device",
        "case_ignore": True,
        "export_levels": [],
        "sources": {
            "mobile": {
                "field": ("main", "death.device")
            },
        },
    },
    {
        "field": "death_position_latitude",
        "case_ignore": True,
        "export_levels": [],
        "sources": {
            "mobile": {
                "field": ("main", "death.position.latitude")
            },
        },
    },
    {
        "field": "death_position_longitude",
        "case_ignore": True,
        "export_levels": [],
        "sources": {
            "mobile": {
                "field": ("main", "death.position.longitude")
            },
        },
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

CASE_IGNORE = [f['field'] for f in MAPPING
               if 'case_ignore' in f and f['case_ignore']]
ANON_EXPORT_FIELDS = [f['field'] for f in MAPPING
                      if Export.anon in f['export_levels']]

FULL_EXPORT_FIELDS = [f['field'] for f in MAPPING
                      if Export.full in f['export_levels']]

SUSPECT_FULL_EXPORT_FIELDS = [f['field'] for f in MAPPING
                              if Export.suspects_full in f['export_levels']]

SUSPECT_ANON_EXPORT_FIELDS = [f['field'] for f in MAPPING
                              if Export.suspects_anon in f['export_levels']]


################################################################################
# Configuration for the extraction of data from different sources
#
# `type`           - The value that will be set as `source` on the model.
# `mapping_field`  - the field in the mapping in `transform.py`.
# `main_table`     - name of the table with the cases/persons.
# `import_options` - Dict of tables to extract from the files.
#                    In the case of mdb files, those are the options passed to pandas.
#
################################################################################

IMPORT_CONFIG: JsonType = {
    "historic": {
        "type": "historic",
        "mapping_field": "historic",
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
        }
    },
    "pv": {
        "type": "pv",
        "mapping_field": "pv",
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
        "main_table": "main",
    },
    "sync": {
        "type": "mobile_sync",
        "mapping_field": "mobile",
        "main_table": "main",
    },
}
