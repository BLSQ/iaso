def parse_instance_filters(request):
    return {
        "form_id": request.GET.get("form_id", None),
        "with_location": request.GET.get("withLocation", None),
        "org_unit_type_id": request.GET.get("orgUnitTypeId", None),
        "device_id": request.GET.get("deviceId", None),
        "device_ownership_id": request.GET.get("deviceOwnershipId", None),
        "org_unit_parent_id": request.GET.get("orgUnitParentId", None),
        "org_unit_id": request.GET.get("orgUnitId", None),
        "period_ids": request.GET.get("periods", None),
        "status": request.GET.get("status", None),
    }
