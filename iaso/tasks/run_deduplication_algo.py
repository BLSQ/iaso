import logging
from datetime import datetime, timedelta

from django.utils.timezone import now

from beanstalk_worker import task_decorator
from iaso.api.deduplication.algos import run_algo, POSSIBLE_ALGORITHMS  # type: ignore

logger = logging.getLogger(__name__)


@task_decorator(task_name="run_deduplication_algo")
def run_deduplication_algo(algo_name=None, algo_params=None, task=None):
    """Background Task to run deduplication algo."""
    started_at = datetime.now()

    results = run_algo(algo_name, algo_params, task)

    finished_at = datetime.now()
    the_duration = (finished_at - started_at).total_seconds()
    task.report_success_with_result(f"Finished in {the_duration} seconds", results)

    return results
