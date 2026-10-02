import json

from typing import Iterable, List, Union

from django.db.models import Max, Min


THREE_SHADES = [
    "#ACDF9B",
    "#F2B16E",
    "#A93A42",
]
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


LegendValue = Union[float, str]


def is_categorical_values(values: Iterable[LegendValue]) -> bool:
    """Whether an iterable of metric values should get a categorical (ordinal) legend."""
    return any(isinstance(value, str) for value in values)


def ordinal_legend_config(domain: List) -> dict:
    palette = list(SEVEN_SHADES)
    colors = [palette[index % len(palette)] for index in range(len(domain))]
    return {"domain": list(domain), "range": colors}


def linear_legend_config(low: float, high: float) -> dict:
    # d3's ``scaleLinear`` needs ``len(domain) == len(range)``, so emit exactly two of each and let
    # the colours be interpolated between ``low`` and ``high``.
    return {"domain": [low, high], "range": [SEVEN_SHADES[0], SEVEN_SHADES[-1]]}


def threshold_legend_config(low: float, high: float, num_colors: int = len(SEVEN_SHADES)) -> dict:
    """Equal-interval threshold classification.

    d3's ``scaleThreshold`` expects ``len(range) == len(domain) + 1`` (one extra colour for the
    bucket above the last breakpoint), so ``num_colors`` colours need ``num_colors - 1`` *interior*
    breakpoints dividing ``[low, high]`` into equal buckets.
    """
    if low is None or high is None or high <= low:
        # Degenerate range (all values equal / single value): one breakpoint, two colours.
        return {"domain": [low], "range": [SEVEN_SHADES[0], SEVEN_SHADES[-1]]}

    round_digits = 2 if low < 1 else 0
    step = (high - low) / num_colors
    breakpoints: List[float] = []
    for index in range(1, num_colors):
        value = round(low + step * index, round_digits)
        # Rounding can collapse neighbouring breakpoints on a small range; keep them distinct.
        if not breakpoints or value != breakpoints[-1]:
            breakpoints.append(value)
    return {"domain": breakpoints, "range": get_range_from_count(len(breakpoints))}


def build_auto_legend_config(
    legend_type: str, values: Iterable[LegendValue], category_order: "List[str] | None" = None
) -> dict:
    """Build a `{domain, range}` legend config from a metric's actual values.

    Shared by composite layers (values from an evaluated graph) and standard layers (values from an
    import), so both get the same equal-interval threshold / sorted-domain ordinal defaults.
    """
    non_null = [value for value in values if value is not None]

    if legend_type == "ordinal":
        if is_categorical_values(non_null):
            domain = list(category_order) if category_order else sorted({str(value) for value in non_null})
        else:
            domain = sorted({value for value in non_null})
        return ordinal_legend_config(domain)

    if not non_null:
        return {"domain": [], "range": list(SEVEN_SHADES)}

    low, high = min(non_null), max(non_null)
    if legend_type == "linear":
        return linear_legend_config(low, high)

    return threshold_legend_config(low, high)


def resolve_auto_legend_type(selected: "str | None", values: Iterable[LegendValue]) -> str:
    """Pick the effective legend type from a requested one and the actual values.

    Categorical values are always ordinal (numeric legends can't render strings). For numeric
    values, honour an explicit ``linear``/``ordinal`` choice; anything else (including no choice, or
    "auto") defaults to a threshold legend.
    """
    if is_categorical_values(values):
        return "ordinal"

    selected = (selected or "").lower()
    if selected in ("linear", "ordinal"):
        return selected
    return "threshold"


def get_range_from_count(count):
    # Note, we always want one additional color, to cover latest value of the scale (> 500 000)
    if count == 2:
        return list(THREE_SHADES)
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
