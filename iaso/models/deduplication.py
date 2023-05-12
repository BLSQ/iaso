from django.db import models
from iaso.models import Entity, EntityType, Task
import iaso.models.base as base_models
from iaso.api.deduplication.algos import POSSIBLE_ALGORITHMS, DEFAULT_ALGORITHM
from django.utils.timezone import now

PENDING = "PENDING"
VALIDATED = "VALIDATED"
IGNORED = "IGNORED"
VALIDATION_STATUS = [(PENDING, "Pending"), (VALIDATED, "Validated"), (IGNORED, "Ignored")]

DUPLICATE = "DUPLICATE"
COUSIN = "COUSIN"
PRODUCED = "PRODUCED"
DUPLICATE_TYPES = [(DUPLICATE, "Duplicate"), (COUSIN, "Cousin"), (PRODUCED, "Produced")]


class EntityDuplicateAnalyze(models.Model):
    algorithm = models.CharField(max_length=20, choices=POSSIBLE_ALGORITHMS, default=DEFAULT_ALGORITHM)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, related_name="entity_duplicate_analyze")
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Analyze {self.id} - {self.algorithm} ({self.task.status}) @ {self.created_at.strftime('%d/%m/%Y %H:%M') if self.created_at else 'None'}"


class EntityDuplicate(models.Model):
    entity1 = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="duplicates1")
    entity2 = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="duplicates2")
    created_at = models.DateTimeField(auto_now_add=True)
    validation_status = models.CharField(max_length=20, choices=VALIDATION_STATUS, default=PENDING)
    type_of_relation = models.CharField(max_length=20, choices=DUPLICATE_TYPES, default=DUPLICATE)
    similarity_score = models.SmallIntegerField(null=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(default=dict, blank=True)
    analyze = models.ForeignKey(
        EntityDuplicateAnalyze, related_name="duplicates", on_delete=models.CASCADE, default=None, null=True
    )

    def get_entity_type(self):
        return self.entity1.entity_type

    class Meta:
        unique_together = ("entity1", "entity2")
