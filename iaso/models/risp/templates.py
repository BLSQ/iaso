import uuid

from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import models
from autoslug import AutoSlugField
from django.utils.translation import gettext_lazy as _

from iaso.models import UserRole
from iaso.models.common import CreatedAndUpdatedModel


class RISPWorkflow(CreatedAndUpdatedModel):
    """
    The main workflow object that is a template, a static definition of a workflow
    """
    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name", unique=True)
    description = models.TextField(blank=True, max_length=1024)

    # is_active = models.BooleanField(default=True) => SoftDeletableModel ? needed ?

    owner = models.ForeignKey(get_user_model(), null=True, blank=True, on_delete=models.SET_NULL)

    # Allowed entity types for this workflow
    allowed_content_types = models.ManyToManyField(ContentType, blank=True)

    def __str__(self):
        return self.name

    def get_start_node(self):
        return self.nodes.get(node_type=RISPNode.NodeType.START)

    def get_end_node(self):
        return self.nodes.get(node_type=RISPNode.NodeType.END)

    def is_entity_allowed(self, entity):
        ct = ContentType.objects.get_for_model(entity)
        return self.allowed_content_types.filter(id=ct.id).exists()

class RISPNode(CreatedAndUpdatedModel):
    workflow = models.ForeignKey(RISPWorkflow, on_delete=models.CASCADE, related_name="nodes")
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
        WAIT_ALL = 'wait_for_all', _('Wait for all') # we wait for all parallel branches to merge
        PRIORITY = _("Priority") # by priority (e.g approved director manager is better than 10k steps of normal employees

    # only relevant if the node is of node_type merge
    merge_strategy = models.CharField(
        max_length=50,
        choices=MergeStrategy.choices,
        blank=True,
        null=True
    )

    def __str__(self):
        return f"{self.workflow_id} - {self.name}"


class RISPTransition(CreatedAndUpdatedModel):

    from_node = models.ForeignKey(RISPNode, on_delete=models.CASCADE, related_name="from_node")
    to_node = models.ForeignKey(RISPNode, on_delete=models.CASCADE, related_name="to_node")

    roles_required = models.ManyToManyField(UserRole, blank=True)
    priority = models.PositiveIntegerField(default=0)

    rejection_target = models.ForeignKey(
        RISPNode, blank=True, null=True, on_delete=models.SET_NULL, related_name="rejection_target"
    ) # if set : goes to that node on reject, otherwise whole workflow stops, and we send a notification to user.

    def __str__(self):
        return f'{self.from_node} -> {self.to_node}'