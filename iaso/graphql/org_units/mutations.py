"""`bulkUpdateOrgUnits`: v1's bulk update (`POST /api/tasks/create/orgunitsbulkupdate/`) - a validation status, an
org unit type, groups to add or remove - on the org units an `OrgUnitFilter` matches, rather than a selection of ids
and v1 searches; and a new parent, which v1 can't do in bulk.

The mutation only checks the request and queues a task, refusing the problems it can see then in its payload's
`errors` (`..errors`): the filters are applied by the task, to the org units visible to the user when it runs. The
task checks what depends on them - read-only sources, moves - and refuses with the same structured errors on the
`Task` (status `ERRORED`). Otherwise it updates them all in one transaction (all or nothing: an error or a kill
leaves them as they were), skipping those of a type the user can't edit, with a `Modification` (`org_unit_api_bulk`)
for each one."""

from copy import deepcopy
from typing import Any, Dict, List

from ariadne import MutationType
from django.db import transaction
from django.utils import timezone
from graphql import GraphQLError, GraphQLResolveInfo
from graphql.utilities import ast_from_value, coerce_input_value, value_from_ast_untyped

from beanstalk_worker import task_decorator
from hat.audit.models import ORG_UNIT_API_BULK, log_modification
from iaso.models import ERRORED, Group, OrgUnit, OrgUnitType, Task
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION

from ..common import MAX_IN_VALUES, requesting_user, visible_org_unit
from ..errors import Errors, payload
from .filters import apply_filters


#: a progress report is a query and a save of the task: not for each org unit
PROGRESS_EVERY = 100
#: in the messages; the result lists them all
IDS_IN_MESSAGE = 20

mutation = MutationType()


@mutation.field("bulkUpdateOrgUnits")
@payload("task")
def resolve_bulk_update(_, info: GraphQLResolveInfo, filters: Dict[str, Any], update: Dict[str, Any]) -> Task:
    user = requesting_user(info)
    if not user.has_perm(CORE_ORG_UNITS_PERMISSION.full_name()):
        raise GraphQLError("You do not have permission to edit org units.", extensions={"code": "FORBIDDEN"})
    errors = Errors()
    update = {name: value for name, value in update.items() if value is not None}
    if not update:
        errors.add(
            "INVALID", "Nothing to update: give a validationStatus, an orgUnitTypeId, a parentId or groups", ["update"]
        )
    check_update(user, update, errors)
    # now rather than in the task: a filter referencing an org unit the user can't see, a bad bbox... one by one, to
    # report each of them
    visible = OrgUnit.objects.filter_for_user(user)
    for name, value in filters.items():
        try:
            apply_filters(visible, {name: value}, user)
        except GraphQLError as error:
            errors.add("INVALID", error.message, ["filters", name])
    errors.raise_if_any()

    filter_type = info.schema.get_type("OrgUnitFilter")
    return bulk_update_org_units(
        # back to JSON, as the request could have sent it: the task's params are JSON, the dates and datetimes aren't
        filters=value_from_ast_untyped(ast_from_value(filters, filter_type)),
        update=update,
        user=user,
    )


def check_update(user, update: Dict[str, Any], errors: Errors) -> None:
    """The type and the groups exist in the user's account, the parent is visible to the user."""
    parent_id = update.get("parentId")
    if parent_id is not None:
        try:
            if visible_org_unit(user, parent_id, "path").path is None:
                errors.add(
                    "INVALID",
                    f"Org unit {parent_id} has no place in the pyramid yet (no path): it can't be a parent",
                    ["update", "parentId"],
                )
        except GraphQLError as error:
            errors.add("NOT_FOUND", error.message, ["update", "parentId"])
    org_unit_type_id = update.get("orgUnitTypeId")
    if org_unit_type_id is not None:
        if not OrgUnitType.objects.filter_for_user_and_app_id(user).filter(pk=org_unit_type_id).exists():
            errors.add("NOT_FOUND", f"Org unit type {org_unit_type_id} does not exist", ["update", "orgUnitTypeId"])
    added, removed = update.get("groupIdsAdded", []), update.get("groupIdsRemoved", [])
    if len(added) + len(removed) > MAX_IN_VALUES:
        errors.add("INVALID", f"At most {MAX_IN_VALUES} groups added and removed", ["update"])
        return
    group_ids = {*added, *removed}
    found = set(Group.objects.filter_for_user(user).filter(pk__in=group_ids).values_list("id", flat=True))
    for name, values in (("groupIdsAdded", added), ("groupIdsRemoved", removed)):
        for index, group_id in enumerate(values):
            if group_id not in found:
                errors.add("NOT_FOUND", f"Group {group_id} does not exist", ["update", name, index])
    for index, group_id in enumerate(removed):
        if group_id in added:
            errors.add("INVALID", f"Group {group_id} is both added and removed", ["update", "groupIdsRemoved", index])


@task_decorator(task_name="org_units_graphql_bulk_update")
def bulk_update_org_units(filters: Dict[str, Any], update: Dict[str, Any], task: Task):
    # circular: the schema imports this module, for the mutation
    from iaso.graphql.schema import schema

    user = task.launcher
    task.report_progress_and_stop_if_killed(progress_message="Searching for the org units to update")
    filters = coerce_input_value(filters, schema.get_type("OrgUnitFilter"))
    org_units = apply_filters(OrgUnit.objects.filter_for_user(user), filters, user)
    parent = OrgUnit.objects.get(pk=update["parentId"]) if "parentId" in update else None
    errors = Errors()
    read_only = list(
        org_units.filter(version__data_source__read_only=True)
        .order_by("id")
        .values_list("id", flat=True)[: IDS_IN_MESSAGE + 1]
    )
    if read_only:
        errors.add("NOT_EDITABLE", f"Org units in a read-only source: ids {ids(read_only)}", ["filters"])
    if parent is not None:
        check_move(org_units, parent, errors)
    if errors:
        refuse(task, errors.errors)
        return

    total = org_units.count()
    validation_status = update.get("validationStatus")
    org_unit_type = OrgUnitType.objects.get(pk=update["orgUnitTypeId"]) if "orgUnitTypeId" in update else None
    groups_added = list(Group.objects.filter(pk__in=update.get("groupIdsAdded", [])))
    groups_removed = list(Group.objects.filter(pk__in=update.get("groupIdsRemoved", [])))
    editable_type_ids = user.iaso_profile.get_editable_org_unit_type_ids()
    updated, skipped = 0, []

    with transaction.atomic():
        for index, org_unit in enumerate(org_units.order_by("id").iterator()):
            if index % PROGRESS_EVERY == 0:
                # through the worker's own connection: visible while this transaction runs
                task.report_progress_and_stop_if_killed(
                    progress_message=f"{index} of {total} org units processed", progress_value=index, end_value=total
                )
            if org_unit.org_unit_type_id is not None and not user.iaso_profile.has_org_unit_write_permission(
                org_unit.org_unit_type_id, prefetched_editable_org_unit_type_ids=editable_type_ids
            ):
                skipped.append(org_unit.id)
                continue
            original = deepcopy(org_unit)
            if validation_status is not None:
                org_unit.validation_status = validation_status
            if org_unit_type is not None:
                org_unit.org_unit_type = org_unit_type
            if parent is not None:
                org_unit.parent = parent  # `save()` recomputes its path, and its descendants'
            org_unit.save()
            if groups_added:
                org_unit.groups.add(*groups_added)
            if groups_removed:
                org_unit.groups.remove(*groups_removed)
            log_modification(original, org_unit, source=ORG_UNIT_API_BULK, user=user)
            updated += 1

    task.report_success_with_result(
        message=summary(updated, skipped), result_data={"updated": updated, "skipped": skipped}
    )


def check_move(org_units, parent: OrgUnit, errors: Errors) -> None:
    """Under their new parent: not under themselves or one of their descendants (a cycle), and in its source
    version."""
    if parent.path is None:
        errors.add(
            "INVALID",
            f"Org unit {parent.id} has no place in the pyramid (no path): it can't be a parent",
            ["update", "parentId"],
        )
        return
    cycle = list(
        org_units.filter(id__in=[int(label) for label in parent.path]).order_by("id").values_list("id", flat=True)
    )
    if cycle:
        errors.add(
            "INVALID",
            f"Org units can't move under themselves or one of their descendants ({parent.id}): ids {ids(cycle)}",
            ["update", "parentId"],
        )
    elsewhere = list(
        org_units.exclude(version_id=parent.version_id)
        .order_by("id")
        .values_list("id", flat=True)[: IDS_IN_MESSAGE + 1]
    )
    if elsewhere:
        errors.add(
            "INVALID",
            f"Org units of another source version than their new parent {parent.id}: ids {ids(elsewhere)}",
            ["update", "parentId"],
        )


def refuse(task: Task, errors: List[dict]) -> None:
    """Ends the task `ERRORED` with `errors` (`Task.errors`): a refusal, not a crash - no stack trace, no Sentry."""
    message = "Nothing updated: " + "; ".join(error["message"] for error in errors)
    task.status = ERRORED
    task.ended_at = timezone.now()
    task.progress_message = message
    # typed for `Task.errors`, the `InputError` interface
    errors = [{**error, "type": "OrgUnitBulkUpdateError"} for error in errors]
    task.result = {"result": ERRORED, "message": message, "errors": errors}
    task.create_log_entry_if_needed(message)
    task.save()


def summary(updated: int, skipped: List[int]) -> str:
    message = f"{updated} org units updated"
    if skipped:
        message += f", {len(skipped)} skipped: of a type the user can't edit (ids {ids(skipped)})"
    return message


def ids(org_unit_ids: List[int]) -> str:
    shown = ", ".join(map(str, org_unit_ids[:IDS_IN_MESSAGE]))
    return shown + ("..." if len(org_unit_ids) > IDS_IN_MESSAGE else "")
