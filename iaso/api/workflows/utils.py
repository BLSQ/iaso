from copy import deepcopy
import uuid

from django.shortcuts import get_object_or_404
from rest_framework import serializers

from iaso.models import WorkflowVersion, EntityType, WorkflowChange, WorkflowFollowup
from iaso.models.workflow import WorkflowVersionsStatus


def validate_version_id(version_id, user):
    wfv = get_object_or_404(WorkflowVersion, pk=version_id)
    et = get_object_or_404(EntityType, pk=wfv.workflow.entity_type_id)
    if wfv.status != WorkflowVersionsStatus.DRAFT:
        raise serializers.ValidationError(f"WorkflowVersion {version_id} is not in draft status")

    if not et.account == user.iaso_profile.account:
        raise serializers.ValidationError(f"User doesn't have access to Entity Type : {wfv.workflow.entity_type_id}")

    return version_id


def make_deep_copy_with_relations(orig_version):
    orig_changes = WorkflowChange.objects.filter(workflow_version=orig_version)
    orig_follow_ups = WorkflowFollowup.objects.filter(workflow_version=orig_version)

    new_version = deepcopy(orig_version)
    new_version.id = None
    new_version.uuid = uuid.uuid4()
    new_version.name = "Copy of " + orig_version.name
    new_version.status = WorkflowVersionsStatus.DRAFT
    new_version.save()

    for oc in orig_changes:
        new_change = deepcopy(oc)
        new_change.workflow_version = new_version
        new_change.id = None
        new_change.save()

    for of in orig_follow_ups:  # Doesn't copy the forms !
        new_followup = deepcopy(of)
        new_followup.workflow_version = new_version
        new_followup.id = None
        new_followup.save()

        orig_forms = of.forms.all()
        new_followup.forms.add(*orig_forms)

    return new_version
