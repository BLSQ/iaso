import typing

from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import HasPermission
from iaso.models import Account, Workflow
from iaso.models.entity import EntityType
from iaso.models.forms import Form
from iaso.models.workflow import Workflow, WorkflowChange, WorkflowFollowup, WorkflowVersion, WorkflowVersionsStatus


def export_workflow_real(workflow: Workflow) -> typing.Dict:
    """Exports the given workflow as a dict
    This version assumes that an entity type with the same name and the same reference form exists.
    It also assumes that the forms in the follow-ups and changes exist.
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
            version_data["follow_ups"].append(follow_up_data)  # type: ignore

        for change in version.changes.all():
            change_data = {
                "form": change.form.name,
                "mapping": change.mapping,
                "created_at": change.created_at.isoformat(),
                "updated_at": change.updated_at.isoformat(),
            }
            version_data["changes"].append(change_data)  # type: ignore

        workflow_data["versions"].append(version_data)  # type: ignore

    return workflow_data


def import_workflow_real(workflow_data: typing.Dict, account: Account) -> Workflow:
    """Imports a workflow from a dict and returns a Workflow object
    This version assumes that an entity type with the same name and the same reference form exists.
    It also assumes that the forms in the follow-ups and changes exist.
    """
    entity_type_name = workflow_data["entity_type"]
    entity_type = EntityType.objects.get(name=entity_type_name)

    try:
        wf = Workflow.objects.get(uuid=workflow_data["uuid"])
        if wf.entity_type != entity_type:
            wf.entity_type = entity_type
            wf.save()
    except Workflow.DoesNotExist:
        wf = Workflow.objects.create(uuid=workflow_data["uuid"], entity_type=entity_type)

    # Set all related WorkflowVersion objects' status to UNPUBLISHED if they are currently PUBLISHED
    published_versions = wf.workflow_versions.filter(status=WorkflowVersionsStatus.PUBLISHED.value)
    for version in published_versions:
        version.status = WorkflowVersionsStatus.UNPUBLISHED.value
        version.save()

    for version_data in workflow_data["versions"]:
        try:
            version = WorkflowVersion.objects_include_deleted.get(uuid=version_data["uuid"])
            wv_changed = False

            if version.name != version_data["name"]:
                version.name = version_data["name"]
                wv_changed = True

            if version.status != version_data["status"]:
                version.status = version_data["status"]
                wv_changed = True

            if wv_changed:
                if version.deleted_at is not None:
                    version.deleted_at = None
                version.save()

        except WorkflowVersion.DoesNotExist:
            version = WorkflowVersion.objects.create(
                uuid=version_data["uuid"], workflow=wf, name=version_data["name"], status=version_data["status"]
            )

        version.follow_ups.all().delete()

        for follow_up_data in version_data["follow_ups"]:
            fup = WorkflowFollowup.objects.create(
                order=follow_up_data["order"],
                condition=follow_up_data["condition"],
                workflow_version=version,
                created_at=follow_up_data["created_at"],
                updated_at=follow_up_data["updated_at"],
            )

            for form_name in follow_up_data["forms"]:
                form = Form.objects.filter(projects__account=account).distinct().get(name=form_name)
                fup.forms.add(form)

        version.changes.all().delete()

        for change_data in version_data["changes"]:
            form = Form.objects.filter(projects__account=account).distinct().get(name=change_data["form"])

            WorkflowChange.objects.create(
                form=form,
                mapping=change_data["mapping"],
                workflow_version=version,
                created_at=change_data["created_at"],
                updated_at=change_data["updated_at"],
            )

    return wf


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, HasPermission(permission.WORKFLOW)])  # type: ignore
def export_workflow(request, workflow_id):
    """GET /api/workflows/export/{workflow_id}/
    Exports the workflow version given by {version_id} as a JSON
    """
    workflow = Workflow.objects.get(pk=workflow_id)
    workflow_data = export_workflow_real(workflow)
    return Response(workflow_data)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, HasPermission(permission.WORKFLOW)])  # type: ignore
def import_workflow(request):
    """POST /api/workflows/import/
    Imports the workflow version given by from a JSON body containing an export workflow.
    """
    workflow_data = request.data

    published_versions = [
        version for version in workflow_data["versions"] if version["status"] == WorkflowVersionsStatus.PUBLISHED.value
    ]
    if len(published_versions) > 1:
        return Response(
            {"error": "There can only be one published version in the workflow data."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    workflow = import_workflow_real(workflow_data, request.user.iaso_profile.account)
    return Response({"status": f"Workflow {workflow.uuid} imported successfully"})
