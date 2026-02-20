"""
Those models define a static definition of a workflow. (See it as a hardcoded graph template).

Each workflow is made of multiple states and steps (transitions) between those states.
"""

from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models.base import UserRole
from iaso.models.common import CreatedAndUpdatedModel
from iaso.utils.models.soft_deletable import SoftDeletableModel


class ValidationWorkflowTemplate(CreatedAndUpdatedModel, SoftDeletableModel):
    """
    The main workflow object that is a template, a static definition of a workflow
    """

    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name", unique=True, always_update=True)
    description = models.TextField(blank=True, max_length=1024)

    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_created_set"
    )
    updated_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_updated_set"
    )

    # Allowed entity types for this workflow. If we drop the GFK, this could be a static CharField with hardcoded choices
    allowed_content_types = models.ManyToManyField(ContentType, blank=True)

    def __str__(self):
        return self.name

    def get_start_state(self):
        return self.states.get(state_type=ValidationStateTemplateType.START)

    def get_end_state(self):
        return self.states.get(state_type=ValidationStateTemplateType.END)

    def is_entity_allowed(self, entity):
        ct = ContentType.objects.get_for_model(entity)
        return self.allowed_content_types.filter(id=ct.id).exists()


class ValidationStateTemplateType(models.TextChoices):
    START = "start", _("Start")
    END = "end", _("End")
    SPLIT = "split", _("Split")
    TASK = "task", _("Task")
    MERGE = "merge", _("Merge")


class ValidationStateTemplateMergeStrategy(models.TextChoices):
    WAIT_ALL = "wait_for_all", _("Wait for all")  # we wait for all parallel branches to merge
    PRIORITY = (
        "priority",
        _("Priority"),
    )  # by priority (e.g approved director manager is better than 10k steps of normal employees
    LINEAR = "linear", _("Linear")  # the default one


class ValidationStateTemplate(CreatedAndUpdatedModel):
    workflow = models.ForeignKey(ValidationWorkflowTemplate, on_delete=models.CASCADE, related_name="states")
    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name")

    state_type = models.CharField(choices=ValidationStateTemplateType.choices, max_length=20)

    merge_strategy = models.CharField(
        max_length=50,
        choices=ValidationStateTemplateMergeStrategy.choices,
        default=ValidationStateTemplateMergeStrategy.LINEAR,
    )

    def __str__(self):
        return self.name


class ValidationStepTemplate(CreatedAndUpdatedModel):
    name = models.CharField(max_length=100)
    slug = AutoSlugField(populate_from="name", always_update=True)

    from_state = models.ForeignKey(ValidationStateTemplate, on_delete=models.CASCADE, related_name="outgoing")
    to_state = models.ForeignKey(ValidationStateTemplate, on_delete=models.CASCADE, related_name="incoming")

    roles_required = models.ManyToManyField(UserRole, blank=True)  # todo : define if we want roles or permissions ?

    priority = models.PositiveIntegerField(default=0)

    # todo : could be improved by defining a whole rejection strategy : to previous state, stops, to target
    rejection_target = models.ForeignKey(
        ValidationStateTemplate, blank=True, null=True, on_delete=models.SET_NULL, related_name="rejection_target"
    )  # if set : goes to that node on reject, otherwise whole workflow stops, and we send a notification to user.

    def __str__(self):
        return f"{self.from_state} -> {self.to_state}"
