from abc import ABC, abstractmethod


class DeduplicationAlgorithm(ABC):
    # class variable that maps algorithm names to algorithm classes
    ALGORITHMS = {}

    # other fields as needed

    @abstractmethod
    def run(self, params):
        # code for running the algorithm (empty implementation)
        pass

    @classmethod
    def register(cls, name):
        # class method that registers a subclass in the class variable
        def decorator(subclass):
            cls.ALGORITHMS[name] = subclass
            return subclass

        return decorator
