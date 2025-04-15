from collections import Counter
from typing import Dict, List

from django.db.models import Exists, OuterRef, QuerySet

from iaso.models.base import User


def get_creator_name(creator: User = None, username: str = "", first_name: str = "", last_name: str = "") -> str:
    if isinstance(creator, User):
        username = creator.username
        first_name = creator.first_name
        last_name = creator.last_name
    if username and first_name and last_name:
        return f"{username} ({first_name} {last_name})"
    if username:
        return username
    return ""


def get_org_unit_parents_ref(field_name, org_unit, parent_source_ref_field_names, parent_field_ids):
    if org_unit.get(field_name):
        return org_unit.get(field_name)
    parent_index = parent_source_ref_field_names.index(field_name)
    parent_ref = org_unit.get(parent_field_ids[parent_index])
    """if the external reference id is missing, prefix with iaso the internal id. e.g: 'iaso:1475'"""
    if parent_ref:
        return f"iaso:{parent_ref}"
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

    This function returns lists of targeted OrgUnit IDs in case of warnings or errors.
    """
    # Variables used for warnings
    set_org_units_ids = set()
    overwrite_ids = []
    no_location_ids = []

    # Variables used for errors
    read_only_data_sources = []
    repeated_org_units = set()

    for instance in queryset:
        # First, let's check for potential errors
        org_unit = instance.org_unit
        if org_unit.id in set_org_units_ids:
            # we can't push this instance's location since there was another instance linked to this OrgUnit
            repeated_org_units.add(org_unit.id)
            continue

        set_org_units_ids.add(org_unit.id)

        if org_unit.version and org_unit.version.data_source.read_only:
            read_only_data_sources.append(org_unit.id)
            continue

        # Then, let's check for potential warnings
        if not instance.location:
            no_location_ids.append(org_unit.id)  # there is nothing to push to the OrgUnit
            continue

        if org_unit.location or org_unit.geom:
            overwrite_ids.append(org_unit.id)  # if the user proceeds, he will erase existing location
            continue

    success: bool = not read_only_data_sources and not repeated_org_units
    errors = {}
    if read_only_data_sources:
        errors["error_read_only_source"] = read_only_data_sources
    if repeated_org_units:
        errors["error_same_org_unit"] = repeated_org_units
    warnings = {}
    if no_location_ids:
        warnings["warning_no_location"] = no_location_ids
    if overwrite_ids:
        warnings["warning_overwrite"] = overwrite_ids

    return success, errors, warnings

def check_instance_reference_bulk_link(queryset: QuerySet) -> (bool, Dict[str, List[int]], Dict[str, List[int]]): # type: ignore
    from iaso.models.org_unit import OrgUnitReferenceInstance, OrgUnitType
    queryset = queryset.annotate(
        has_matching_reference_form=Exists(
            OrgUnitType.reference_forms.through.objects.filter(
                orgunittype_id=OuterRef("org_unit__org_unit_type"),  
                form_id=OuterRef("form_id") 
            )
        )
    )
    
    not_reference_instances = queryset.filter(has_matching_reference_form=False).values_list("id", flat=True)
    reference_instances = queryset.filter(has_matching_reference_form=True)

    linked_and_unlinked = reference_instances.annotate(
        is_linked=Exists(
            OrgUnitReferenceInstance.objects.filter(instance_id=OuterRef("id"))
        )
    )

    orgunit_form_pairs = list(linked_and_unlinked.values_list("org_unit_id", "form_id"))
    duplicates_count = Counter(orgunit_form_pairs)
    duplicate_org_unit_form_id_pairs = [pair for pair, count in duplicates_count.items() if count > 1]

  
    warnings = {}
    errors = {}
    infos = {}
    success: bool = not duplicate_org_unit_form_id_pairs
    if duplicate_org_unit_form_id_pairs:
        errors["error_multiple_instances_same_org_unit"] = duplicate_org_unit_form_id_pairs
        return success, infos, errors, warnings
    
    linked_instances = linked_and_unlinked.filter(is_linked=True).values_list("id", flat=True)
    unlinked_instances = linked_and_unlinked.filter(is_linked=False).values_list("id", flat=True)   

    if not_reference_instances:
        warnings["no_reference_instances"] = not_reference_instances
    infos["linked"] = linked_instances
    infos["not_linked"] = unlinked_instances

    return success, infos, errors, warnings

