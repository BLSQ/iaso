"""JsonLogic(https://jsonlogic.com/)-related utilities."""

import operator

from typing import Any, Callable, Dict

from django.db.models import Exists, OuterRef, Q, Transform, Case, When, Value, BooleanField
from django.db.models.fields.json import JSONField, KeyTransformTextLookupMixin


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

def keyvalue_jsonlogic_to_q(jsonlogic: Dict[str, Any], id_field_name: str= "", value_field_name: str = "", group_field_name: str = "") -> tuple[Q, dict[str, Case], dict[str, list]]:
    """This enhances the jsonlogic_to_q() method to allow filtering entities on
    multiple criteria for same properties.
    It will convert a JsonLogic query to a Django Q object
    It only accept one level deep.

    :param id_field_name: the identifier field name for "var" of json logic to target
    :value_field_name: the value field name to target
    :group_field_name: the field on which result will be grouped
    :jsonlogic:
    { "and":
        [{">=":[
            {"var":"23"},
            900
        ]},
        {"==":[
            {"var":"22"},
            700
        ]}]
    }
    :return: 
    A Django Q Object:
    Annotations:
    {
        '23__gte__900': 
            <Case: CASE WHEN <Q: (AND: ('metric_type__exact', '23'), ('value__gte', 900))> THEN Value(True), ELSE Value(False)>, 
        '22__exact__700': 
            <Case: CASE WHEN <Q: (AND: ('metric_type__exact', '22'), ('value__exact', 700))> THEN Value(True), ELSE Value(False)>, 
        '23__lte__1500': 
            <Case: CASE WHEN <Q: (AND: ('metric_type__exact', '23'), ('value__lte', 1500))> THEN Value(True), ELSE Value(False)>, 
        '24__exact__1000': 
             <Case: CASE WHEN <Q: (AND: ('metric_type__exact', '24'), ('value__exact', 1000))> THEN Value(True), ELSE Value(False)>
    }
    Annotation filters: 
    {'or': [
        <Q: (AND: {'23__gte__900': True})>, 
        <Q: (AND: {'22__exact__700': True})>, 
        {'and': [
            <Q: (AND: {'23__lte__1500': True})>, 
            <Q: (AND: {'24__exact__1000': True})>
        ]}
    ]}
    """
    from iaso.models import Instance

    # TODO Share this
    lookups = {
        "==": "exact",
        "!=": "exact",
        ">": "gt",
        ">=": "gte",
        "<": "lt",
        "<=": "lte",
        "in": "icontains",
    }

    if "and" in jsonlogic or "or" in jsonlogic or "!" in jsonlogic:
        key = "and" if "and" in jsonlogic else "or" if "or" in jsonlogic else "!"
        sub_query = Q()
        allAnnotations: dict[str, Case] = {}
        allFilters = { key: [] }
        for lookup in jsonlogic[key]:
            jsonToQ, annotations, filters = keyvalue_jsonlogic_to_q(lookup, id_field_name, value_field_name, group_field_name)
            if annotations:
                allAnnotations.update(annotations)
                if (len(annotations.keys()) == 1):
                    akey= next(iter(annotations))
                    allFilters[key].append(Q({akey: True}))

            if filters:
                # We need to keep nesting here, otherwise the rule will be flatten and will loose their purpose.
                allFilters[key].append(filters)
            # OR is forced is by purpose, we want all records matching any query to compose HAVING later on
            sub_query = operator.or_(sub_query, jsonToQ)
        return sub_query, allAnnotations, allFilters            

    elif len(jsonlogic) == 1:
        # binary operator # >= and such
        op = list(jsonlogic.keys())[0] 
        # params [{"var":"22"}, 700]
        params = jsonlogic[op]
        # {"var": "22"} => to explode
        var_obj = next((arg for arg in params if isinstance(arg, dict) and "var" in arg), None)
        id_field_value = var_obj["var"] # TODO verify if not None
        # 700, all good
        value_field_value = next((arg for arg in params if arg != var_obj), None)
        # Create query object (Check for extract and field_prefix on other functions)
        lookup = lookups[op]
        value_f = f"{value_field_name}__{lookup}"
        simple_query = Q(**{value_f: value_field_value})
        # Add ID filter
        id_f = f"{id_field_name}__exact"
        id_query = Q(**{id_f: id_field_value})

        annotation = {
            f"{id_field_value}__{lookup}__{value_field_value}": Case(
                When(**{id_f: id_field_value}, **{value_f: value_field_value}, then=Value(True)),
                default=Value(False),
                output_field=BooleanField()
            )
        }

        return operator.and_(id_query, simple_query), annotation, None



        # TODO use OR instead of AND in where clause.
        # TODO Add Having statement
        # SQL: 
    #     HAVING
    # SUM(CASE WHEN metric_type = 22 AND value > 100 THEN 1 ELSE 0 END) > 0
    # AND SUM(CASE WHEN metric_type = 23 AND value < 50 THEN 1 ELSE 0 END) > 0
    # OR  SUM(CASE WHEN metric_type = 24 AND value = 75 THEN 1 ELSE 0 END) > 0
    # Translates to Q()
    #.annotate(
    #     cond_22=Count(Case(
    #         When(metric_type=22, value__gt=100, then=1),
    #         output_field=IntegerField()
    #     )),
    #     cond_23=Count(Case(
    #         When(metric_type=23, value__lt=50, then=1),
    #         output_field=IntegerField()
    #     )),
    #     cond_24=Count(Case(
    #         When(metric_type=24, value=75, then=1),
    #         output_field=IntegerField()
    #     )),
    # )
    # .filter(
    #     (Q(cond_22__gt=0) & Q(cond_23__gt=0)) | Q(cond_24__gt=0)
    # )
    return

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