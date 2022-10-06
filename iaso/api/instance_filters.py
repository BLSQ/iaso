import json
from typing import Dict, Optional

from django.http import QueryDict

from iaso.periods import Period


def parse_instance_filters(req: QueryDict) -> Dict:
    if req.get("startPeriod", None) or req.get("endPeriod", None):
        periods = Period.range_string_with_sub_periods(req.get("startPeriod", None), req.get("endPeriod", None))
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
        "search": req.get("search", None),
        "status": req.get("status", None),
        "from_date": req.get("dateFrom", None),
        "to_date": req.get("dateTo", None),
        "show_deleted": show_deleted,
        "entity_id": req.get("entityId", None),
        "json_content": json_content,
    }
