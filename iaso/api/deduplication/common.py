from iaso.models import Entity


class PotentialDuplicate(dict):
    def __init__(self, entity1_id, entity2_id, score, instance_class=Entity):
        dict.__init__(
            self,
            entity1_id=entity1_id,
            entity2_id=entity2_id,
            score=score,
            instance_class=instance_class.__name__,
        )

    def __str__(self):
        return f"PotentialDuplicate[{self.instance_class}]({self.entity1_id}, {self.entity2_id} -> {self.score})"
