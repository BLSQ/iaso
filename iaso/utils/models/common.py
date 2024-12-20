from typing import Dict, List

from django.db.models import QuerySet

from iaso.models.base import User


def get_creator_name(creator: User = None, username: str = "", first_name: str = "", last_name: str = "") -> str:
    if isinstance(creator, User):
        username = creator.username
        first_name = creator.first_name
        last_name = creator.last_name
    if username and first_name and last_name:
        return f"{username} ({first_name} {last_name})"
    elif username:
        return username
    return ""


def get_org_unit_parents_ref(field_name, org_unit, parent_source_ref_field_names, parent_field_ids):
    if org_unit.get(field_name):
        return org_unit.get(field_name)
    else:
        parent_index = parent_source_ref_field_names.index(field_name)
        parent_ref = org_unit.get(parent_field_ids[parent_index])
        """if the external reference id is missing, prefix with iaso the internal id. e.g: 'iaso#1475'"""
        if parent_ref:
            return f"iaso#{parent_ref}"
        return None


def check_instance_bulk_gps_push(queryset: QuerySet) -> (bool, Dict[str, List[int]], Dict[str, List[int]]):
    """
    Determines if there are any warnings or errors if the given Instances were to push their own location to their OrgUnit.

    There are 2 types of warnings:
    - warning_no_location: if an Instance doesn't have any location
    - warning_overwrite: if the Instance's OrgUnit already has a location
    The gps push can be performed even if there are any warnings, keeping in mind the consequences.

    There are 2 types of errors:
    - error_same_org_unit: if there are multiple Instances in the given queryset that share the same OrgUnit
    - error_read_only_source: if any Instance's OrgUnit is part of a read-only DataSource
    The gps push cannot be performed if there are any errors.
    """
    # Variables used for warnings
    set_org_units_ids = set()
    overwrite_ids = []
    no_location_ids = []

    # Variables used for errors
    org_units_to_instances_dict = {}
    read_only_data_sources = []

    for instance in queryset:
        # First, let's check for potential errors
        org_unit = instance.org_unit
        if org_unit.id in org_units_to_instances_dict:
            # we can't push this instance's location since there was another instance linked to this OrgUnit
            org_units_to_instances_dict[org_unit.id].append(instance.id)
            continue
        else:
            org_units_to_instances_dict[org_unit.id] = [instance.id]

        if org_unit.version and org_unit.version.data_source.read_only:
            read_only_data_sources.append(instance.id)
            continue

        # Then, let's check for potential warnings
        if not instance.location:
            no_location_ids.append(instance.id)  # there is nothing to push to the OrgUnit
            continue

        set_org_units_ids.add(org_unit.id)
        if org_unit.location or org_unit.geom:
            overwrite_ids.append(instance.id)  # if the user proceeds, he will erase existing location
            continue

    # Before returning, we need to check if we've had multiple hits on an OrgUnit
    error_same_org_unit_ids = _check_bulk_gps_repeated_org_units(org_units_to_instances_dict)

    success: bool = not read_only_data_sources and not error_same_org_unit_ids
    errors = {}
    if read_only_data_sources:
        errors["error_read_only_source"] = read_only_data_sources
    if error_same_org_unit_ids:
        errors["error_same_org_unit"] = error_same_org_unit_ids
    warnings = {}
    if no_location_ids:
        warnings["warning_no_location"] = no_location_ids
    if overwrite_ids:
        warnings["warning_overwrite"] = overwrite_ids

    return success, errors, warnings


def _check_bulk_gps_repeated_org_units(org_units_to_instance_ids: Dict[int, List[int]]) -> List[int]:
    error_instance_ids = []
    for _, instance_ids in org_units_to_instance_ids.items():
        if len(instance_ids) >= 2:
            error_instance_ids.extend(instance_ids)
    return error_instance_ids
