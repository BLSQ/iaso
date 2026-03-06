"""
Those models define a static definition of a workflow. (See it as a hardcoded graph template).

Each workflow is made of multiple states and steps (transitions) between those states.
"""

from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Q

from iaso.models import Instance
from iaso.models.base import UserRole
from iaso.models.common import CreatedAndUpdatedModel
from iaso.utils.models.color import ColorField
from iaso.utils.models.soft_deletable import SoftDeletableModel


class ValidationWorkflow(CreatedAndUpdatedModel, SoftDeletableModel):
    """
    Static definition of a workflow
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

    def __str__(self):
        return self.name

    @staticmethod
    def is_entity_allowed(instance):
        return isinstance(instance, Instance)

    def get_starting_node(self):
        return self.nodes.exclude(
            id__in=self.nodes.filter(next_nodes__isnull=False).values_list("next_nodes", flat=True)
        ).first()


class ValidationNode(CreatedAndUpdatedModel):
    """
    Represents a node in the workflow aka a Task to do in order to continue the validation.
    """

    workflow = models.ForeignKey(ValidationWorkflow, on_delete=models.CASCADE, related_name="nodes")
    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name")
    color = ColorField(blank=True, null=True)
    next_nodes = models.ManyToManyField("self", symmetrical=False, related_name="previous_nodes")
    roles_required = models.ManyToManyField(UserRole, blank=True)
    can_skip_previous_nodes = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    def get_validation_statuses(self):
        return self.validationstatus_set.all()

    def is_final_node(self):
        return not self.next_nodes.count()

    def get_all_previous_nodes_for_bypass(self, instance):
        visited = set()
        stack = list(
            self.previous_nodes.prefetch_related("validationstatus_set")
            .filter(Q(validationstatus__status_in=["REJECTED", "UNKNOWN"]))
            .filter(validationstatus__instance=instance)
            .values_list("pk", flat=True)
        )
        while stack:
            node = stack.pop()
            if node.pk not in visited:
                visited.add(node.pk)
                stack.extend(node.get_all_previous_nodes_for_bypass(instance))

        return ValidationNode.objects.filter(pk__in=visited)
