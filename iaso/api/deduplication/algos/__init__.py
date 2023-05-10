from typing import List

from ..common import PotentialDuplicate
from . import levenshtein
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
    if algo_name in DeduplicationAlgorithm.ALGORITHMS:
        algo = DeduplicationAlgorithm.ALGORITHMS[algo_name]()
        return algo.run(algo_params, task)
    else:
        raise ValueError(f"Unknown algorithm {algo_name}")
