from typing import List

from ..common import PotentialDuplicate
from .base import DeduplicationAlgorithm


@DeduplicationAlgorithm.register("inverse")
class InverseAlgorithm(DeduplicationAlgorithm):
    def run(self, params, task=None) -> List[PotentialDuplicate]:

        count = 100

        task.report_progress_and_stop_if_killed(
            progress_value=0,
            end_value=count,
            progress_message=f"Started InverseAlgorithm",
        )

        print("Not implemented yet")
        print(f"Received params: {params}")

        task.report_progress_and_stop_if_killed(
            progress_value=100,
            end_value=count,
            progress_message=f"Ended InverseAlgorithm",
        )

        return [PotentialDuplicate(1, 2, 0.5), PotentialDuplicate(3, 4, 0.5)]
