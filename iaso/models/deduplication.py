from django.db import models
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

from iaso.api.deduplication.algos import DEFAULT_ALGORITHM, POSSIBLE_ALGORITHMS  # type: ignore
from iaso.models import Entity, Task

# PENDING = "PENDING"
# VALIDATED = "VALIDATED"
# IGNORED = "IGNORED"
# VALIDATION_STATUS = [(PENDING, "Pending"), (VALIDATED, "Validated"), (IGNORED, "Ignored")]

# DUPLICATE = "DUPLICATE"
# COUSIN = "COUSIN"
# PRODUCED = "PRODUCED"
# DUPLICATE_TYPES = [(DUPLICATE, "Duplicate"), (COUSIN, "Cousin"), (PRODUCED, "Produced")]


class ValidationStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    VALIDATED = "VALIDATED", _("Validated")
    IGNORED = "IGNORED", _("Ignored")


class TypeOfRelation(models.TextChoices):
    DUPLICATE = "DUPLICATE", _("Duplicate")
    COUSIN = "COUSIN", _("Cousin")
    PRODUCED = "PRODUCED", _("Produced")


class EntityDuplicateAnalyzis(models.Model):
    algorithm = models.CharField(max_length=20, choices=POSSIBLE_ALGORITHMS, default=DEFAULT_ALGORITHM)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, related_name="entity_duplicate_analyzis")
    finished_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Analyzis {self.id} - {self.algorithm} ({self.task.status}) @ {self.created_at.strftime('%d/%m/%Y %H:%M') if self.created_at else 'None'}"


class EntityDuplicate(models.Model):
    entity1 = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="duplicates1")
    entity2 = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name="duplicates2")
    created_at = models.DateTimeField(auto_now_add=True)
    validation_status = models.CharField(
        max_length=20, choices=ValidationStatus.choices, default=ValidationStatus.PENDING
    )
    type_of_relation = models.CharField(max_length=20, choices=TypeOfRelation.choices, default=TypeOfRelation.DUPLICATE)
    similarity_score = models.SmallIntegerField(null=True)
    updated_at = models.DateTimeField(auto_now=True)
    metadata = models.JSONField(default=dict, blank=True)
    analyze = models.ForeignKey(
        EntityDuplicateAnalyzis, related_name="duplicates", on_delete=models.CASCADE, default=None, null=True
    )

    def get_entity_type(self):
        return self.entity1.entity_type

    class Meta:
        unique_together = ("entity1", "entity2")
