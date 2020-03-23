YEAR = "YEAR"
QUARTER = "QUARTER"
MONTH = "MONTH"
SIX_MONTH = "SIX_MONTH"


def detect(dhis2_period):
    if len(dhis2_period) == 4:
        return YEAR

    if "Q" in dhis2_period:
        return QUARTER

    if "S" in dhis2_period:
        return SIX_MONTH

    if len(dhis2_period) == 6:
        return MONTH

    raise Exception("unsupported dhis2 period format for '" + dhis2_period + "'")
