import datetime

_BASE_GSHEET_DATE = datetime.date(1899, 12, 30)


def convert_date_from_gsheet(num_days: int) -> datetime.date:
    # Ref: https://stackoverflow.com/a/66738817/
    assert isinstance(num_days, int)
    return _BASE_GSHEET_DATE + datetime.timedelta(num_days)


def avg(l):
    if not l:
        return None
    # Don't sum up the filtered value but still count them for division
    filtered = filter(lambda x: isinstance(x, (int, float)), l)
    return sum(filtered) / len(l)


def get_preparedness_score(data):
    get_status_score = lambda region: region.get("status_score", 0.0)

    national_score = data.get("national", {}).get("status_score", 0.0)

    regions = data.get("regions", {}).values()
    regional_score = avg(list(map(get_status_score, regions)))

    districts = data.get("districts", {}).values()
    district_score = avg(list(map(get_status_score, districts)))

    return {
        "national_score": round(national_score, 2) if national_score else 0,
        "regional_score": round(regional_score, 2) if regions else 0,
        "district_score": round(district_score, 2) if district_score else 0,
    }
