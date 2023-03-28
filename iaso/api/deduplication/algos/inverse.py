from .base import DeduplicationAlgorithm


@DeduplicationAlgorithm.register("inverse")
class InverseAlgorithm(DeduplicationAlgorithm):
    def run(self, params):
        pass
