def parse_instance_filters(req):
    return {
        "form_id": req.get("form_id", None),
        "form_ids": req.get("form_ids", None),
        "with_location": req.get("withLocation", None),
        "org_unit_type_id": req.get("orgUnitTypeId", None),
        "device_id": req.get("deviceId", None),
        "device_ownership_id": req.get("deviceOwnershipId", None),
        "org_unit_parent_id": req.get("orgUnitParentId", None),
        "org_unit_id": req.get("orgUnitId", None),
        "period_ids": req.get("period_ids", req.get("periods", req.get("period", None))),
        "search": req.get("search", None),
        "status": req.get("status", None),
        "from_date": req.get("dateFrom", None),
        "to_date": req.get("dateTo", None),
        "show_deleted": req.get("showDeleted", None),
    }
