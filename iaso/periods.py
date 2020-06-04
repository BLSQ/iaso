PERIOD_TYPE_MONTH = "MONTH"
PERIOD_TYPE_QUARTER = "QUARTER"
PERIOD_TYPE_SIX_MONTH = "SIX_MONTH"
PERIOD_TYPE_YEAR = "YEAR"


def detect(dhis2_period):
    if len(dhis2_period) == 4:
        return PERIOD_TYPE_YEAR

    if "Q" in dhis2_period:
        return PERIOD_TYPE_QUARTER

    if "S" in dhis2_period:
        return PERIOD_TYPE_SIX_MONTH

    if len(dhis2_period) == 6:
        return PERIOD_TYPE_MONTH

    raise Exception("unsupported dhis2 period format for '" + dhis2_period + "'")
