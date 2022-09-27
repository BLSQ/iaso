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
    q = _real_jsonlogic_to_q(jsonlogic, field_prefix)
    return q.children[0] if len(q.children) == 1 else q


def _real_jsonlogic_to_q(jsonlogic: Dict[str, Any], field_prefix: str = "") -> Q:
    if "and" in jsonlogic:
        return Q(
            reduce(
                operator.and_,
                (_real_jsonlogic_to_q(subquery, field_prefix) for subquery in jsonlogic["and"]),
            )
        )
    elif "or" in jsonlogic:
        return Q(
            reduce(
                operator.or_,
                (_real_jsonlogic_to_q(subquery, field_prefix) for subquery in jsonlogic["or"]),
            )
        )
    elif "==" in jsonlogic:
        return Q(**{f"{field_prefix}{jsonlogic['=='][0]['var']}__exact": jsonlogic["=="][1]})
    elif "!=" in jsonlogic:
        return ~Q(**{f"{field_prefix}{jsonlogic['!='][0]['var']}__exact": jsonlogic["!="][1]})
    elif ">" in jsonlogic:
        return Q(**{f"{field_prefix}{jsonlogic['>'][0]['var']}__gt": jsonlogic[">"][1]})
    elif ">=" in jsonlogic:
        return Q(**{f"{field_prefix}{jsonlogic['>='][0]['var']}__gte": jsonlogic[">="][1]})
    elif "<" in jsonlogic:
        return Q(**{f"{field_prefix}{jsonlogic['<'][0]['var']}__lt": jsonlogic["<"][1]})
    elif "<=" in jsonlogic:
        return Q(**{f"{field_prefix}{jsonlogic['<='][0]['var']}__lte": jsonlogic["<="][1]})
    else:
        raise ValueError(f"Unknown JsonLogic operator: {jsonlogic}")
