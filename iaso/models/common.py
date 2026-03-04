from django.db import models
from django.db.models import Case, IntegerField, When


class CreatedAndUpdatedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ValidationWorkflowEntity(models.Model):
    parent_instance_for_validation = models.ForeignKey("self", null=True, on_delete=models.SET_NULL)

    class Meta:
        abstract = True

    def has_workflow(self, workflow):
        return self.validationstatus_set.filter(node__workflow=workflow).exists()

    def get_validation_status(self, workflow):
        from iaso.models.validation_workflow.validation_status import Status

        if self.validationstatus_set.filter(final=True, status=Status.ACCEPTED, node__workflow=workflow).exists():
            return "APPROVED"

        if self.validationstatus_set.filter(status=Status.REJECTED, node__workflow=workflow).exists():
            return "REJECTED"
        if self.validationstatus_set.filter(status=Status.UNKNOWN, node__workflow=workflow).exists():
            return "PENDING"
        if self.validationstatus_set.filter(final=False, status=Status.ACCEPTED, node__workflow=workflow).exists():
            return "PENDING"

        raise ValueError

    def get_next_pending_states(self, workflow):
        from iaso.models.validation_workflow.validation_status import Status

        return self.validationstatus_set.filter(status=Status.UNKNOWN, node__workflow=workflow)

    def _collect_instance_pks(self):
        pks = []

        if self.parent_instance_for_validation:
            pks.extend(self.parent_instance_for_validation._collect_instance_pks())

        pks.append(self.pk)

        return pks

    def get_all_validation_statuses(self, workflow):
        """
        Function to recursively get all validation statuses (including parent) and order them
        """
        from iaso.models import ValidationStatus

        instance_pks = self._collect_instance_pks()

        order = Case(
            *[When(instance_id=pk, then=pos) for pos, pk in enumerate(instance_pks)],
            output_field=IntegerField(),
        )

        return (
            ValidationStatus.objects.filter(node__workflow=workflow, instance_id__in=instance_pks)
            .annotate(_order=order)
            .order_by("-_order", "-created_at")
        )
