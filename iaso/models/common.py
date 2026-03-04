from django.db import models


class CreatedAndUpdatedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ValidationWorkflowEntity(models.Model):
    # parent_instance_for_validation = models.ForeignKey("self", null=True, on_delete=models.SET_NULL)

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
