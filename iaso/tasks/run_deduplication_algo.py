import logging

from datetime import datetime

from beanstalk_worker import task_decorator
from iaso.api.deduplication.algos.levenshtein import LevenshteinAlgorithm
from iaso.api.workflows.serializers import find_question_by_name
from iaso.models import EntityType
from iaso.models.deduplication import PossibleAlgorithms


logger = logging.getLogger(__name__)


@task_decorator(task_name="run_deduplication_algo")
def run_deduplication_algo(algo_name=None, algo_params=None, task=None):
    """Background Task to run deduplication algo."""
    started_at = datetime.now()

    if algo_name == PossibleAlgorithms.LEVENSHTEIN.value:
        algo = LevenshteinAlgorithm()
    else:
        raise ValueError(f"Unknown algorithm {algo_name}")

    possible_fields = EntityType.objects.values_list("reference_form__possible_fields", flat=True).get(
        id=algo_params["entity_type_id"]
    )

    updated_fields = [find_question_by_name(field, possible_fields) for field in algo_params.get("fields", [])]

    algo_params["fields"] = updated_fields

    algo.run(algo_params, task)

    finished_at = datetime.now()
    the_duration = (finished_at - started_at).total_seconds()
    task.report_success_with_result(f"Finished in {the_duration} seconds")
