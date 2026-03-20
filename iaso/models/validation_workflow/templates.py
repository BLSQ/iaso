"""
Those models define a static definition of a workflow. (See it as a hardcoded graph template).

Each workflow is made of multiple nodes or tasks.
"""

from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from django.db import models

from iaso.models import Instance
from iaso.models.base import UserRole
from iaso.models.common import CreatedAndUpdatedModel
from iaso.utils.models.color import ColorField
from iaso.utils.models.soft_deletable import DefaultSoftDeletableManager, SoftDeletableModel


class ValidationWorkflow(CreatedAndUpdatedModel, SoftDeletableModel):
    """
    Static definition of a workflow
    """

    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name", unique=True, always_update=True, unique_with="account_id")

    account = models.ForeignKey("Account", on_delete=models.CASCADE)

    description = models.TextField(blank=True, max_length=1024)

    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_created_set"
    )
    updated_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_updated_set"
    )

    objects = DefaultSoftDeletableManager()

    def __str__(self):
        return self.name

    class Meta:
        unique_together = [("account", "slug"), ("account", "name")]

    def is_artifact_allowed(self, instance):
        if self.form_set.count():
            return isinstance(instance, Instance) and self.form_set.filter(pk=instance.form_id).exists()
        return isinstance(instance, Instance)

    def get_starting_node(self):
        return self.node_templates.get(previous_node_templates__isnull=True)


class ValidationNodeTemplate(CreatedAndUpdatedModel):
    """
    Static definition of a node in the workflow (aka a Task) to do in order to continue the validation.
    """

    workflow = models.ForeignKey(ValidationWorkflow, on_delete=models.CASCADE, related_name="node_templates")
    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name", unique=True, always_update=True, unique_with="workflow_id")
    description = models.CharField(max_length=1024, blank=True)
    color = ColorField(blank=True, null=True)
    next_node_templates = models.ManyToManyField("self", symmetrical=False, related_name="previous_node_templates")
    roles_required = models.ManyToManyField(UserRole, blank=True)
    can_skip_previous_nodes = models.BooleanField(default=False)

    class Meta:
        unique_together = [("workflow", "name"), ("workflow", "slug")]

    def __str__(self):
        return self.name

    def get_validation_nodes(self):
        return self.validationnode_set.all()

    def is_final_node(self):
        return not self.next_node_templates.count()

    def get_all_previous_nodes_with_validation_status(self, instance):
        visited = set()
        stack = list(
            self.previous_node_templates.prefetch_related("validationnode_set").filter(
                validationnode__instance=instance
            )
        )
        while stack:
            node = stack.pop()
            if node.pk not in visited:
                visited.add(node.pk)
                stack.extend(node.get_all_previous_nodes_with_validation_status(instance))

        return ValidationNodeTemplate.objects.filter(pk__in=visited)

    def get_all_previous_nodes_for_bypass(self, instance):
        from iaso.models.validation_workflow.validation_node import ValidationNodeStatus

        visited = set()
        stack = list(
            self.previous_node_templates.prefetch_related("validationnode_set")
            .filter(validationnode__status_in=[ValidationNodeStatus.REJECTED, ValidationNodeStatus.UNKNOWN])
            .filter(validationnode__instance=instance)
        )
        while stack:
            node = stack.pop()
            if node.pk not in visited:
                visited.add(node)
                stack.extend(node.get_all_previous_nodes_for_bypass(instance))

        return ValidationNodeTemplate.objects.filter(pk__in=visited)
