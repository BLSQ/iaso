import json

from django.db.models import Max, Min


FOUR_SHADES = [
    "#A2CAEA",
    "#ACDF9B",
    "#F2B16E",
    "#A93A42",
]
FIVE_SHADES = [
    "#A2CAEA",
    "#ACDF9B",
    "#F5F1A0",
    "#F2B16E",
    "#A93A42",
]
SIX_SHADES = [
    "#A2CAEA",
    "#ACDF9B",
    "#F5F1A0",
    "#F2B16E",
    "#E4754F",
    "#A93A42",
]
SEVEN_SHADES = [
    "#A2CAEA",
    "#6BD39D",
    "#ACDF9B",
    "#F5F1A0",
    "#F2B16E",
    "#E4754F",
    "#A93A42",
]
EIGHT_SHADES = [
    "#A2CAEA",
    "#6BD39D",
    "#ACDF9B",
    "#F5F1A0",
    "#F2B16E",
    "#E4754F",
    "#C54A53",
    "#A93A42",
]
NINE_SHADES = [
    "#A2CAEA",
    "#80B3DC",
    "#6BD39D",
    "#ACDF9B",
    "#F5F1A0",
    "#F2B16E",
    "#E4754F",
    "#C54A53",
    "#A93A42",
]

TEN_SHADES = [
    "#A2CAEA",
    "#80B3DC",
    "#6BD39D",
    "#ACDF9B",
    "#F5F1A0",
    "#F2D683",
    "#F2B16E",
    "#E4754F",
    "#C54A53",
    "#A93A42",
]

RISK_LOW = "#A5D6A7"
RISK_MEDIUM = "#FFECB3"
RISK_HIGH = "#FECDD2"
RISK_VERY_HIGH = "#FFAB91"

ORDINAL = {
    2: [RISK_LOW, RISK_VERY_HIGH],
    3: [RISK_LOW, RISK_MEDIUM, RISK_VERY_HIGH],
    4: [RISK_LOW, RISK_MEDIUM, RISK_HIGH, RISK_VERY_HIGH],
}


def get_legend_config(metric_type, scale):
    print(f"Getting legend config for metric type {metric_type} with scale {scale}")
    # Temporary: use old way as fallback if legend_type was not defined
    if not metric_type.legend_type:
        return __get_legend_config(metric_type)

    if metric_type.legend_type == "threshold":
        scales = get_scales_from_list_or_json_str(scale)
        try:
            numeric_scales = [float(s) for s in scales]
        except Exception as e:
            print(f"Error converting scales to numerics: {e}")
            numeric_scales = []
        return {"domain": numeric_scales, "range": get_range_from_count(len(scales))}
    if metric_type.legend_type == "ordinal":
        scales = get_scales_from_list_or_json_str(scale)
        if len(scales) < 2 or len(scales) > 4:
            print(f"Metric ordinal has to many or to few scales {len(scales)}")
            return None

        return {"domain": scales, "range": ORDINAL[len(scales)]}
    if metric_type.legend_type == "linear":
        max_value = get_max_range_value(metric_type)
        scales = get_scales_from_list_or_json_str(scale) if scale else [0, max_value]
        return {"domain": scales, "range": [NINE_SHADES[0], NINE_SHADES[-1]]}

    return __get_legend_config(metric_type)


def __get_legend_config(metric_type):
    if metric_type.category == "Incidence":
        return {
            "domain": [5, 50, 100, 200, 300, 500],
            "range": SEVEN_SHADES,
        }
    if metric_type.category == "Prevalence":
        return {
            "domain": [10, 20, 30, 40, 50, 60, 70, 80],
            "range": NINE_SHADES,
        }
    if metric_type.category in ["Bednet coverage", "DHS DTP3 Vaccine"]:
        return {
            "domain": [40, 50, 60, 70, 80, 90],
            "range": list(reversed(SEVEN_SHADES)),
        }
    values_qs = metric_type.metricvalue_set.all()

    result = values_qs.aggregate(
        min_value=Min("value"),
        max_value=Max("value"),
    )
    min_value = result["min_value"]
    max_value = result["max_value"]

    if metric_type.category == "Mortality":
        return {"domain": [0, max_value], "range": [NINE_SHADES[0], NINE_SHADES[-1]]}
    if metric_type.category == "Composite risk":
        return {
            "domain": list(range(int(min_value), int(max_value))),
            "range": [RISK_LOW, RISK_MEDIUM, RISK_HIGH, RISK_VERY_HIGH],
        }
    if metric_type.category == "Seasonality":
        choices = values_qs.values_list("value", flat=True).distinct().order_by("value")
        return {
            "domain": list(choices),
            "range": [RISK_LOW, RISK_MEDIUM, RISK_HIGH, RISK_VERY_HIGH],
        }

    return {"domain": get_steps(min_value, max_value, len(SEVEN_SHADES)), "range": SEVEN_SHADES}


def get_steps(min, max, count):
    if not min or not max:
        return []
    round_digits = 2 if min < 1 else 0
    if count == 1:
        return [round(min, round_digits)]
    step_size = (max - min) / (count - 1)
    steps = [round(min + i * step_size, round_digits) for i in range(count)]
    return steps


def get_scales_from_list_or_json_str(scale):
    if not scale or scale == "":
        return []

    if isinstance(scale, list):
        return scale

    if str.startswith(scale, "[") and str.endswith(scale, "]"):
        str_scale = scale.replace("[", "").replace("]", "")
        scales = [s.strip() for s in str.split(str_scale, ",")]
        if isinstance(scales[0], float):
            return [float(s) for s in scales]
        if isinstance(scales[0], int):
            return [int(s) for s in scales]

        return scales

    try:
        return json.loads(scale)
    except Exception as e:
        print(f"Exception while parsing json: {e}")
        return []


def get_max_range_value(metric_type):
    values_qs = metric_type.metricvalue_set.all()

    result = values_qs.aggregate(
        max_value=Max("value"),
    )
    return result["max_value"]


def get_range_from_count(count):
    # Note, we always want one additional color, to cover latest value of the scale (> 500 000)
    if count == 3:
        return list(FOUR_SHADES)
    if count == 4:
        return list(FIVE_SHADES)
    if count == 5:
        return list(SIX_SHADES)
    if count == 6:
        return list(SEVEN_SHADES)
    if count == 7:
        return list(EIGHT_SHADES)
    if count == 8:
        return list(NINE_SHADES)
    if count == 9:
        return list(TEN_SHADES)
    return list(SEVEN_SHADES)
