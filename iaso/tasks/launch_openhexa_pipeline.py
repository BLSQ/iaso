import logging
import time

from django.utils import timezone
from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport

from beanstalk_worker import task_decorator
from iaso.api.tasks.views import ExternalTaskModelViewSet
from iaso.models import Task
from iaso.models.base import ERRORED, QUEUED, RUNNING, SUCCESS


logger = logging.getLogger(__name__)


# OpenHEXA Pipeline Status Constants
class OpenHexaStatus:
    """OpenHEXA pipeline status constants."""

    # Success statuses
    SUCCESS = "success"
    COMPLETED = "completed"
    DONE = "done"

    # Failure statuses
    FAILED = "failed"
    ERRORED = "errored"
    CANCELLED = "cancelled"
    ERROR = "error"

    # In-progress statuses
    RUNNING = "running"
    QUEUED = "queued"
    PENDING = "pending"
    STARTED = "started"

    # Status groups for easier handling
    SUCCESS_STATUSES = [SUCCESS, COMPLETED, DONE]
    FAILURE_STATUSES = [FAILED, ERRORED, CANCELLED, ERROR]
    IN_PROGRESS_STATUSES = [RUNNING, QUEUED, PENDING, STARTED]


class MockConfig:
    """Mock Config object for pipeline configuration."""

    def __init__(self, content_dict):
        self.content = content_dict


def _create_pipeline_config(pipeline_id: str, version: str, openhexa_url: str, openhexa_token: str) -> MockConfig:
    """Create pipeline configuration for OpenHEXA."""
    return MockConfig(
        {
            "pipeline_version": str(version),
            "pipeline": str(pipeline_id),
            "oh_pipeline_target": None,
            "openhexa_url": openhexa_url,
            "openhexa_token": openhexa_token,
        }
    )


def _launch_pipeline(task: Task, pipeline_id: str, version: str, config: dict, pipeline_config: MockConfig) -> None:
    """Launch the OpenHEXA pipeline and update task status."""
    task.status = QUEUED
    task.external = True
    task.params = {
        "args": [],
        "kwargs": {"pipeline_id": str(pipeline_id), "version": str(version), "config": config},
    }
    # Use update_fields to ensure external flag is not overwritten
    task.save(update_fields=["status", "external", "params"])

    ExternalTaskModelViewSet.launch_task(
        slug=None,
        config=config,
        task_id=task.pk,
        pipeline_config=pipeline_config,
    )

    logger.info(f"Successfully launched pipeline {pipeline_id} v{version} as task {task.pk}")
    # Preserve external flag during progress updates
    task.refresh_from_db()
    task.report_progress_and_stop_if_killed(
        progress_message=f"Successfully launched pipeline {pipeline_id} v{version} as task {task.pk}"
    )


def _check_timeout(
    polling_start_time,
    max_polling_duration_seconds: float,
    task: Task,
    pipeline_id: str,
    max_polling_duration_minutes: int,
) -> bool:
    """Check if polling has exceeded timeout. Returns True if timeout reached."""
    current_time = timezone.now()
    elapsed_time_seconds = (current_time - polling_start_time).total_seconds()

    if elapsed_time_seconds > max_polling_duration_seconds:
        timeout_message = (
            f"Polling timeout reached after {max_polling_duration_minutes} minutes for pipeline {pipeline_id}"
        )
        logger.warning(timeout_message)
        task.report_failure(Exception(timeout_message))
        return True

    return False


def _query_pipeline_runs(openhexa_url: str, openhexa_token: str, pipeline_id: str) -> list:
    """Query OpenHEXA for pipeline runs and return the list of runs."""
    transport = RequestsHTTPTransport(
        url=openhexa_url,
        headers={"Authorization": f"Bearer {openhexa_token}"},
        verify=True,
    )
    client = Client(transport=transport, fetch_schema_from_transport=True)

    query = gql(
        """
        query pipeline {
            pipeline(id: "%s"){
                runs{
                    items{
                        run_id
                        status
                        config
                        logs
                    }
                }
            }
        }
        """
        % pipeline_id
    )

    result = client.execute(query)
    return result.get("pipeline", {}).get("runs", {}).get("items", [])


def _handle_failure_status(task: Task, pipeline_id: str, run_status: str, logs: str) -> bool:
    """Handle failure status. Returns True if this was a failure status."""
    run_status_lower = run_status.lower()

    if run_status_lower not in OpenHexaStatus.FAILURE_STATUSES:
        return False

    if task.status != ERRORED:
        logger.info(
            f"Pipeline {pipeline_id} failed in OpenHEXA with status: {run_status}, updating task {task.pk} to ERRORED"
        )

        if logs:
            detailed_error = f"Pipeline failed in OpenHEXA with status: {run_status}. Details: Logs: {logs}"
        else:
            detailed_error = f"Pipeline failed in OpenHEXA with status: {run_status}"

        task.report_failure(Exception(detailed_error))

    return True


def _handle_success_status(task: Task, pipeline_id: str, run_status: str) -> bool:
    """Handle success status. Returns True if this was a success status."""
    run_status_lower = run_status.lower()

    if run_status_lower not in OpenHexaStatus.SUCCESS_STATUSES:
        return False

    if task.status != SUCCESS:
        logger.info(
            f"Pipeline {pipeline_id} succeeded in OpenHEXA with status: {run_status}, updating task {task.pk} to SUCCESS"
        )
        task.refresh_from_db()
        task.status = SUCCESS
        task.ended_at = timezone.now()
        if not task.progress_message or task.progress_message == "":
            task.progress_message = "Pipeline completed successfully"
        task.create_log_entry_if_needed("Pipeline completed successfully")
        task.save(update_fields=["status", "ended_at", "progress_message"])

    return True


def _handle_in_progress_status(task: Task, pipeline_id: str, run_status: str, delay: int) -> bool:
    """Handle in-progress status. Returns True if this was an in-progress status."""
    run_status_lower = run_status.lower()

    if run_status_lower not in OpenHexaStatus.IN_PROGRESS_STATUSES:
        return False

    if task.status != RUNNING:
        logger.info(f"Pipeline {pipeline_id} status changed to {run_status}, updating task {task.pk} to RUNNING")
        task.status = RUNNING
        # Ensure external flag is preserved
        if not task.external:
            task.external = True
        task.save(update_fields=["status", "external"])

    time.sleep(delay)
    return True


@task_decorator(task_name="launch_openhexa_pipeline")
def launch_openhexa_pipeline(
    pipeline_id: str,
    openhexa_url: str,
    openhexa_token: str,
    version: str,
    config: dict,
    delay: int = 2,
    task: Task = None,
    max_polling_duration_minutes: int = 10,
):
    """
    Background task to launch OpenHEXA pipeline and monitor its status.

    Args:
        pipeline_id: OpenHEXA pipeline ID to launch
        openhexa_url: OpenHEXA GraphQL endpoint URL
        openhexa_token: OpenHEXA authentication token
        version: Pipeline version to launch
        config: Pipeline configuration
        delay: Delay between polling attempts in seconds
        max_polling_duration_minutes: Maximum duration to poll for pipeline completion (default: 10 minutes)
    """
    logger.info(f"Starting OpenHEXA pipeline launch and monitoring for pipeline {pipeline_id}")

    # Launch pipeline
    pipeline_config = _create_pipeline_config(pipeline_id, version, openhexa_url, openhexa_token)
    _launch_pipeline(task, pipeline_id, version, config, pipeline_config)

    # Set up polling
    logger.info(f"Started OpenHexa polling task for task {task.pk}")
    polling_start_time = timezone.now()
    max_polling_duration_seconds = max_polling_duration_minutes * 60
    logger.info(f"Polling timeout set to {max_polling_duration_minutes} minutes for task {task.pk}")

    # Poll for status
    last_logged_status = None
    while True:
        try:
            # Check if task was killed
            task.refresh_from_db()
            # Ensure external flag is preserved after refresh
            if not task.external:
                logger.warning(f"Task {task.pk} external flag was False, resetting to True")
                task.external = True
                task.save(update_fields=["external"])
            if task.should_be_killed:
                logger.info(f"Task {task.pk} was killed, stopping polling")
                return

            # Check timeout
            if _check_timeout(
                polling_start_time, max_polling_duration_seconds, task, pipeline_id, max_polling_duration_minutes
            ):
                return

            # Query pipeline runs
            runs = _query_pipeline_runs(openhexa_url, openhexa_token, pipeline_id)

            if not runs:
                if last_logged_status != "no_runs":
                    logger.warning(f"No runs found for pipeline {pipeline_id}")
                    task.report_progress_and_stop_if_killed(
                        progress_message=f"No runs found for pipeline {pipeline_id}"
                    )
                    last_logged_status = "no_runs"
                time.sleep(delay)
                continue

            # Process latest run
            latest_run = runs[0]
            run_status = latest_run["status"]
            run_id = latest_run["run_id"]
            logs = latest_run.get("logs", "")

            # Only log when status changes
            if run_status != last_logged_status:
                logger.info(f"OpenHEXA run {run_id} status: {run_status}")
                last_logged_status = run_status

            # Handle different status types
            if _handle_failure_status(task, pipeline_id, run_status, logs):
                return

            if _handle_success_status(task, pipeline_id, run_status):
                return

            if _handle_in_progress_status(task, pipeline_id, run_status, delay):
                continue

            # Unknown status
            logger.warning(f"Unknown OpenHEXA run status: {run_status} for pipeline {pipeline_id}")
            task.report_progress_and_stop_if_killed(progress_message=f"Pipeline status unknown: {run_status}")
            time.sleep(delay)

        except Exception as e:
            logger.error(f"Error polling OpenHEXA for task {task.pk}: {str(e)}")
            task.report_progress_and_stop_if_killed(progress_message=f"Error polling OpenHEXA: {str(e)}")
            return
