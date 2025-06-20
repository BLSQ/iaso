"""JsonLogic(https://jsonlogic.com/)-related utilities."""

import operator

from typing import Any, Callable, Dict

from django.db.models import Exists, OuterRef, Q, Transform, Case, When, Sum, IntegerField
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

LOOKUPS = {
    "==": "exact",
    "!=": "exact",
    ">": "gt",
    ">=": "gte",
    "<": "lt",
    "<=": "lte",
    "in": "icontains",
}

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

    if op not in LOOKUPS.keys():
        raise ValueError(
            f"Unsupported JsonLogic (unknown operator {op}): {jsonlogic}. Supported operators: f{LOOKUPS.keys()}"
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

    lookup = LOOKUPS[op]

    f = f"{field_prefix}{field_name}{extract}__{lookup}"
    q = Q(**{f: value})

    if op == "!=":
        # invert the filter
        q = ~q
    return q

def annotation_jsonlogic_to_q(jsonlogic: Dict[str, Any], id_field_name: str= "", value_field_name: str = "") -> tuple[dict[str, Sum], dict[str, list]]:
    """This enhances the jsonlogic_to_q() method to allow filtering entities on
    multiple criteria for same properties.
    It will convert a JsonLogic query to a Django annotation and Q object to apply on annotations.
    It only accept one level deep.

    Exemple of usage: 
    annotations, filters = annotation_jsonlogic_to_q(json.loads(json_filter), "metric_type", "value")
    filteredOrgUnitIds = queryset.values('org_unit_id')
        .annotate(**annotations).filter(filters)
        .values_list('org_unit_id', flat=True)

    :param id_field_name: the identifier field name for "var" of json logic to target
    :value_field_name: the value field name to target
    :jsonlogic:
     "or":[
        {">=":[{"var":"23"},900]},
        {"==":[{"var":"22"},700]},
        {"and":[
            {"<=":[{"var":"23"},1500]},
            {"==":[{"var":"24"},1000]}
        ]}
    ]
    :return: 
    Annotations:
    {
        '23__gte__900': 
            Sum(CASE WHEN <Q: (AND: ('metric_type__exact', '23'), ('value__gte', 900))> THEN Value(1), ELSE Value(0)), 
        '22__exact__700': 
            Sum(CASE WHEN <Q: (AND: ('metric_type__exact', '22'), ('value__exact', 700))> THEN Value(1), ELSE Value(0)),
        '23__lte__1500': 
            Sum(CASE WHEN <Q: (AND: ('metric_type__exact', '23'), ('value__lte', 1500))> THEN Value(1), ELSE Value(0)),
        '24__exact__1000': 
            Sum(CASE WHEN <Q: (AND: ('metric_type__exact', '24'), ('value__exact', 1000))> THEN Value(1), ELSE Value(0))
    }
    Annotation filters: {
    'or': [
        <Q: (AND: {'23__gte__900': True})>,
        <Q: (AND: {'22__exact__700': True})>,
        {'and': [
            <Q: (AND: {'23__lte__1500': True})>, 
            <Q: (AND: {'24__exact__1000': True})>
        ]}
    ]}
    """
    # TODO Bullet proof this function, it is used in the API and it is not well tested.

    if "and" in jsonlogic or "or" in jsonlogic or "!" in jsonlogic:
        key = "and" if "and" in jsonlogic else "or" if "or" in jsonlogic else "!"
        operation = operator.and_ if key == "and" else operator.or_ if key == "or" else operator.not_
        # This will hold all the annotations, which are used to compose the HAVING statement.
        all_annotations: dict[str, Case] = {}
        # Used to construct the HAVING statement, this is delegated to the caller.
        annotation_query = Q()
        for lookup in jsonlogic[key]:
            annotations, annotation_sub_query = annotation_jsonlogic_to_q(lookup, id_field_name, value_field_name)
            if annotation_sub_query:
                # If we have a sub query, we need to add it to the annotation query.
                annotation_query = operation(annotation_query, annotation_sub_query)
            if annotations:
                all_annotations.update(annotations)
                # If annotation has only one key, it means that it is a nested query
                if (len(annotations.keys()) == 1):
                    akey= next(iter(annotations))
                    annotation_query = operation(annotation_query, Q(**{f"{akey}__gte": 1}))

        return all_annotations, annotation_query  
              
    if len(jsonlogic) == 1:
        # binary operator # >= and such
        op = list(jsonlogic.keys())[0] 
        # params [{"var":"22"}, 700]
        params = jsonlogic[op]
        # {"var": "22"} => to explode
        var_obj = next((arg for arg in params if isinstance(arg, dict) and "var" in arg), None)
        id_field_value = var_obj["var"] # TODO verify if not None
        # 700, all good
        value_field_value = next((arg for arg in params if arg != var_obj), None)
        # Create query object 
        # TODO Check for extract and field_prefix on other functions
        lookup = LOOKUPS[op]
        value_f = f"{value_field_name}__{lookup}"
        # Add ID filter
        id_f = f"{id_field_name}__exact"

        annotation = {
            f"{id_field_value}__{lookup}__{value_field_value}": Sum(Case(
                When(**{id_f: id_field_value}, **{value_f: value_field_value}, then=1),
                default=0,
                output_field=IntegerField()
            ))
        }

        return annotation, None
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