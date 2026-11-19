"""The nutrition programmes of each country, by entity type of the ETL.

For each country: the code of each entity type of the ETL (see `tasks.py`), with its programme type (`U5` for the
children under 5, `PLW` for the pregnant and lactating women, as `Journey.programme_type`) and the programmes its
beneficiaries can be enrolled in.

The eligible beneficiaries export has one sheet per programme of each entity type (and per physiology status for the
women), with "No data" when there is none. Add a programme here for its sheets to appear.
"""

import typing


class EntityTypeProgrammes(typing.NamedTuple):
    programme_type: str  # "U5" or "PLW"
    programmes: list[str]  # values of `NUTRITION_PROGRAMMES`


PROGRAMMES_BY_COUNTRY: dict[str, dict[str, EntityTypeProgrammes]] = {
    "Bangladesh": {
        "bangladesh_under5": EntityTypeProgrammes("U5", ["TSFP", "OTP", "BSFP", "NSEP"]),
        "bangladesh_pbwg": EntityTypeProgrammes("PLW", ["TSFP", "BSFP"]),
    },
    "Ethiopia": {
        "ethiopia_under5": EntityTypeProgrammes("U5", ["TSFP", "OTP"]),
        "ethiopia_pbwg": EntityTypeProgrammes("PLW", ["TSFP"]),
    },
    "Nigeria": {
        "nigeria_under5": EntityTypeProgrammes("U5", ["TSFP", "OTP"]),
        "nigeria_pbwg": EntityTypeProgrammes("PLW", ["TSFP"]),
    },
    "South Sudan": {
        "ssd_under5": EntityTypeProgrammes("U5", ["TSFP", "OTP", "BSFP"]),
        "ssd_pbwg": EntityTypeProgrammes("PLW", ["TSFP", "BSFP"]),
    },
}

PROGRAMMES_BY_ENTITY_TYPE: dict[str, EntityTypeProgrammes] = {
    code: programmes for entity_types in PROGRAMMES_BY_COUNTRY.values() for code, programmes in entity_types.items()
}
