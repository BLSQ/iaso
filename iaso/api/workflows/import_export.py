import typing
from iaso.models.entity import EntityType
from iaso.models.forms import Form
from iaso.models.workflow import Workflow, WorkflowChange, WorkflowFollowup, WorkflowVersion


def export_workflow(workflow: Workflow) -> typing.Dict:
    """Exports the given workflow as a dict
    This version implies that an entity type with the same name and the same reference form exists.
    It also implies that the forms in the follow ups and changes exist.
    """
    workflow_data = {
        "entity_type": workflow.entity_type.name,
        "created_at": workflow.created_at.isoformat(),
        "updated_at": workflow.updated_at.isoformat(),
        "versions": [],
    }

    for version in workflow.workflow_versions.all().order_by("-created_at"):
        version_data = {
            "name": version.name,
            "status": version.status,
            "created_at": version.created_at.isoformat(),
            "updated_at": version.updated_at.isoformat(),
            "follow_ups": [],
            "changes": [],
        }

        for follow_up in version.follow_ups.all():
            follow_up_data = {
                "order": follow_up.order,
                "condition": follow_up.condition,
                "forms": [form.name for form in follow_up.forms.all()],
                "created_at": follow_up.created_at.isoformat(),
                "updated_at": follow_up.updated_at.isoformat(),
            }
            version_data["follow_ups"].append(follow_up_data)

        for change in version.changes.all():
            change_data = {
                "form": change.form.name,
                "mapping": change.mapping,
                "created_at": change.created_at.isoformat(),
                "updated_at": change.updated_at.isoformat(),
            }
            version_data["changes"].append(change_data)

        workflow_data["versions"].append(version_data)

    return workflow_data


def import_workflow(workflow_data: typing.Dict) -> Workflow:
    """Imports a workflow from a dict and returns a Workflow object
    This version implies that an entity type with the same name and the same reference form exists.
    It also implies that the forms in the follow ups and changes exist.
    """
    entity_type_name = workflow_data["entity_type"]
    entity_type = EntityType.objects.get(name=entity_type_name)

    workflow = Workflow(entity_type=entity_type)
    workflow.save()

    for version_data in workflow_data["versions"]:
        version = WorkflowVersion(
            workflow=workflow,
            name=version_data["name"],
            status=version_data["status"],
        )
        version.save()

        for follow_up_data in version_data["follow_ups"]:
            follow_up = WorkflowFollowup(
                order=follow_up_data["order"],
                condition=follow_up_data["condition"],
                workflow_version=version,
            )
            follow_up.save()
            for form_name in follow_up_data["forms"]:
                form = Form.objects.get(name=form_name)
                follow_up.forms.add(form)

        for change_data in version_data["changes"]:
            form = Form.objects.get(name=change_data["form"])
            change = WorkflowChange(
                form=form,
                mapping=change_data["mapping"],
                workflow_version=version,
            )
            change.save()

    return workflow
