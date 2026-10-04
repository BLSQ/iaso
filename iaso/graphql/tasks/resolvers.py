"""The background tasks (`Task`), read as `GET /api/tasks/<id>/` and `GET /api/tasks/<id>/logs/` do."""

from typing import Optional

from ariadne import QueryType
from django.db.models import QuerySet
from graphql import GraphQLError, GraphQLResolveInfo

from iaso.models import Task, TaskLog
from iaso.permissions.core_permissions import CORE_DATA_TASKS_PERMISSION

from ..common import requesting_user


MAX_LOGS = 1_000

query = QueryType()


def visible_tasks(user) -> QuerySet:
    """The account's tasks, only the user's own ones without the "data tasks" permission."""
    profile = getattr(user, "iaso_profile", None)
    if profile is None:
        return Task.objects.none()
    tasks = Task.objects.filter(account_id=profile.account_id)
    if not user.has_perm(CORE_DATA_TASKS_PERMISSION.full_name()):
        tasks = tasks.filter(created_by=user)
    return tasks


@query.field("task")
def resolve_task(_, info: GraphQLResolveInfo, id: int) -> Optional[Task]:
    return visible_tasks(requesting_user(info)).select_related("created_by", "launcher").filter(pk=id).first()


@query.field("taskLogs")
def resolve_task_logs(_, info: GraphQLResolveInfo, taskId: int, limit: int, afterId: Optional[int] = None):
    if not 0 < limit <= MAX_LOGS:
        raise GraphQLError(f"limit must be between 1 and {MAX_LOGS}")
    logs = TaskLog.objects.filter(task__in=visible_tasks(requesting_user(info)).filter(pk=taskId))
    if afterId is not None:
        logs = logs.filter(id__gt=afterId)
    # ids grow with `created_at`: one order for the cursor and the reading
    return logs.only("id", "message", "created_at").order_by("id")[:limit]
