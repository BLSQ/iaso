from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models import Instance
from iaso.models.common import CreatedAndUpdatedModel
from iaso.models.validation_workflow.templates import ValidationNodeTemplate


class ValidationNodeStatus(models.TextChoices):
    ACCEPTED = "ACCEPTED", _("Accepted")
    REJECTED = "REJECTED", _("Rejected")
    SKIPPED = "SKIPPED", _("Skipped")
    UNKNOWN = "UNKNOWN", _("Unknown")


class ValidationNode(CreatedAndUpdatedModel):
    """
    Represents a runtime instance of a ValidationNodeTemplate.
    """

    instance = models.ForeignKey(Instance, on_delete=models.CASCADE)

    node = models.ForeignKey(ValidationNodeTemplate, on_delete=models.PROTECT)

    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.PROTECT, related_name="%(class)s_created_set"
    )
    updated_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.PROTECT, related_name="%(class)s_updated_set"
    )

    status = models.CharField(max_length=20, choices=ValidationNodeStatus.choices, default=ValidationNodeStatus.UNKNOWN)
    comment = models.TextField(blank=True)
    final = models.BooleanField(default=False)

    def get_next_nodes(self):
        """
        Return the existing ValidationNode that are placed right after this one in the workflow.
        """
        return ValidationNode.objects.filter(
            node__pk__in=self.node.next_node_templates.values_list("pk", flat=True), instance=self.instance
        )

    class Meta:
        ordering = ["-created_at"]
