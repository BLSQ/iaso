from django.db import models
from django.db.models import Case, IntegerField, Q, When
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

    def _collect_artefact_pks(self):
        pks = []

        if self.parent_artefact_for_validation:
            pks.extend(self.parent_artefact_for_validation._collect_artefact_pks())

        pks.append(self.pk)

        return pks

    def get_all_validation_nodes(self, workflow=None):
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
            ValidationNode.objects.filter(
                instance_id__in=artefact_pks, **{"node__workflow": workflow} if workflow else {}
            )
            .annotate(_order=order)
            .order_by("-_order", "-created_at")
        )

    def get_next_bypass_nodes(self, workflow=None):
        from iaso.models import ValidationNodeTemplate
        from iaso.models.validation_workflow.validation_node import ValidationNodeStatus

        if self.general_validation_status == ValidationWorkflowArtefactStatus.PENDING:
            return (
                ValidationNodeTemplate.objects.prefetch_related("validationnode")
                .filter(can_skip_previous_nodes=True, **{"workflow": workflow} if workflow else {})
                .filter(Q(validationnode__isnull=True) | Q(validationnode__status=ValidationNodeStatus.UNKNOWN))
            )

        return ValidationNodeTemplate.objects.none()
