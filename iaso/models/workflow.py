from django.db import models
from iaso.models.entity import EntityType, Form
from ..utils.models.soft_deletable import SoftDeletableModel


class Workflow(SoftDeletableModel):
    entity_type = models.OneToOneField(
        EntityType,
        on_delete=models.CASCADE,
        related_name="workflow",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def latest_version(self):
        return self.workflow_versions.order_by("-created_at").first()

    def __str__(self):
        return f"Workflow for {self.entity_type.name}"


WorkflowVersionsStatusAllowedTransitions = {"D": {"U", "P"}, "U": {"P"}, "P": {"U"}}


class WorkflowVersionsStatus(models.TextChoices):
    DRAFT = "D", "Draft"
    UNPUBLISHED = "U", "Unpublished"
    PUBLISHED = "P", "Published"

    def is_transition_allowed(self, new_status: "WorkflowVersionsStatus"):
        allowed_set = WorkflowVersionsStatusAllowedTransitions.get(self.value, {})
        return new_status.value in allowed_set


class WorkflowVersion(models.Model):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="workflow_versions")

    name = models.CharField(max_length=50, default="No Name")
    reference_form = models.ForeignKey(Form, on_delete=models.CASCADE, default=None, null=True)

    status = models.CharField(
        max_length=2, choices=WorkflowVersionsStatus.choices, default=WorkflowVersionsStatus.DRAFT
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status_label = WorkflowVersionsStatus(self.status).label
        e_name = self.workflow.entity_type.name
        created_disp = self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        return f"Workflow ({status_label}) ({e_name}) @ {created_disp}"


class WorkflowFollowup(models.Model):
    order = models.IntegerField(default=0)
    condition = models.TextField()
    forms = models.ManyToManyField(Form)
    workflow = models.ForeignKey(WorkflowVersion, on_delete=models.CASCADE, related_name="follow_ups")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class WorkflowChange(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE)
    mapping = models.JSONField(default=dict)
    workflow = models.ForeignKey(WorkflowVersion, on_delete=models.CASCADE, related_name="changes")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
