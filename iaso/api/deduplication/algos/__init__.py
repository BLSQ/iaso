from .base import DeduplicationAlgorithm


POSSIBLE_ALGORITHMS = [[k, k] for k in DeduplicationAlgorithm.ALGORITHMS.keys()]
DEFAULT_ALGORITHM = POSSIBLE_ALGORITHMS[0][0]
