from typing import List

from ..common import PotentialDuplicate
from . import levenshtein as levenshtein
from .base import DeduplicationAlgorithm


POSSIBLE_ALGORITHMS = [[k, k] for k in DeduplicationAlgorithm.ALGORITHMS.keys()]
DEFAULT_ALGORITHM = POSSIBLE_ALGORITHMS[0][0]


def run_algo(algo_name, algo_params, task=None) -> List[PotentialDuplicate]:
    """Runs the given algorithm and returns the results.

    :param algo_name: The name of the algorithm to run.
    :param algo_params: The parameters to pass to the algorithm.
    :param task: The task in which the algorithm is run.
    :return: A list of PotentialDuplicates returned by the algorithm.
    """
    from iaso.api.workflows.serializers import find_question_by_name
    from iaso.models import EntityType

    if algo_name in DeduplicationAlgorithm.ALGORITHMS:
        algo = DeduplicationAlgorithm.ALGORITHMS[algo_name]()

        possible_fields = EntityType.objects.values_list("reference_form__possible_fields", flat=True).get(
            id=algo_params["entity_type_id"]
        )

        updated_fields = [find_question_by_name(field, possible_fields) for field in algo_params.get("fields", [])]

        algo_params["fields"] = updated_fields

        return algo.run(algo_params, task)
    raise ValueError(f"Unknown algorithm {algo_name}")
