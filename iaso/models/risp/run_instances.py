from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from .templates import RISPWorkflow, RISPNode
from ..common import CreatedAndUpdatedModel


class RISPWorkflowInstance(CreatedAndUpdatedModel):
    """
    Represents a running instance of the workflow
    """

    class WorkflowStatus(models.TextChoices):
        ACTIVE = "active", _("Active")
        COMPLETED = "completed", _("Completed")

    workflow = models.ForeignKey(RISPWorkflow, on_delete=models.CASCADE)

    status = models.CharField(max_length=20, choices=WorkflowStatus.choices,
                              default=WorkflowStatus.ACTIVE)

    # we attach here any object, can be a form submission, an orgunit, whatever.
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=500, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")


class RISPNodeInstance(CreatedAndUpdatedModel):
    """
    Represents a running instance of the workflow
    """

    class Status(models.TextChoices):
        COMPLETED = 'completed', _("Completed")
        CANCELLED = 'cancelled', _('Cancelled') # in case a parallel branch with higher prio went over
        ACTIVE = 'active', _('Active')

    workflow_instance = models.ForeignKey(
        RISPWorkflowInstance,
        on_delete=models.CASCADE,
        related_name="node_instances"
    )

    node = models.ForeignKey(RISPNode, on_delete=models.CASCADE)

    status = models.CharField(
        choices=Status.choices,
        default=Status.ACTIVE,
    )


class RISPTransitionInstance(CreatedAndUpdatedModel):
    """
    Reprensents a running instance of a transition
    """

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        CANCELLED = "cancelled", _("Cancelled") # in case a parallel branch with higher prio went over

    node_instance = models.ForeignKey(RISPNodeInstance, on_delete=models.CASCADE, related_name='transition_instances')

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    rejection_comment = models.TextField(blank=True)