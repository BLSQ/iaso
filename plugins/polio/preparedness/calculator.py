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


def get_summary(zones):
    r = {}
    for _, i, _, kind in indicators:
        name_values = [(dn, d.get(i)) for dn, d in zones.items()]
        values = [value for _, value in name_values]
        if kind == "number":
            r[i] = avg(values)
        elif kind == "percent":
            # it's stored as percent * 100 atm
            r[i] = avg(values) / 10
        elif kind == "date":
            values = [v for v in values if v]
            invalids_dates = [(n, v) for n, v in name_values if v and not isinstance(v, int)]
            if invalids_dates:
                r[i] = "error", "Invalid date format for zone: " + ", ".join(
                    ["{}: `{}`".format(n, v) for n, v in invalids_dates]
                )
            elif values:
                try:
                    start, end = min(values), max(values)
                except TypeError as e:
                    raise ValueError(f"Invalid dates in {name_values} ")
                r[i] = convert_date_from_gsheet(start), convert_date_from_gsheet(end)
            else:
                r[i] = "", ""
        else:
            assert "error"
    return r


# sn, key, title, type
indicators = [
    (1, "operational_fund", "Operational funds", "number"),
    (2, "vaccine_and_droppers_received", "Vaccines and droppers received", "number"),
    (3, "vaccine_cold_chain_assessment", "Vaccine cold chain assessment  ", "number"),
    (4, "vaccine_monitors_training_and_deployment", "Vaccine monitors training & deployment  ", "number"),
    (5, "ppe_materials_and_others_supply", "PPE Materials and other supplies  ", "number"),
    (6, "penmarkers_supply", "Penmarkers  ", "date"),
    (7, "sia_training", "Supervisor training & deployment  ", "number"),
    (8, "sia_micro_planning", "Micro/Macro plan  ", "number"),
    (9, "communication_sm_fund", "SM funds --> 2 weeks  ", "number"),
    (10, "communication_sm_activities", "SM activities  ", "percent"),
    (11, "communication_c4d", "C4d", "date"),
    (12, "aefi_easi_protocol", "Safety documents: AESI Protocol  ", "number"),
    (13, "pharmacovigilance_committee", "Pharmacovigilance Committee  ", "number"),
    (0, "status_score", "Total score", "percent"),
    # not used atm
    # (0, "training_score", "training_score", "number"),
    # (0, "monitoring_score", "monitoring_score", "number"),
    # (3, "vaccine_score", "vaccine_score", "number"),
    # (4, "advocacy_score", "advocacy_score", "number"),
    # (5, "adverse_score", "adverse_score", "number"),
    # (7, "region", "region", "number"),
]


def preparedness_summary(prep_dict):
    r = {}
    indicators_per_zone = {
        "national": prep_dict["national"],
        "regions": get_summary(prep_dict["regions"]),
        "districts": get_summary(prep_dict["districts"]),
    }
    # get average
    r["overall_status_score"] = avg(
        [
            indicators_per_zone["national"]["status_score"],
            indicators_per_zone["regions"]["status_score"],
            indicators_per_zone["districts"]["status_score"],
        ]
    )
    # pivot
    r["indicators"] = {}
    for sn, key, title, kind in indicators:
        r["indicators"][key] = {
            "sn": sn,
            "key": key,
            "title": title,
            "national": indicators_per_zone["national"][key],
            "regions": indicators_per_zone["regions"][key],
            "districts": indicators_per_zone["districts"][key],
        }
    return r
