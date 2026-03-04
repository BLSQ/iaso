from django.contrib.auth import get_user_model
from django.db import models

from iaso.models import Instance
from iaso.models.common import CreatedAndUpdatedModel
from iaso.models.validation_workflow.templates import ValidationNode


class Status(models.TextChoices):
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    UNKNOWN = "unknown", "Unknown"


class ValidationStatus(CreatedAndUpdatedModel):
    instance = models.ForeignKey(Instance, on_delete=models.CASCADE)

    node = models.ForeignKey(ValidationNode, on_delete=models.PROTECT)
    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.PROTECT, related_name="%(class)s_created_set"
    )
    updated_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.PROTECT, related_name="%(class)s_updated_set"
    )

    previous_status = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNKNOWN)
    comment = models.TextField(blank=True)
    final = models.BooleanField(default=False)

    def get_next_related_validation_statuses(self):
        return self.node.next_nodes.values_list("validationstatus", flat=True)

    class Meta:
        ordering = ["-created_at"]
