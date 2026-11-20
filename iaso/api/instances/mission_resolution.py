import logging

from iaso.models import Mission, Planning, Project


logger = logging.getLogger(__name__)


def resolve_planning(planning_id, project: Project) -> Planning | None:
    if planning_id is None:
        return None

    planning = Planning.objects_include_deleted.filter(pk=planning_id, project__account=project.account).first()
    if planning is None:
        logger.error("Instance references planning %s, unknown for account %s", planning_id, project.account_id)

    return planning


def resolve_mission(mission_id, project: Project) -> Mission | None:
    if mission_id is None:
        return None

    mission = Mission.objects_include_deleted.filter(pk=mission_id, account=project.account).first()
    if mission is None:
        logger.error("Instance references mission %s, unknown for account %s", mission_id, project.account_id)

    return mission
