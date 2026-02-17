import uuid

from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models.base import UserRole
from iaso.models.common import CreatedAndUpdatedModel
from iaso.utils.models.soft_deletable import SoftDeletableModel


class ValidationWorkflow(CreatedAndUpdatedModel, SoftDeletableModel):
    """
    The main workflow object that is a template, a static definition of a workflow
    """

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name", unique=True)
    description = models.TextField(blank=True, max_length=1024)

    owner = models.ForeignKey(get_user_model(), null=True, blank=True, on_delete=models.SET_NULL)

    # Allowed entity types for this workflow
    allowed_content_types = models.ManyToManyField(ContentType, blank=True)

    def __str__(self):
        return self.name

    def get_start_node(self):
        return self.nodes.get(node_type=ValidationNode.NodeType.START)

    def get_end_node(self):
        return self.nodes.get(node_type=ValidationNode.NodeType.END)

    def is_entity_allowed(self, entity):
        ct = ContentType.objects.get_for_model(entity)
        return self.allowed_content_types.filter(id=ct.id).exists()


class ValidationNode(CreatedAndUpdatedModel):
    workflow = models.ForeignKey(ValidationWorkflow, on_delete=models.CASCADE, related_name="nodes")
    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name")

    class NodeType(models.TextChoices):
        START = "start", _("Start")
        END = "end", _("End")
        SPLIT = "split", _("Split")
        TASK = "task", _("Task")
        MERGE = "merge", _("Merge")

    node_type = models.CharField(choices=NodeType.choices, max_length=20)

    class MergeStrategy(models.TextChoices):
        WAIT_ALL = "wait_for_all", _("Wait for all")  # we wait for all parallel branches to merge
        PRIORITY = (
            "priority",
            _("Priority"),
        )  # by priority (e.g approved director manager is better than 10k steps of normal employees
        LINEAR = "linear", _("Linear")  # the default one

    merge_strategy = models.CharField(max_length=50, choices=MergeStrategy.choices, default=MergeStrategy.LINEAR)

    def __str__(self):
        return f"{self.workflow_id} - {self.name}"


class ValidationTransition(CreatedAndUpdatedModel):
    name = models.CharField(max_length=100)
    slug = AutoSlugField(populate_from="name")

    from_node = models.ForeignKey(ValidationNode, on_delete=models.CASCADE, related_name="outgoing")
    to_node = models.ForeignKey(ValidationNode, on_delete=models.CASCADE, related_name="incoming")

    roles_required = models.ManyToManyField(UserRole, blank=True)
    priority = models.PositiveIntegerField(default=0)

    # todo : could be improved by defining a whole rejection strategy : to previous node, stops, to target
    rejection_target = models.ForeignKey(
        ValidationNode, blank=True, null=True, on_delete=models.SET_NULL, related_name="rejection_target"
    )  # if set : goes to that node on reject, otherwise whole workflow stops, and we send a notification to user.

    def __str__(self):
        return f"{self.from_node} -> {self.to_node}"
