"""
Those models define a static definition of a workflow. (See it as a hardcoded graph template).

Each workflow is made of multiple nodes or tasks.
"""

from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.db.models import Q

from iaso.models import Instance
from iaso.models.base import UserRole
from iaso.models.common import BulkAutoSlugField, CreatedAndUpdatedModel
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

    @transaction.atomic
    def delete_node_template(self, node):
        previous_nodes = list(node.previous_node_templates.values_list("pk", flat=True))
        next_nodes = list(node.next_node_templates.values_list("pk", flat=True))

        through_table = node.next_node_templates.through

        # we update the previous nodes by linking them to deleted node next nodes
        through_table.objects.bulk_create(
            [
                through_table(
                    from_validationnodetemplate_id=prev,
                    to_validationnodetemplate_id=nxt,
                )
                for (prev, nxt) in zip(previous_nodes, next_nodes)
            ],
            ignore_conflicts=True,
        )

        q_delete = Q()
        for prev in previous_nodes:
            q_delete |= Q(from_validationnodetemplate_id=prev, to_validationnodetemplate_id=node.id)
        for nxt in next_nodes:
            q_delete |= Q(from_validationnodetemplate_id=node.id, to_validationnodetemplate_id=nxt)

        if q_delete:
            through_table.objects.filter(q_delete).delete()

        node.delete()

    @staticmethod
    @transaction.atomic
    def insert_node_template(node):
        """
        Function to insert a node in the workflow
        """

        previous_nodes = list(node.previous_node_templates.values_list("pk", flat=True))
        next_nodes = list(node.next_node_templates.values_list("pk", flat=True))

        # future previous nodes should be updated and get their next nodes removed
        through_table = node.next_node_templates.through

        to_delete = Q()
        for prev in previous_nodes:
            for nxt in next_nodes:
                to_delete |= Q(
                    from_validationnodetemplate_id=prev,
                    to_validationnodetemplate_id=nxt,
                )
        if to_delete:
            through_table.objects.filter(to_delete).delete()

        # update the related previous nodes to point to the current inserted node and update the next nodes so their previous node is current inserted node
        through_table.objects.bulk_create(
            [
                through_table(
                    from_validationnodetemplate_id=prev,
                    to_validationnodetemplate_id=node.id,
                )
                for prev in previous_nodes
            ]
            + [
                through_table(from_validationnodetemplate_id=node.id, to_validationnodetemplate_id=nxt)
                for nxt in next_nodes
            ],
            ignore_conflicts=True,
        )

    @transaction.atomic
    def move_node_template(self, node, new_previous_nodes=None, new_next_nodes=None):
        new_previous_nodes = [n.pk for n in new_previous_nodes or []]
        new_next_nodes = [n.pk for n in new_next_nodes or []]

        if not new_next_nodes and not new_previous_nodes:
            raise ValueError

        old_previous = list(node.previous_node_templates.values_list("pk", flat=True))
        old_next = list(node.next_node_templates.values_list("pk", flat=True))

        through_table = node.next_node_templates.through

        q_delete = Q()

        for prev in old_previous:
            q_delete |= Q(from_validationnodetemplate_id=prev, to_validationnodetemplate_id=node.id)

        for prev in new_previous_nodes:
            for new_nxt in new_next_nodes:
                q_delete |= Q(from_validationnodetemplate_id=prev, to_validationnodetemplate_id=new_nxt)

        if q_delete:
            through_table.objects.filter(q_delete).delete()

        node.next_node_templates.clear()

        through_table.objects.bulk_create(
            [
                through_table(from_validationnodetemplate_id=prev, to_validationnodetemplate_id=nxt)
                for (prev, nxt) in zip(old_previous, old_next)
            ]
            + [
                through_table(from_validationnodetemplate_id=prev, to_validationnodetemplate_id=node.id)
                for prev in new_previous_nodes
            ]
            + [
                through_table(from_validationnodetemplate_id=node.id, to_validationnodetemplate_id=nxt)
                for nxt in new_next_nodes
            ],
            ignore_conflicts=True,
        )

    def dump_nodes(self):
        start = self.get_starting_node()

        def walk(node, visited):
            path = []
            current = node

            while True:
                if current in visited:
                    path.append(f"[cycle:{current.slug}]")
                    return path

                visited.add(current)
                path.append(current.slug)

                next_nodes = current.next_node_templates.all().order_by("slug")

                if not next_nodes.exists():
                    # end node there
                    return path

                if next_nodes.count() > 1:
                    # split in branches
                    branches = [walk(next_node, visited.copy()) for next_node in next_nodes]
                    path.append(branches)
                    return path

                current = next_nodes[0]

        return walk(start, set())


class ValidationNodeTemplate(CreatedAndUpdatedModel):
    """
    Static definition of a node in the workflow (aka a Task) to do in order to continue the validation.
    """

    workflow = models.ForeignKey(ValidationWorkflow, on_delete=models.CASCADE, related_name="node_templates")
    name = models.CharField(max_length=256)
    slug = BulkAutoSlugField(populate_from="name", unique=True, unique_with="workflow_id")
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
