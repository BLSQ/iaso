import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from ..common import CreatedAndUpdatedModel
from .templates import ValidationStateTemplate, ValidationStepTemplate, ValidationWorkflowTemplate


class ValidationWorkflowObjectStatus(models.TextChoices):
    ACTIVE = "active", _("Active")
    APPROVED = "approved", _("Approved")
    REJECTED = "rejected", _("Rejected")
    CANCELLED = "cancelled", _("Cancelled")


class ValidationWorkflowObject(CreatedAndUpdatedModel):
    """
    Represents a running instance (object) of the workflow
    """

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workflow_template = models.ForeignKey(ValidationWorkflowTemplate, on_delete=models.CASCADE)

    status = models.CharField(
        max_length=20, choices=ValidationWorkflowObjectStatus.choices, default=ValidationWorkflowObjectStatus.ACTIVE
    )

    # we attach here any object, can be a form submission, an orgunit, whatever.
    # todo : we could drop this and replace it with nullable foreign keys.
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, blank=True, null=True)
    object_id = models.CharField(max_length=500, blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.PROTECT, related_name="%(class)s_created_set"
    )

    @property
    def is_active(self):
        return self.status == ValidationWorkflowObjectStatus.ACTIVE

    @property
    def is_finished(self):
        return self.status != ValidationWorkflowObjectStatus.ACTIVE


class ValidationStateObjectStatus(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    CANCELLED = "cancelled", _("Cancelled")  # in case a parallel branch with higher prio went over
    ACTIVE = "active", _("Active")


class ValidationStateObject(CreatedAndUpdatedModel):
    """
    Represents a running instance of the defined workflow state
    """

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    workflow_object = models.ForeignKey(
        ValidationWorkflowObject, on_delete=models.CASCADE, related_name="state_objects"
    )

    state_template = models.ForeignKey(ValidationStateTemplate, on_delete=models.CASCADE)

    status = models.CharField(
        choices=ValidationStateObjectStatus.choices,
        default=ValidationStateObjectStatus.ACTIVE,
    )


class ValidationStepObjectStatus(models.TextChoices):
    PENDING = "pending", _("Pending")
    APPROVED = "approved", _("Approved")
    REJECTED = "rejected", _("Rejected")
    CANCELLED = "cancelled", _("Cancelled")  # in case a parallel branch with higher prio went over


class ValidationStepObject(CreatedAndUpdatedModel):
    """
    Represents a running instance of a step (transition)
    """

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    from_state_object = models.ForeignKey(
        ValidationStateObject, on_delete=models.CASCADE, related_name="outgoing_step_objects"
    )
    to_state_object = models.ForeignKey(
        ValidationStateObject, on_delete=models.CASCADE, related_name="incoming_step_objects", null=True, blank=True
    )

    step_template = models.ForeignKey(ValidationStepTemplate, on_delete=models.CASCADE, related_name="step_objects")

    status = models.CharField(
        max_length=20, choices=ValidationStepObjectStatus.choices, default=ValidationStepObjectStatus.PENDING
    )
    updated_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.PROTECT, related_name="%(class)s_updated_set"
    )
    comment = models.TextField(blank=True)
