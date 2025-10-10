import logging
import time

from gql import Client, gql
from gql.transport.requests import RequestsHTTPTransport

from iaso.models import Task
from iaso.models.base import RUNNING


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


def poll_openhexa_pipeline(
    task_id: int,
    pipeline_id: str,
    openhexa_url: str,
    openhexa_token: str,
    max_attempts: int = 30,
    delay: int = 2,
):
    """
    Background task to poll OpenHEXA pipeline status and update Iaso task accordingly.

    Args:
        task_id: Iaso task ID to update
        pipeline_id: OpenHEXA pipeline ID to check
        openhexa_url: OpenHEXA GraphQL endpoint URL
        openhexa_token: OpenHEXA authentication token
        max_attempts: Maximum number of polling attempts
        delay: Delay between polling attempts in seconds
    """
    logger.info(f"Starting OpenHEXA polling for task {task_id}, pipeline {pipeline_id}")

    the_task = Task.objects.get(pk=task_id)

    for attempt in range(max_attempts):
        try:
            the_task.refresh_from_db()
            if the_task.should_be_killed:
                logger.info(f"Task {task_id} was killed, stopping polling")
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
                the_task.report_progress_and_stop_if_killed(
                    progress_message=f"No runs found for pipeline {pipeline_id} (attempt {attempt + 1}/{max_attempts})"
                )
                time.sleep(delay)
                continue

            latest_run = runs[0]
            run_status = latest_run["status"]
            run_id = latest_run["run_id"]
            logs = latest_run.get("logs", "")

            logger.info(f"OpenHEXA run {run_id} status: {run_status} (attempt {attempt + 1}/{max_attempts})")

            error_details = []
            if logs:
                error_details.append(f"Logs: {logs}")

            full_error_message = "; ".join(error_details) if error_details else ""

            run_status_lower = run_status.lower()

            if run_status_lower in OpenHexaStatus.FAILURE_STATUSES:
                logger.info(
                    f"Pipeline {pipeline_id} failed in OpenHEXA with status: {run_status}, updating task {task_id} to ERRORED"
                )

                if full_error_message:
                    detailed_error = (
                        f"Pipeline failed in OpenHEXA with status: {run_status}. Details: {full_error_message}"
                    )
                else:
                    detailed_error = f"Pipeline failed in OpenHEXA with status: {run_status}"

                error = Exception(detailed_error)
                the_task.report_failure(error)
                return

            if run_status_lower in OpenHexaStatus.SUCCESS_STATUSES:
                logger.info(
                    f"Pipeline {pipeline_id} succeeded in OpenHEXA with status: {run_status}, updating task {task_id} to SUCCESS"
                )

                the_task.report_success(f"Pipeline completed successfully (status: {run_status})")
                return

            if run_status_lower in OpenHexaStatus.IN_PROGRESS_STATUSES:
                if the_task.status != RUNNING:
                    logger.info(
                        f"Pipeline {pipeline_id} status changed to {run_status}, updating task {task_id} to RUNNING"
                    )
                    the_task.status = RUNNING
                    the_task.progress_message = f"Pipeline is {run_status}"
                    the_task.save()
                else:
                    logger.info(f"Pipeline {pipeline_id} still {run_status}, continuing to poll...")

                the_task.report_progress_and_stop_if_killed(
                    progress_message=f"Pipeline is {run_status} (attempt {attempt + 1}/{max_attempts})"
                )
                time.sleep(delay)
                continue

            logger.warning(f"Unknown OpenHEXA run status: {run_status} for pipeline {pipeline_id}")
            the_task.report_progress_and_stop_if_killed(
                progress_message=f"Pipeline status unknown: {run_status} (attempt {attempt + 1}/{max_attempts})"
            )
            time.sleep(delay)
            continue

        except Exception as e:
            logger.error(f"Error polling OpenHEXA for task {task_id}: {str(e)}")
            the_task.report_progress_and_stop_if_killed(
                progress_message=f"Error polling OpenHEXA: {str(e)} (attempt {attempt + 1}/{max_attempts})"
            )
            time.sleep(delay)
            continue

    logger.warning(f"OpenHEXA polling timeout for task {task_id} after {max_attempts} attempts")
    error_message = "Pipeline monitoring timeout - status unknown after polling OpenHEXA"
    error = Exception(error_message)
    the_task.report_failure(error)
    logger.info(f"Updated task {task_id} to ERRORED due to polling timeout")
