from django.db import models
from django.db.models import Case, IntegerField, When
from django.utils.translation import gettext_lazy as _


class CreatedAndUpdatedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ValidationWorkflowArtefactStatus(models.TextChoices):
    APPROVED = "APPROVED", _("Approved")
    REJECTED = "REJECTED", _("Rejected")
    PENDING = "PENDING", _("Pending")


class ValidationWorkflowArtefact(models.Model):
    parent_artefact_for_validation = models.ForeignKey("self", null=True, on_delete=models.SET_NULL)

    class Meta:
        abstract = True

    def has_workflow(self, workflow):
        return self.validationnode_set.filter(node__workflow=workflow).exists()

    def get_general_validation_status(self, workflow):
        from iaso.models.validation_workflow.validation_node import ValidationNodeStatus

        if self.validationnode_set.filter(
            final=True, status=ValidationNodeStatus.ACCEPTED, node__workflow=workflow
        ).exists():
            return ValidationWorkflowArtefactStatus.APPROVED

        if self.validationnode_set.filter(status=ValidationNodeStatus.REJECTED, node__workflow=workflow).exists():
            return ValidationWorkflowArtefactStatus.REJECTED
        if self.validationnode_set.filter(status=ValidationNodeStatus.UNKNOWN, node__workflow=workflow).exists():
            return ValidationWorkflowArtefactStatus.PENDING
        if self.validationnode_set.filter(
            final=False, status=ValidationNodeStatus.ACCEPTED, node__workflow=workflow
        ).exists():
            return ValidationWorkflowArtefactStatus.PENDING

        raise ValueError

    def get_next_pending_nodes(self, workflow):
        from iaso.models.validation_workflow.validation_node import ValidationNodeStatus

        return self.validationnode_set.filter(status=ValidationNodeStatus.UNKNOWN, node__workflow=workflow)

    def _collect_artefact_pks(self):
        pks = []

        if self.parent_artefact_for_validation:
            pks.extend(self.parent_artefact_for_validation._collect_artefact_pks())

        pks.append(self.pk)

        return pks

    def get_all_validation_nodes(self, workflow):
        """
        Function to recursively get all validation nodes (including parent) and order them
        """
        from iaso.models import ValidationNode

        artefact_pks = self._collect_artefact_pks()

        order = Case(
            *[When(instance_id=pk, then=pos) for pos, pk in enumerate(artefact_pks)],
            output_field=IntegerField(),
        )

        return (
            ValidationNode.objects.filter(node__workflow=workflow, instance_id__in=artefact_pks)
            .annotate(_order=order)
            .order_by("-_order", "-created_at")
        )
