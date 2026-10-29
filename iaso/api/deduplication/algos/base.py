from abc import ABC, abstractmethod

from iaso.models.task import Task

from ..common import PotentialDuplicate


class DeduplicationAlgorithm(ABC):
    @abstractmethod
    def run(self, params: dict, task: Task) -> list[PotentialDuplicate]:
        # Code for running the algorithm (empty implementation).
        pass
