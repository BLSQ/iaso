from iaso.models import Entity


class PotentialDuplicate(dict):
    def __init__(self, instance1_id, instance2_id, score, instance_class=Entity):
        dict.__init__(
            self,
            instance1_id=instance1_id,
            instance2_id=instance2_id,
            score=score,
            instance_class=instance_class.__name__,
        )

    def __str__(self):
        return f"PotentialDuplicate[{self.instance_class}]({self.instance1_id}, {self.instance2_id} -> {self.score})"
