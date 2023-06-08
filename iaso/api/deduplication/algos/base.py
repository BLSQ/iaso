from abc import ABC, abstractmethod
from typing import List, Dict, Type

from ..common import PotentialDuplicate  # type: ignore


class DeduplicationAlgorithm(ABC):
    # class variable that maps algorithm names to algorithm classes
    ALGORITHMS: Dict[str, Type["DeduplicationAlgorithm"]] = {}

    # other fields as needed

    @abstractmethod
    def run(self, params, task=None) -> List[PotentialDuplicate]:
        # code for running the algorithm (empty implementation)
        pass

    @classmethod
    def register(cls, name):
        # class method that registers a subclass in the class variable
        def decorator(subclass):
            cls.ALGORITHMS[name] = subclass
            return subclass

        return decorator
