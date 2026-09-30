"""Launch the OpenHEXA pipeline configured on an embedded page."""

import logging

from django.core.exceptions import ValidationError
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport

from iaso.models.base import ALIVE_STATUSES, ERRORED, KILLED
from iaso.models.task import Task
from iaso.tasks.launch_openhexa_pipeline import launch_openhexa_pipeline
from iaso.utils.openhexa import get_openhexa_config


logger = logging.getLogger(__name__)


class PagePipelineError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def account_has_openhexa_config(account) -> bool:
    if account is None:
        return False
    try:
        get_openhexa_config(account)
    except ValidationError:
        return False
    return True


def page_pipeline_is_ongoing(page) -> bool:
    """True while this page's OpenHEXA launch task is still queued or running.

    The task is created as QUEUED before the worker marks it external, so a queued
    launch for this pipeline counts as ongoing as well.
    """
    if not page.pipeline_id or not page.account_id:
        return False
    return Task.objects.filter(
        account_id=page.account_id,
        name="launch_openhexa_pipeline",
        status__in=ALIVE_STATUSES,
        params__kwargs__pipeline_id=str(page.pipeline_id),
    ).exists()


def page_pipeline_has_failed(page) -> bool:
    """True when the latest launch for this page's pipeline ended in error or was killed.

    Ignored while another launch is still queued or running.
    """
    if page_pipeline_is_ongoing(page) or not page.pipeline_id or not page.account_id:
        return False
    task = (
        Task.objects.filter(
            account_id=page.account_id,
            name="launch_openhexa_pipeline",
            params__kwargs__pipeline_id=str(page.pipeline_id),
        )
        .order_by("-created_at", "-id")
        .first()
    )
    return task is not None and task.status in (ERRORED, KILLED)


def fetch_current_pipeline_version(openhexa_url: str, openhexa_token: str, pipeline_id: str) -> str:
    """Return the current OpenHEXA version id, the same id planning sends on launch."""
    transport = RequestsHTTPTransport(
        url=openhexa_url,
        headers={"Authorization": f"Bearer {openhexa_token}"},
        verify=True,
    )
    client = Client(transport=transport, fetch_schema_from_transport=True)
    query = gql(
        """
        query getPipelineDetail($pipelineId: UUID!) {
            pipeline(id: $pipelineId) {
                currentVersion { id }
            }
        }
        """
    )
    try:
        result = client.execute(query, variable_values={"pipelineId": pipeline_id})
    except Exception as exc:
        logger.exception("Could not fetch OpenHEXA pipeline %s", pipeline_id)
        raise PagePipelineError("Failed to fetch pipeline version", status_code=502) from exc

    version = ((result or {}).get("pipeline") or {}).get("currentVersion") or {}
    version_id = version.get("id")
    if not version_id:
        raise PagePipelineError("Pipeline has no current version")
    return str(version_id)


def start_page_pipeline(user, page):
    """Launch the page pipeline through the planning OpenHEXA task."""
    try:
        openhexa_url, openhexa_token, _, _ = get_openhexa_config(page.account)
    except ValidationError as exc:
        raise PagePipelineError("OpenHEXA is not configured for this account") from exc

    version = fetch_current_pipeline_version(openhexa_url, openhexa_token, str(page.pipeline_id))
    return launch_openhexa_pipeline(
        user=user,
        pipeline_id=str(page.pipeline_id),
        openhexa_url=openhexa_url,
        openhexa_token=openhexa_token,
        version=version,
        config={},
        # Page pipelines such as refresh-preparedness-dashboard-on-demand declare no parameters.
        # Planning pipelines accept task_id; sending it here makes OpenHEXA reject the run.
        include_task_id=False,
    )
