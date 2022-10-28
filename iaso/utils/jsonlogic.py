"""JsonLogic(https://jsonlogic.com/)-related utilities."""

from functools import reduce
from typing import Dict, Any

import operator
from django.db.models import Q


def jsonlogic_to_q(jsonlogic: Dict[str, Any], field_prefix: str = "") -> Q:
    """Converts a JsonLogic query to a Django Q object.

    :param jsonlogic: The JsonLogic query to convert, stored in a Python dict. Example: {"and": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, 25]}]}
    :param field_prefix: A prefix to add to all fields in the generated query. Useful to follow a relationship or to dig in a JSONField

    :return: A Django Q object.
    """

    if "and" in jsonlogic:
        return reduce(
            operator.and_,
            (jsonlogic_to_q(subquery, field_prefix) for subquery in jsonlogic["and"]),
        )
    elif "or" in jsonlogic:
        return reduce(
            operator.or_,
            (jsonlogic_to_q(subquery, field_prefix) for subquery in jsonlogic["or"]),
        )

    elif "!" in jsonlogic:
        return ~jsonlogic_to_q(jsonlogic["!"], field_prefix)

    if not jsonlogic.keys():
        return Q()

    # Binary operators
    op = list(jsonlogic.keys())[0]
    params = jsonlogic[op]
    if len(params) != 2:
        raise ValueError(f"Unsuported JsonLogic: {jsonlogic}")
    if "var" not in params[0]:
        raise ValueError(f"Unsuported JsonLogic: {jsonlogic}")

    lookups = {
        "==": "exact",
        "!=": "exact",
        ">": "gt",
        ">=": "gte",
        "<": "lt",
        "<=": "lte",
    }

    if op not in lookups.keys():
        raise ValueError(f"Unsuported JsonLogic: {jsonlogic}")

    field_name = params[0]["var"]
    lookup = lookups[op]
    f = f"{field_prefix}{field_name}__{lookup}"
    q = Q(**{f: params[1]})
    if op == "!=":
        # invert the filter
        q = ~q
    return q
