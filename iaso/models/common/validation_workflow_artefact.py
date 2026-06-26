from django.db import models
from django.utils.translation import gettext_lazy as _


class ValidationWorkflowArtefactStatus(models.TextChoices):
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")
    PENDING = "PENDING", _("Pending")


class ValidationWorkflowArtefact(models.Model):
    general_validation_status = models.CharField(
        choices=ValidationWorkflowArtefactStatus.choices, blank=True, default="", max_length=20
    )

    class Meta:
        abstract = True

    def has_workflow(self, workflow):
        return self.validationnode_set.filter(node__workflow=workflow).exists()

    def get_next_pending_nodes(self, workflow=None):
        from iaso.models.validation_workflow.validation_node import ValidationNodeStatus

        return self.validationnode_set.filter(
            status=ValidationNodeStatus.UNKNOWN, **{"node__workflow": workflow} if workflow else {}
        )

    def get_all_validation_nodes(self, workflow=None):
        """
        Function to recursively get all validation nodes and order them
        """
        from iaso.models import ValidationNode

        return ValidationNode.objects.filter(
            instance_id=self.pk, **{"node__workflow": workflow} if workflow else {}
        ).order_by("-created_at")
