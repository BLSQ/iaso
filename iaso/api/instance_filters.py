import json
from typing import Dict, Any, Optional

from django.http import QueryDict

from iaso.models import Form
from iaso.periods import Period, DayPeriod


def parse_instance_filters(req: QueryDict) -> Dict[str, Any]:
    periods_bound = None
    if req.get("startPeriod", None) or req.get("endPeriod", None):
        # as a compromise for now to limit the performance impact when we search for higher level we don't include
        #  the day periods
        from_period, to_period = Period.bound_range(req.get("startPeriod", None), req.get("endPeriod", None))
        if isinstance(from_period, DayPeriod) or isinstance(to_period, DayPeriod):
            periods = None
            periods_bound = str(from_period) if from_period else None, str(to_period) if to_period else None
        else:
            periods = Period.range_string_with_sub_periods(from_period, to_period)
    else:
        # TODO: the following line feels weird, is it really doing what we want?
        periods = req.get("period_ids", req.get("periods", req.get("period", None)))  # type: ignore
    # the front end sends "true" or "false" so we need to check against the string values for the filter to work
    show_deleted: Optional[str] = req.get("showDeleted", "false")
    if show_deleted == "false":
        show_deleted = None

    json_content = req.get("jsonContent", None)
    if json_content is not None:
        # This filter is passed as a JsonLogic string in the URL, convert it to a Python dict already
        json_content = json.loads(json_content)
    return {
        "form_id": req.get("form_id", None),
        "form_ids": req.get("form_ids", None),
        "with_location": req.get("withLocation", None),
        "org_unit_type_id": req.get("orgUnitTypeId", None),
        "device_id": req.get("deviceId", None),
        "device_ownership_id": req.get("deviceOwnershipId", None),
        "org_unit_parent_id": req.get("orgUnitParentId", None),
        "org_unit_id": req.get("orgUnitId", None),
        "period_ids": periods,
        "periods_bound": periods_bound,
        "search": req.get("search", None),
        "status": req.get("status", None),
        "from_date": req.get("dateFrom", None),
        "to_date": req.get("dateTo", None),
        "show_deleted": show_deleted,
        "entity_id": req.get("entityId", None),
        "should_compute_sums_avgs": req.get("shouldComputeSumsAvgs", None),
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
