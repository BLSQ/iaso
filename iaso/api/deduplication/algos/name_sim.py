from .base import DeduplicationAlgorithm


@DeduplicationAlgorithm.register("namesim")
class NameSimAlgorithm(DeduplicationAlgorithm):
    def run(self, params):
        pass
