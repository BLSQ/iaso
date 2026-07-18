import logging

from typing import Optional

from iaso.models import Mission, OrgUnit, Planning, Project


logger = logging.getLogger(__name__)


def resolve_planning(planning_id, project: Project) -> Optional[Planning]:
    """
    Resolve and validate the planning a submission was made for.

    Returns a Planning, or None when the client sent no planning (older app versions)
    or when the reference is invalid.

    This runs inside @safe_api_import, whose contract is to never fail a mobile sync:
    the whole batch runs in a single transaction and always returns a 200. Raising here
    would roll back every submission in the batch, so invalid references never raise.
    A planning from another account is a tenancy breach: the link is refused and logged
    at ERROR level. A soft-deleted planning is a legitimate race (a planner deleting a
    planning after a device queued submissions) and only logs a warning.
    """
    if planning_id is None:
        return None

    # Planning.objects does not filter out soft-deleted plannings.
    planning = Planning.objects.filter(pk=planning_id, project__account=project.account).first()
    if planning is None:
        logger.error("Instance references planning %s, unknown for account %s", planning_id, project.account_id)
        return None

    if planning.deleted_at is not None:
        logger.warning("Instance references soft-deleted planning %s", planning_id)
        return None

    return planning


def resolve_mission(
    mission_id, planning: Optional[Planning], org_unit: Optional[OrgUnit], form_id, project: Project
) -> Optional[Mission]:
    """
    Resolve and validate the mission a submission fulfills.

    Returns a Mission, or None when the client sent no mission (older app versions)
    or when the reference is invalid.

    Same contract as resolve_planning: never raises, because @safe_api_import runs the
    whole batch in one transaction. A mission unknown for the account is a tenancy
    breach and logs at ERROR level; business-rule mismatches (mission not in the
    planning, mission not applying to the org unit or form) are legitimate races with
    planners editing plannings and only log warnings.
    """
    if mission_id is None:
        return None

    # Mission.objects is polymorphic and filters out soft-deleted missions.
    mission = Mission.objects.filter(pk=mission_id, account=project.account).first()
    if mission is None:
        # Distinguish "soft-deleted in this account" (planner edit, warning) from
        # "unknown or another account" (tenancy breach, error). The base manager
        # is the only one that does not filter out soft-deleted missions.
        if Mission._base_manager.filter(pk=mission_id, account=project.account).exists():
            logger.warning("Instance references soft-deleted mission %s", mission_id)
        else:
            logger.error("Instance references mission %s, unknown for account %s", mission_id, project.account_id)
        return None

    if planning is None:
        logger.warning("Instance sent missionId %s without a valid planningId", mission_id)
        return None

    if not planning.missions.filter(pk=mission_id).exists():
        logger.warning("Mission %s is not attached to planning %s", mission_id, planning.pk)
        return None

    if org_unit is None or org_unit.org_unit_type_id is None:
        logger.warning("Cannot validate mission %s without an org unit type", mission_id)
        return None

    form_assignments = mission.get_form_assignments(org_unit)
    if not form_assignments:
        logger.warning("Mission %s does not apply to org unit %s", mission_id, org_unit.pk)
        return None

    # For FORM_FILLING missions the submitted form must be one the mission asks for.
    if isinstance(form_assignments, list):
        try:
            submitted_form_id = int(form_id)
        except (TypeError, ValueError):
            submitted_form_id = None
        if submitted_form_id not in {tf.form_id for tf in form_assignments}:
            logger.warning("Form %s is not part of mission %s", form_id, mission_id)
            return None

    return mission
