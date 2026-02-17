from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from ..common import CreatedAndUpdatedModel
from .templates import ValidationNode, ValidationTransition, ValidationWorkflow


class ValidationWorkflowInstanceStatus(models.TextChoices):
    ACTIVE = "active", _("Active")
    APPROVED = "approved", _("Approved")
    REJECTED = "rejected", _("Rejected")
    CANCELLED = "cancelled", _("Cancelled")


class ValidationWorkflowInstance(CreatedAndUpdatedModel):
    """
    Represents a running instance of the workflow
    """

    workflow = models.ForeignKey(ValidationWorkflow, on_delete=models.CASCADE)

    status = models.CharField(
        max_length=20, choices=ValidationWorkflowInstanceStatus.choices, default=ValidationWorkflowInstanceStatus.ACTIVE
    )

    # we attach here any object, can be a form submission, an orgunit, whatever.
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, blank=True, null=True)
    object_id = models.CharField(max_length=500, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    created_by = models.ForeignKey(get_user_model(), null=True, blank=True, on_delete=models.PROTECT)

    @property
    def is_active(self):
        return self.status == ValidationWorkflowInstanceStatus.ACTIVE

    @property
    def is_finished(self):
        return self.status != ValidationWorkflowInstanceStatus.ACTIVE


class ValidationNodeInstance(CreatedAndUpdatedModel):
    """
    Represents a running instance of the workflow node
    """

    class Status(models.TextChoices):
        COMPLETED = "completed", _("Completed")
        CANCELLED = "cancelled", _("Cancelled")  # in case a parallel branch with higher prio went over
        ACTIVE = "active", _("Active")

    workflow_instance = models.ForeignKey(
        ValidationWorkflowInstance, on_delete=models.CASCADE, related_name="node_instances"
    )

    node = models.ForeignKey(ValidationNode, on_delete=models.CASCADE)

    status = models.CharField(
        choices=Status.choices,
        default=Status.ACTIVE,
    )


class ValidationTransitionInstance(CreatedAndUpdatedModel):
    """
    Represents a running instance of a transition
    """

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        CANCELLED = "cancelled", _("Cancelled")  # in case a parallel branch with higher prio went over

    from_node_instance = models.ForeignKey(
        ValidationNodeInstance, on_delete=models.CASCADE, related_name="outgoing_transition_instances"
    )
    transition = models.ForeignKey(ValidationTransition, on_delete=models.CASCADE, related_name="instances")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    updated_by = models.ForeignKey(get_user_model(), null=True, blank=True, on_delete=models.PROTECT)
    rejection_comment = models.TextField(blank=True)
