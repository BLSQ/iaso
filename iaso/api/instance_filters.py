import json
from typing import Dict, Any, Optional

from django.http import QueryDict

from iaso.models import Form
from iaso.periods import Period, DayPeriod
from iaso.api import query_params as query


def parse_instance_filters(req: QueryDict) -> Dict[str, Any]:
    periods_bound = None
    if req.get(query.START_PERIOD, None) or req.get(query.END_PERIOD, None):
        # as a compromise for now to limit the performance impact when we search for higher level we don't include
        #  the day periods
        from_period, to_period = Period.bound_range(req.get(query.START_PERIOD, None), req.get(query.END_PERIOD, None))
        if isinstance(from_period, DayPeriod) or isinstance(to_period, DayPeriod):
            periods = None
            periods_bound = str(from_period) if from_period else None, str(to_period) if to_period else None
        else:
            periods = Period.range_string_with_sub_periods(from_period, to_period)
    else:
        # TODO: the following line feels weird, is it really doing what we want?
        periods = req.get(query.PERIOD_IDS, req.get(query.PERIODS, req.get(query.PERIOD, None)))  # type: ignore
    # the front end sends "true" or "false" so we need to check against the string values for the filter to work
    show_deleted: Optional[str] = req.get(query.SHOW_DELETED, "false")
    if show_deleted == "false":
        show_deleted = None

    json_content = req.get(query.JSON_CONTENT, None)
    if json_content is not None:
        # This filter is passed as a JsonLogic string in the URL, convert it to a Python dict already
        json_content = json.loads(json_content)

    return {
        "form_id": req.get(query.FORM_ID, None),
        "form_ids": req.get(query.FORM_IDS, None),
        "with_location": req.get(query.WITH_LOCATION, None),
        "org_unit_type_id": req.get(query.ORG_UNIT_TYPE_ID, None),
        "device_id": req.get(query.DEVICE_ID, None),
        "device_ownership_id": req.get(query.DEVICE_OWNERSHIP_ID, None),
        "org_unit_parent_id": req.get(query.ORG_UNIT_PARENT_ID, None),
        "org_unit_id": req.get(query.ORG_UNIT_ID, None),
        "period_ids": periods,
        "periods_bound": periods_bound,
        "planning_ids": req.get(query.PLANNING_IDS, None),
        "search": req.get(query.SEARCH, None),
        "status": req.get(query.STATUS, None),
        "from_date": req.get(query.DATE_FROM, None),
        "to_date": req.get(query.DATE_TO, None),
        "show_deleted": show_deleted,
        "entity_id": req.get(query.ENTITY_ID, None),
        "user_ids": req.get(query.USER_IDS, None),
        "json_content": json_content,
    }


# TODO: if we end up with multiple function that deal with instance filters, we should probably move this to a class
def get_form_from_instance_filters(instance_filters: Dict[str, Any]) -> Optional[Form]:
    """
    Inspect the form_id and form_ids fields of the filters and return a Form object

    It assumes that either form_id is set, or forms_ids contains a single element.
    Returns None if there's no form id, or if they are multiple entries in form_ids
    """
    form_id = instance_filters["form_id"]
    form_ids = instance_filters["form_ids"]

    form = None
    if form_id:
        form = Form.objects.get(pk=form_id)
    elif form_ids:
        form_ids = form_ids.split(",")
        if len(form_ids) == 1:  # if there is only one form_ids specified
            form = Form.objects.get(pk=form_ids[0])

    return form
