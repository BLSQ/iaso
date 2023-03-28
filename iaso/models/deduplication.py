from django.db import models
from iaso.models import Entity, EntityType, Task
import iaso.models.base as base_models
from iaso.api.deduplication.algos import POSSIBLE_ALGORITHMS

VALIDATION_STATUS = [("PENDING", "Pending"), ("VALIDATED", "Validated"), ("IGNORED", "Ignored")]
DUPLICATE_TYPES = [("DUPLICATE", "Duplicate"), ("COUSIN", "Cousin"), ("PRODUCED", "Produced")]

DEFAULT_ALGORITHM = "namesim"


class EntityDuplicateAnalyze(models.Model):
    algorithm = models.CharField(max_length=20, choices=POSSIBLE_ALGORITHMS, default=DEFAULT_ALGORITHM)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True)

    def finalize_from_task(self):

        if self.task.status == base_models.SUCCESS:
            list_pot_dup = self.task.result
            for pot_dup in list_pot_dup:
                try:
                    ed, ed_created = EntityDuplicate.objects.get_or_create(
                        entity1=pot_dup["entity1"], entity2=pot_dup["entity2"]
                    )
                    if ed_created:
                        ed.validation_status = EntityDuplicate.VALIDATION_STATUS[0][0]
                        ed.similarity_score = pot_dup["score"]
                    ed.analyzes_set.add(self)
                    ed.save()
                except Exception as e:
                    print(e)
                    pass

        self.save()


class EntityDuplicate(models.Model):
    entity1 = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="duplicates1")
    entity2 = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="duplicates2")
    created_at = models.DateTimeField(auto_now_add=True)
    validation_status = models.CharField(max_length=20, choices=VALIDATION_STATUS, default=VALIDATION_STATUS[0][0])
    type_of_relation = models.CharField(max_length=20, choices=DUPLICATE_TYPES, default=DUPLICATE_TYPES[0][0])
    similarity_score = models.SmallIntegerField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(default=dict)
    analyzes = models.ManyToManyField(EntityDuplicateAnalyze, related_name="duplicates")

    class Meta:
        unique_together = ("entity1", "entity2")
