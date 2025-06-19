"""JsonLogic(https://jsonlogic.com/)-related utilities."""

import operator
import re

from typing import Any, Callable, Dict

from django.db.models import Exists, OuterRef, Q, Transform
from django.db.models.fields.json import JSONField, KeyTransformTextLookupMixin


# JsonLogic operator to Django lookup mappings
# These map JsonLogic operators to Django field lookup names
COMPARISON_OPERATOR_LOOKUPS = {
    "==": "exact",
    "!=": "exact",
    ">": "gt",
    ">=": "gte",
    "<": "lt",
    "<=": "lte",
}

# Extended lookups that include the "in" operator for string containment
EXTENDED_OPERATOR_LOOKUPS = {
    **COMPARISON_OPERATOR_LOOKUPS,
    "in": "icontains",
}


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


def jsonlogic_to_q(
    jsonlogic: Dict[str, Any],
    field_prefix: str = "",
    recursion_func: Callable = None,
) -> Q:
    """Converts a JsonLogic query to a Django Q object.

    :param jsonlogic: The JsonLogic query to convert, stored in a Python dict. Example: {"and": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, 25]}]}
    :param field_prefix: A prefix to add to all fields in the generated query. Useful to follow a relationship or to dig in a JSONField
    :param recursion_func: Optionally specify a function to call for recursion, allowing this method to be "wrapped". By default, when no function is specified, it calls itself.

    :return: A Django Q object.
    """

    func = jsonlogic_to_q if recursion_func is None else recursion_func

    if "and" in jsonlogic:
        sub_query = Q()
        for lookup in jsonlogic["and"]:
            sub_query = operator.and_(sub_query, func(lookup, field_prefix))
        return sub_query
    if "or" in jsonlogic:
        sub_query = Q()
        for lookup in jsonlogic["or"]:
            sub_query = operator.or_(sub_query, func(lookup, field_prefix))
        return sub_query
    if "!" in jsonlogic:
        return ~func(jsonlogic["!"], field_prefix)

    if not jsonlogic.keys():
        return Q()

    # Binary operators
    op = list(jsonlogic.keys())[0]
    params = jsonlogic[op]
    if len(params) != 2:
        raise ValueError(f"Unsupported JsonLogic. Operator {op} take exactly two operands: {jsonlogic}")

    if op not in EXTENDED_OPERATOR_LOOKUPS:
        raise ValueError(
            f"Unsupported JsonLogic (unknown operator {op}): {jsonlogic}. Supported operators: {list(EXTENDED_OPERATOR_LOOKUPS.keys())}"
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

    lookup = EXTENDED_OPERATOR_LOOKUPS[op]

    f = f"{field_prefix}{field_name}{extract}__{lookup}"
    q = Q(**{f: value})

    if op == "!=":
        # invert the filter
        q = ~q
    return q


def instance_jsonlogic_to_q(
    jsonlogic: Dict[str, Any],
    field_prefix: str = "",
    recursion_func: Callable = None,
) -> Q:
    """Converts a JsonLogic query to a Django Q object for filtering Instance objects.

    This function extends the basic jsonlogic_to_q() with support for array field operations
    like "some" and "all" that work with space-separated string fields in JSON data.

    JsonLogic is a standardized way to express complex queries as JSON objects.
    See https://jsonlogic.com/ for the specification.

    Args:
        jsonlogic: The JsonLogic query as a Python dict
        field_prefix: Prefix to add to all field names (e.g., "json__" for JSONField lookups)
        recursion_func: Function to use for recursion (defaults to self)

    Returns:
        Django Q object that can be used in queryset filters

    Examples:
        # Basic comparison operators
        filters = {"==": [{"var": "gender"}, "F"]}
        q = instance_jsonlogic_to_q(filters, field_prefix="json__")
        # Result: Q(json__gender__exact="F")

        # Logical operators (AND/OR/NOT)
        filters = {
            "and": [
                {"==": [{"var": "gender"}, "F"]},
                {"<": [{"var": "age"}, 25]}
            ]
        }
        q = instance_jsonlogic_to_q(filters, field_prefix="json__")
        # Result: Q(json__gender__exact="F") & Q(json__age__lt=25)

        # Array field operations with space-separated strings
        # "some": field contains ALL specified values
        filters = {
            "some": [
                {"var": "colors"},  # field name
                {"in": [{"var": ""}, ["red", "blue"]]}  # condition
            ]
        }
        q = instance_jsonlogic_to_q(filters, field_prefix="json__")
        # Result: Q(json__colors__icontains="red") & Q(json__colors__icontains="blue")

        # "all": field contains EXACTLY the specified values (no extras)
        filters = {
            "all": [
                {"var": "colors"},
                {"in": [{"var": ""}, ["red", "blue"]]}
            ]
        }
        q = instance_jsonlogic_to_q(filters, field_prefix="json__")
        # Result: Q(json__colors__regex="^blue red$")  # sorted pattern

        # "in" operator for field in array or string containment
        filters = {"in": [{"var": "status"}, ["active", "pending"]]}
        q = instance_jsonlogic_to_q(filters, field_prefix="json__")
        # Result: Q(json__status__in=["active", "pending"])

    Supported Operators:
        - Comparison: ==, !=, >, >=, <, <=
        - Logical: and, or, ! (not)
        - Array: in, some, all
        - Field prefix handling for JSONField lookups
        - Automatic type casting for numeric values in JSON fields
    """

    recursion_function = instance_jsonlogic_to_q if recursion_func is None else recursion_func

    # Handle logical group operators (AND/OR/NOT)
    if "and" in jsonlogic:
        return _handle_and_operator(jsonlogic["and"], field_prefix, recursion_function)
    if "or" in jsonlogic:
        return _handle_or_operator(jsonlogic["or"], field_prefix, recursion_function)
    if "!" in jsonlogic:
        return ~recursion_function(jsonlogic["!"], field_prefix)

    # Handle array field operations (some/all)
    if "some" in jsonlogic or "all" in jsonlogic:
        return _handle_array_operators(jsonlogic, field_prefix, recursion_function)

    # Handle binary comparison operators
    return _handle_binary_operators(jsonlogic, field_prefix)


def _handle_and_operator(conditions: list, field_prefix: str, recursion_function: Callable) -> Q:
    """Handle AND operator by combining all conditions with logical AND."""
    sub_query = Q()
    for condition in conditions:
        sub_query = operator.and_(sub_query, recursion_function(condition, field_prefix))
    return sub_query


def _handle_or_operator(conditions: list, field_prefix: str, recursion_function: Callable) -> Q:
    """Handle OR operator by combining all conditions with logical OR."""
    sub_query = Q()
    for condition in conditions:
        sub_query = operator.or_(sub_query, recursion_function(condition, field_prefix))
    return sub_query


def _handle_array_operators(jsonlogic: Dict[str, Any], field_prefix: str, recursion_function: Callable) -> Q:
    """Handle 'some' and 'all' operators for array-like string fields.

    These operators work with space-separated string fields stored in JSON data.
    For example, if a field contains "red blue green", it can be queried with
    array operators to check for specific value combinations.

    Args:
        jsonlogic: JsonLogic dict containing 'some' or 'all' operator
        field_prefix: Field prefix for JSONField lookups
        recursion_function: Recursion function

    Returns:
        Django Q object for the array operation

    Raises:
        ValueError: If the JsonLogic structure is not supported
    """
    operator_key = "some" if "some" in jsonlogic else "all"
    var, condition = jsonlogic[operator_key]
    field = var["var"]

    # Only support: { "in": [ { "var": "" }, [array] ] }
    if "in" not in condition:
        raise ValueError(f"Unsupported JsonLogic for '{operator_key}': {jsonlogic}")

    in_params = condition["in"]
    if not (
        isinstance(in_params, list)
        and len(in_params) == 2
        and isinstance(in_params[0], dict)
        and in_params[0].get("var") == ""
    ):
        raise ValueError(f"Unsupported JsonLogic for '{operator_key}': {jsonlogic}")

    value_list = in_params[1]

    if operator_key == "some":
        # "some": field must contain ALL specified values
        # Example: field="red blue" matches ["red", "blue"] but not ["red", "yellow"]
        return _build_some_query(field, value_list, field_prefix)

    if operator_key == "all":
        # "all": field must contain EXACTLY the specified values (no extras)
        # Example: field="red blue" matches ["red", "blue"] but not ["red", "blue", "green"]
        return _build_all_query(field, value_list, field_prefix)

    raise ValueError(f"Unsupported JsonLogic for '{operator_key}': {jsonlogic}")


def _build_some_query(field: str, value_list: list, field_prefix: str) -> Q:
    """Build query for 'some' operator: field must contain all specified values."""
    q = Q()
    for value in value_list:
        q = q & Q(**{f"{field_prefix}{field}__icontains": value})
    return q


def _build_all_query(field: str, value_list: list, field_prefix: str) -> Q:
    """Build query for 'all' operator: field must contain exactly the specified values.

    Uses regex pattern matching to ensure the field contains only the specified values
    in any order, with no extra values.
    """
    # Sort the value list for consistent comparison
    sorted_values = sorted(value_list)
    # Create a pattern that matches the sorted string representation
    pattern = r"^" + r" ".join(re.escape(v) for v in sorted_values) + r"$"
    return Q(**{f"{field_prefix}{field}__regex": pattern})


def _handle_binary_operators(jsonlogic: Dict[str, Any], field_prefix: str) -> Q:
    """Handle binary comparison operators (==, !=, >, >=, <, <=, in).

    Args:
        jsonlogic: JsonLogic dict containing a single binary operator
        field_prefix: Field prefix for JSONField lookups

    Returns:
        Django Q object for the binary operation

    Raises:
        ValueError: If the JsonLogic structure is not supported
    """
    if not jsonlogic.keys():
        return Q()

    op = list(jsonlogic.keys())[0]
    params = jsonlogic[op]

    if len(params) != 2:
        raise ValueError(f"Unsupported JsonLogic. Operator {op} takes exactly two operands: {jsonlogic}")

    # Handle "in" operator specially (field in array vs string containment)
    if op == "in":
        return _handle_in_operator(params, field_prefix)

    # Handle standard comparison operators
    return _handle_comparison_operators(op, params, field_prefix)


def _handle_in_operator(params: list, field_prefix: str) -> Q:
    """Handle 'in' operator for field in array or string containment.

    Supports two patterns:
    1. field in array: {"in": [{"var": "status"}, ["active", "pending"]]}
    2. string containment: {"in": [{"var": "name"}, "john"]}
    """
    field, value = params[0], params[1]

    if "var" not in field:
        raise ValueError("Unsupported 'in' usage: field must be a variable")

    field_name = field["var"]

    if isinstance(value, list):
        # Field in array: {"in": [{"var": "status"}, ["active", "pending"]]}
        return Q(**{f"{field_prefix}{field_name}__in": value})

    if isinstance(value, str):
        # String containment: {"in": [{"var": "name"}, "john"]}
        return Q(**{f"{field_prefix}{field_name}__icontains": value})

    raise ValueError(f"Unsupported 'in' usage: {params}")


def _handle_comparison_operators(op: str, params: list, field_prefix: str) -> Q:
    """Handle standard comparison operators (==, !=, >, >=, <, <=)."""
    if op not in COMPARISON_OPERATOR_LOOKUPS:
        raise ValueError(
            f"Unsupported JsonLogic (unknown operator {op}): {params}. "
            f"Supported operators: {list(COMPARISON_OPERATOR_LOOKUPS.keys()) + ['in', 'some', 'all']}"
        )

    field = params[0]
    value = params[1]

    if "var" not in field:
        raise ValueError(f"Unsupported JsonLogic. First argument must contain a variable: {params}")

    field_name = field["var"]

    # Handle numeric type casting for JSON fields
    extract = ""
    if isinstance(value, (int, float)) and field_prefix:
        # Since JSON fields store everything as strings, we need to cast back to numeric
        extract = "__forcefloat"

    lookup = COMPARISON_OPERATOR_LOOKUPS[op]
    field_lookup = f"{field_prefix}{field_name}{extract}__{lookup}"
    q = Q(**{field_lookup: value})

    # Handle negation for != operator
    if op == "!=":
        q = ~q

    return q


def entities_jsonlogic_to_q(jsonlogic: Dict[str, Any], field_prefix: str = "") -> Q:
    """This enhances the jsonlogic_to_q() method to allow filtering entities on
    the submitted values of their instances.
    It also converts a JsonLogic query to a Django Q object.

    :param jsonlogic: The JsonLogic query to convert, stored in a Python dict. Example:
    {
        "and": [
            {
                "some": [
                    { "var": "form_1_id" },
                    {
                        "and": [
                            { "==": [{"var": "gender"}, "female"] },
                            { "==": [{"var": "serie_id"}, "2"] }
                        ]
                    }
                ]
            },
            {
                "some": [
                    { "var": "form_2_id" },
                    { "==": [{"var": "result"}, "negative"] }
                ]
            }
        ]
    }

    :return: A Django Q object.
    """
    from iaso.models import Instance

    if "some" in jsonlogic or "all" in jsonlogic or "none" in jsonlogic:
        operator = list(jsonlogic.keys())[0]  # there's only 1 key
        form_var, conditions = jsonlogic[operator]
        form_id = form_var["var"]

        form_id_filter = Q(entity_id=OuterRef("id")) & Q(form__form_id=form_id)

        if operator == "some":
            return Exists(Instance.objects.filter(form_id_filter & entities_jsonlogic_to_q(conditions, field_prefix)))
        if operator == "all":
            # In case of "all", we do a double filter:
            # - EXIST on the form without conditions to exclude entities that don't have the form
            # - NOT EXIST on the form with inverted conditions, so only get forms that only have
            #   the desired conditions
            return Exists(Instance.objects.filter(form_id_filter)) & ~Exists(
                Instance.objects.filter(form_id_filter & ~entities_jsonlogic_to_q(conditions, field_prefix))
            )
        if operator == "none":
            return ~Exists(Instance.objects.filter(form_id_filter & entities_jsonlogic_to_q(conditions, field_prefix)))
    else:
        return jsonlogic_to_q(
            jsonlogic,
            field_prefix="json__",
            recursion_func=entities_jsonlogic_to_q,
        )


def matches_all(field_value, expected_list):
    return sorted(field_value.split()) == sorted(expected_list)
