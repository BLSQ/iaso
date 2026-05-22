from abc import ABC, abstractmethod
from typing import List

from iaso.models.task import Task

from ..common import PotentialDuplicate


class DeduplicationAlgorithm(ABC):
    @abstractmethod
    def run(self, params: dict, task: Task) -> List[PotentialDuplicate]:
        # Code for running the algorithm (empty implementation).
        pass
