from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from iaso.models import Instance
from iaso.models.common import CreatedAndUpdatedModel, VersionModel
from iaso.models.common.version import VersionModelQuerySet
from iaso.models.validation_workflow.validation_node_template import ValidationNodeTemplate
from iaso.utils.models.soft_deletable import DefaultSoftDeletableManager, SoftDeletableModel


class PositionChoices(models.TextChoices):
    last = "last", _("Last")
    first = "first", _("First")
    child_of = "child_of", _("Child Of")


class ValidationWorkflowVersionQuerySet(VersionModelQuerySet):
    def latest_version_for_workflow(self, workflow):
        return self.filter(workflow=workflow).latest_by_version()

    def filter_for_account(self, account):
        if not account:
            return self.none()
        return self.filter(main_workflow__account=account)


class ValidationWorkflowVersion(SoftDeletableModel, CreatedAndUpdatedModel, VersionModel):
    main_workflow = models.ForeignKey("ValidationWorkflow", on_delete=models.CASCADE, related_name="versions")

    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_created_set"
    )
    updated_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_updated_set"
    )

    objects = DefaultSoftDeletableManager.from_queryset(ValidationWorkflowVersionQuerySet)()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["main_workflow", "version"],
                condition=Q(deleted_at__isnull=True),
                name="unique_workflow_version_if_not_deleted",
            )
        ]
        ordering = ["main_workflow", "-version_major", "-version_minor", "-version_patch"]

    def __str__(self):
        return f"{self.main_workflow.name} - {self.version}"

    @property
    def version_as_str(self):
        return str(self.version)

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

    def dump_nodes(self, with_id=False):
        if "node_templates" in getattr(self, "_prefetched_objects_cache", {}):
            node_templates = self._prefetched_objects_cache["node_templates"]
        else:
            node_templates = self.node_templates.all().order_by("id")

        flatten_graph = {x.pk: getattr(x, "prefetched_next_nodes", x.next_node_templates.all()) for x in node_templates}

        if "node_templates" in getattr(self, "_prefetched_objects_cache", {}):
            start = [x for x in self._prefetched_objects_cache["node_templates"] if not x.has_previous][
                0
            ]  # has_previous comes from annotation
        else:
            start = self.get_starting_node()

        def walk(node, visited):
            path = []
            current = node

            while True:
                if current.pk in visited:
                    path.append(f"[cycle:{current.pk if with_id else current.slug}]")
                    return path

                visited.add(current.pk)
                path.append(current.pk if with_id else current.slug)

                next_nodes = flatten_graph[current.pk]

                if not next_nodes:
                    # end node there
                    return path

                if len(next_nodes) > 1:
                    # split in branches
                    branches = [walk(next_node, visited.copy()) for next_node in next_nodes]
                    path.append(branches)
                    return path

                current = next_nodes[0]

        return walk(start, set())
