import typing
from iaso.models import Account
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
        "uuid": workflow.uuid,
        "versions": [],
    }

    for version in workflow.workflow_versions.all().order_by("-created_at"):
        version_data = {
            "name": version.name,
            "status": version.status,
            "created_at": version.created_at.isoformat(),
            "updated_at": version.updated_at.isoformat(),
            "uuid": version.uuid,
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


def import_workflow(workflow_data: typing.Dict, account: Account) -> Workflow:
    """Imports a workflow from a dict and returns a Workflow object
    This version implies that an entity type with the same name and the same reference form exists.
    It also implies that the forms in the follow ups and changes exist.
    """
    entity_type_name = workflow_data["entity_type"]
    entity_type = EntityType.objects.get(name=entity_type_name)

    workflow, created = Workflow.objects.get_or_create(uuid=workflow_data["uuid"])
    if created:
        workflow.entity_type = entity_type
        workflow.save()
    else:
        if workflow.entity_type != entity_type:
            workflow.entity_type = entity_type
            workflow.save()

    for version_data in workflow_data["versions"]:
        version, created = WorkflowVersion.objects.get_or_create(uuid=version_data["uuid"])

        if created:
            version.workflow = workflow
            version.name = version_data["name"]
            version.status = version_data["status"]
            version.save()
        else:
            wv_changed = False

            if version.name != version_data["name"]:
                version.name = version_data["name"]
                wv_changed = True

            if version.status != version_data["status"]:
                version.status = version_data["status"]
                wv_changed = True

            if wv_changed:
                version.save()

        version.follow_ups.all().delete()

        for follow_up_data in version_data["follow_ups"]:
            fup = WorkflowFollowup.objects.create(
                uuid=follow_up_data["uuid"],
                order=follow_up_data["order"],
                condition=follow_up_data["condition"],
                workflow_version=version,
                created_at=follow_up_data["created_at"],
                updated_at=follow_up_data["updated_at"],
            )

            for form_name in follow_up_data["forms"]:
                form = Form.objects.filter(projects__account=account).get(name=form_name)
                fup.forms.add(form)

        version.changes.all().delete()

        for change_data in version_data["changes"]:
            form = Form.objects.filter(projects__account=account).get(name=change_data["form"])

            WorkflowChange.objects.create(
                uuid=change_data["uuid"],
                form=form,
                mapping=change_data["mapping"],
                workflow_version=version,
                created_at=change_data["created_at"],
                updated_at=change_data["updated_at"],
            )

    return workflow
