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


class PositionChoices(models.TextChoices):
    last = "last", "Last"
    first = "first", "First"
    child_of = "child_of", "Child Of"


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
        # by default we don't allow it if no forms has been configured.
        return False

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

    @transaction.atomic
    def insert_node_template(self, node, position=PositionChoices.last, parent_node_templates=None):
        """
        Function to insert a node in the workflow
        """

        if position == PositionChoices.last:
            node.previous_node_templates.set(
                self.node_templates.filter(next_node_templates__isnull=True).exclude(pk=node.pk)
            )

        if position == PositionChoices.first:
            node.next_node_templates.set(
                self.node_templates.filter(previous_node_templates__isnull=True).exclude(pk=node.pk)
            )

        if position == PositionChoices.child_of:
            if not parent_node_templates:
                raise ValueError("parent_nodes is required")

            previous_nodes = [x.pk for x in parent_node_templates]

            next_nodes = list(
                ValidationNodeTemplate.objects.filter(previous_node_templates__pk__in=previous_nodes)
                .values_list("pk", flat=True)
                .distinct("pk")
            )

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
    def move_node_template(self, node, position=None, parent_node_templates=None):
        if not position:
            raise ValueError("Position is required")

        if position == PositionChoices.last and not node.next_node_templates:
            # nothing to do , node is already last
            return

        if position == PositionChoices.first and not node.previous_node_templates:
            # nothing to do , node is already first
            return

        if position == PositionChoices.child_of and not parent_node_templates:
            raise ValueError("parent_nodes is required")

        new_previous_nodes = []
        new_next_nodes = []

        if position == PositionChoices.first:
            new_next_nodes = list(
                set(self.node_templates.filter(previous_node_templates__isnull=True).values_list("pk", flat=True))
            )

        if position == PositionChoices.last:
            new_previous_nodes = list(
                set(self.node_templates.filter(next_node_templates__isnull=True).values_list("pk", flat=True))
            )

        if position == PositionChoices.child_of:
            new_next_nodes = list(
                ValidationNodeTemplate.objects.filter(previous_node_templates__in=parent_node_templates)
                .values_list("pk", flat=True)
                .distinct()
            )
            new_previous_nodes = [x.pk for x in parent_node_templates]

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
    next_node_templates = models.ManyToManyField(
        "self", symmetrical=False, related_name="previous_node_templates", blank=True
    )
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
