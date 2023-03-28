from . import inverse, name_sim
from .base import DeduplicationAlgorithm


def run_algo(algo_name, params):
    algo = DeduplicationAlgorithm.ALGORITHMS[algo_name]()
    return algo.run(params)


POSSIBLE_ALGORITHMS = [[k, k] for k in DeduplicationAlgorithm.ALGORITHMS.keys()]
