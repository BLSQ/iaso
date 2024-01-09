"""JsonLogic(https://jsonlogic.com/)-related utilities."""

import operator
from functools import reduce
from typing import Dict, Any

from django.db.models import Q, Transform
from django.db.models.fields.json import KeyTransformTextLookupMixin, JSONField


# This is used to cast a json value from string into a float.
# Didn't find a simple way to do that.
# Using `__forcefloat` in a json field's lookup will cast as a double precision, e.g:
# `Instance.objects.filter(json__usable_vials_physical__forcefloat__gte= 1)`
# See:
# https://docs.djangoproject.com/en/4.2/howto/custom-lookups/
# https://medium.com/nerd-for-tech/custom-lookups-in-django-69fd13e35bdb

# Another alternative would have been to use an annotate in this way. But that complicate the filter flow because we
# would have to annotate every field we are casting for.
# Instance.objects.annotate(b=Cast(KeyTextTransform('usable_vials_physical', "json"), FloatField())).filter(b__gte=2)


class ExtractForceFloat(KeyTransformTextLookupMixin, Transform):
    lookup_name = "forcefloat"

    # KeyTransformTextLookupMixin
    # tell it to use ->> to extract the value as text otherwhise it can't be cast

    def as_sql(self, compiler, connection):
        sql, params = compiler.compile(self.lhs)
        sql = "CAST(%s AS DOUBLE PRECISION)" % sql
        return sql, params


JSONField.register_lookup(ExtractForceFloat)


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
        raise ValueError(f"Unsupported JsonLogic. Operator {op} take exactly two operands: {jsonlogic}")

    lookups = {
        "==": "exact",
        "!=": "exact",
        ">": "gt",
        ">=": "gte",
        "<": "lt",
        "<=": "lte",
        "in": "icontains",
    }

    if op not in lookups.keys():
        raise ValueError(
            f"Unsupported JsonLogic (unknown operator {op}): {jsonlogic}. Supported operators: f{lookups.keys()}"
        )

    field_position = 1 if op == "in" else 0
    field = params[field_position]
    if "var" not in field:
        raise ValueError(
            f"Unsupported JsonLogic. Argument[{field_position}] must contain a variable for given "
            f"operator : {jsonlogic}"
        )
    field_name = field["var"]
    value = params[0] if op == "in" else params[1]

    extract = ""
    if isinstance(value, (int, float)) and field_prefix:
        # Since inside the json everything is cast as string we cast back as int
        extract = "__forcefloat"

    lookup = lookups[op]
    f = f"{field_prefix}{field_name}{extract}__{lookup}"
    q = Q(**{f: value})
    if op == "!=":
        # invert the filter
        q = ~q
    return q
