from django.db import transaction
from django.db.models import Exists, OuterRef, Prefetch
from django.utils.translation import gettext_lazy as _
from semantic_version import Version

from iaso.models import ValidationNode, ValidationNodeTemplate, ValidationWorkflow, ValidationWorkflowVersion


UPGRADE_STRATEGY_CHOICES = [
    ("major", _("Major")),
    ("minor", _("Minor")),
    ("patch", _("Patch")),
]
UPGRADE_STRATEGY = {
    "major": lambda version: version.next_major(),
    "minor": lambda version: version.next_minor(),
    "patch": lambda version: version.next_patch(),
}

DEFAULT_FIRST_VERSION = "1.0.0"


class ValidationWorkflowServiceException(Exception):
    def __init__(self, message, field=None):
        self.message = message
        self.field = field
        super().__init__(message)


class ValidationWorkflowService:
    @staticmethod
    @transaction.atomic
    def create_validation_workflow(
        *, user=None, account, name, version=DEFAULT_FIRST_VERSION, description="", deleted_at=None, form_set=None
    ):
        vf = ValidationWorkflow.objects.create(
            name=name, description=description, account=account, deleted_at=deleted_at, created_by=user, updated_by=user
        )
        if form_set:
            vf.form_set.set(form_set)

        ValidationWorkflowVersion.objects.create(
            main_workflow=vf,
            version=version,
            created_by=user,
            updated_by=user,
        )

        return vf

    @staticmethod
    @transaction.atomic
    def create_new_version(
        *,
        validation_workflow: ValidationWorkflow,
        user=None,
        version: str = None,
        upgrade: UPGRADE_STRATEGY.keys() = "major",
        clone_node_templates: bool = False,
    ):
        latest_version: ValidationWorkflowVersion = validation_workflow.versions.prefetch_related(
            Prefetch(
                "node_templates",
                ValidationNodeTemplate.objects.filter(workflow__main_workflow=validation_workflow).annotate(
                    has_previous=Exists(
                        ValidationNodeTemplate.previous_node_templates.through.objects.filter(
                            to_validationnodetemplate_id=OuterRef("pk")
                        )
                    )
                ),
            )
        ).latest_by_version()

        if version:
            try:
                Version(version)
            except ValueError:
                raise ValidationWorkflowServiceException(_("Invalid version provided"), "version")

            if Version(version) < latest_version.version:
                raise ValidationWorkflowServiceException(
                    _("The provided version must be greater than the latest version : {}").format(
                        latest_version.version
                    ),
                    "version",
                )

        # create the new version
        version = ValidationWorkflowVersion.objects.create(
            main_workflow=validation_workflow,
            version=version or str(UPGRADE_STRATEGY.get(upgrade)(latest_version.version)),
            created_by=user,
            updated_by=user,
        )

        # clone the node templates
        if clone_node_templates:
            dump_nodes = latest_version.dump_nodes(with_id=True)
            current_validation_node_templates = list(ValidationNodeTemplate.objects.filter(pk__in=dump_nodes))
            roles_required_validation_node_templates = list(
                ValidationNodeTemplate.roles_required.through.objects.filter(validationnodetemplate_id__in=dump_nodes)
            )

            create_node_templates = []
            for node in dump_nodes:
                related_node_template = next(filter(lambda x: x.id == node, current_validation_node_templates))
                create_node_templates.append(
                    ValidationNodeTemplate(
                        name=related_node_template.name,
                        description=related_node_template.description,
                        workflow_id=version.id,
                        can_skip_previous_nodes=related_node_template.can_skip_previous_nodes,
                    )
                )

            objs = ValidationNodeTemplate.objects.bulk_create(create_node_templates)
            objs_ids = [x.id for x in objs]
            mapping_new_node_to_old = dict(zip(dump_nodes, [obj.id for obj in objs]))

            ValidationNodeTemplate.next_node_templates.through.objects.bulk_create(
                [
                    ValidationNodeTemplate.next_node_templates.through(
                        from_validationnodetemplate_id=prev, to_validationnodetemplate_id=nxt
                    )
                    for prev, nxt in zip(objs_ids[:-1], objs_ids[1:])
                ]
            )

            bulk_create_roles_required_node_templates = []

            for old, new in mapping_new_node_to_old.items():
                for item in filter(
                    lambda x: x.validationnodetemplate_id == old, roles_required_validation_node_templates
                ):
                    bulk_create_roles_required_node_templates.append(
                        ValidationNodeTemplate.roles_required.through(
                            validationnodetemplate_id=new, userrole_id=item.userrole_id
                        )
                    )
            ValidationNodeTemplate.roles_required.through.objects.bulk_create(bulk_create_roles_required_node_templates)

        return version

    @staticmethod
    def delete_version(*, version):
        # check if this is linked to anything that has a process on going
        if ValidationNode.objects.filter(
            instance__isnull=False, node__workflow=version, instance__form__deleted_at__isnull=True
        ).exists():
            raise ValidationWorkflowServiceException(
                _("Cannot delete the version has it's linked to current/past processes")
            )

        version.delete()
