from abc import ABC, abstractmethod
from typing import List

from ..common import PotentialDuplicate


class DeduplicationAlgorithm(ABC):
    @abstractmethod
    def run(self, params, task=None) -> List[PotentialDuplicate]:
        # Code for running the algorithm (empty implementation).
        pass
