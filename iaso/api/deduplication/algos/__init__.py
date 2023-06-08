from typing import List

from iaso.api.workflows.serializers import find_question_by_name
from iaso.models import EntityType, Form

from ..common import PotentialDuplicate  # type: ignore
from . import levenshtein
from .base import DeduplicationAlgorithm

POSSIBLE_ALGORITHMS = [[k, k] for k in DeduplicationAlgorithm.ALGORITHMS.keys()]
DEFAULT_ALGORITHM = POSSIBLE_ALGORITHMS[0][0]


def enrich_params(orig_params):
    entity_type_id = orig_params.get("entity_type_id")
    entity_type = EntityType.objects.get(id=entity_type_id)
    ref_form = entity_type.reference_form
    possible_fields = ref_form.possible_fields
    updated_fields = []
    for field in orig_params.get("fields", []):
        the_q = find_question_by_name(field, possible_fields)
        updated_fields.append(the_q)

    orig_params["fields"] = updated_fields
    return orig_params


def run_algo(algo_name, algo_params, task=None) -> List[PotentialDuplicate]:
    """Runs the given algorithm and returns the results.

    :param algo_name: The name of the algorithm to run.
    :param algo_params: The parameters to pass to the algorithm.
    :param task: The task in which the algorithm is run.
    :return: A list of PotentialDuplicates returned by the algorithm.
    """
    if algo_name in DeduplicationAlgorithm.ALGORITHMS:
        algo = DeduplicationAlgorithm.ALGORITHMS[algo_name]()
        print(f"Running algo {algo_name} with params {algo_params}")
        enriched_params = enrich_params(algo_params)
        print(f"Enriched params: {enriched_params}")
        return algo.run(algo_params, task)
    else:
        raise ValueError(f"Unknown algorithm {algo_name}")
