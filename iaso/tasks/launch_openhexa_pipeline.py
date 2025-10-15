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

    pipeline_config = MockConfig(
        {
            "pipeline_version": str(version),  # Convert UUID to string
            "pipeline": str(pipeline_id),
            "oh_pipeline_target": None,
            "openhexa_url": openhexa_url,
            "openhexa_token": openhexa_token,
        }
    )

    task.status = QUEUED
    task.external = True
    task.params = {
        "args": [],
        "kwargs": {"pipeline_id": str(pipeline_id), "version": str(version), "config": config},
    }
    task.save()
    # Launch the task using the existing launch_task function
    ExternalTaskModelViewSet.launch_task(
        slug=None,  # Not needed since we're passing pipeline_config
        config=config,
        task_id=task.pk,
        pipeline_config=pipeline_config,
    )

    logger.info(f"Successfully launched pipeline {pipeline_id} v{version} as task {task.pk}")

    task.report_progress_and_stop_if_killed(
        progress_message=f"Successfully launched pipeline {pipeline_id} v{version} as task {task.pk}"
    )

    logger.info(f"Started OpenHexa polling task for task {task.pk}")

    # Set up timeout for polling
    polling_start_time = timezone.now()
    max_polling_duration_seconds = max_polling_duration_minutes * 60
    logger.info(f"Polling timeout set to {max_polling_duration_minutes} minutes for task {task.pk}")

    while True:
        try:
            # Check if task was killed
            task.refresh_from_db()
            if task.should_be_killed:
                logger.info(f"Task {task.pk} was killed, stopping polling")
                return

            # Check if polling timeout has been reached
            current_time = timezone.now()
            elapsed_time_seconds = (current_time - polling_start_time).total_seconds()
            if elapsed_time_seconds > max_polling_duration_seconds:
                timeout_message = (
                    f"Polling timeout reached after {max_polling_duration_minutes} minutes for pipeline {pipeline_id}"
                )
                logger.warning(timeout_message)
                task.report_failure(Exception(timeout_message))
                return

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
            runs = result.get("pipeline", {}).get("runs", {}).get("items", [])

            if not runs:
                logger.warning(f"No runs found for pipeline {pipeline_id}")
                task.report_progress_and_stop_if_killed(progress_message=f"No runs found for pipeline {pipeline_id}")
                time.sleep(delay)
                continue

            latest_run = runs[0]
            run_status = latest_run["status"]
            run_id = latest_run["run_id"]
            logs = latest_run.get("logs", "")

            logger.info(f"OpenHEXA run {run_id} status: {run_status} ")

            error_details = []
            if logs:
                error_details.append(f"Logs: {logs}")

            full_error_message = "; ".join(error_details) if error_details else ""

            run_status_lower = run_status.lower()

            if run_status_lower in OpenHexaStatus.FAILURE_STATUSES:
                if task.status != ERRORED:
                    logger.info(
                        f"Pipeline {pipeline_id} failed in OpenHEXA with status: {run_status}, updating task {task.pk} to ERRORED"
                    )
                    if full_error_message:
                        detailed_error = (
                            f"Pipeline failed in OpenHEXA with status: {run_status}. Details: {full_error_message}"
                        )
                    else:
                        detailed_error = f"Pipeline failed in OpenHEXA with status: {run_status}"

                    error = Exception(detailed_error)
                    task.report_failure(error)
                return

            if run_status_lower in OpenHexaStatus.SUCCESS_STATUSES:
                if task.status != SUCCESS:
                    logger.info(
                        f"Pipeline {pipeline_id} succeeded in OpenHEXA with status: {run_status}, updating task {task.pk} to SUCCESS"
                    )
                    task.report_success("Pipeline completed successfully")
                return

            if run_status_lower in OpenHexaStatus.IN_PROGRESS_STATUSES:
                if task.status != RUNNING:
                    logger.info(
                        f"Pipeline {pipeline_id} status changed to {run_status}, updating task {task.pk} to RUNNING"
                    )
                    task.status = RUNNING
                    task.save()
                time.sleep(delay)
                continue

            logger.warning(f"Unknown OpenHEXA run status: {run_status} for pipeline {pipeline_id}")
            task.report_progress_and_stop_if_killed(progress_message=f"Pipeline status unknown: {run_status}")
            time.sleep(delay)
            continue

        except Exception as e:
            logger.error(f"Error polling OpenHEXA for task {task.pk}: {str(e)}")
            task.report_progress_and_stop_if_killed(progress_message=f"Error polling OpenHEXA: {str(e)}")
            return
