from django.db import models

from iaso.models.entity import EntityType

import jsonschema
from django.core.exceptions import ValidationError

from ..utils.models.soft_deletable import (
    SoftDeletableModel,
)


class Workflow(SoftDeletableModel):
    entity_type = models.OneToOneField(
        EntityType,
        on_delete=models.CASCADE,
        related_name="workflow",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def latest_version(self):
        return self.workflow_versions.order_by("-created_at").first()

    def __str__(self):
        return f"Workflow for {self.entity_type.name}"


the_schema_followups = {
    "schema": "http://json-schema.org/draft-04/schema#",
    "type": "array",
    "items": [
        {
            "type": "object",
            "properties": {
                "condition": {"type": "string"},
                "order": {"type": "integer"},
                "created_at": {"type": "string"},
                "updated_at": {"type": "string"},
                "form_ids": {"type": "array", "items": [{"type": "string"}]},
            },
            "required": ["condition", "created_at", "updated_at", "form_ids", "order"],
        }
    ],
}


the_schema_changes = {
    "schema": "http://json-schema.org/draft-04/schema#",
    "type": "array",
    "items": [
        {
            "type": "object",
            "properties": {
                "form": {"type": "string"},
                "mapped_fields": {
                    "type": "array",
                    "items": [
                        {
                            "type": "object",
                            "properties": {
                                "source_form": {"type": "string"},
                                "mappings": {"type": "object"},
                                "updated_at": {"type": "string"},
                                "created_at": {"type": "string"},
                            },
                            "required": ["source_form", "mappings", "updated_at", "created_at"],
                        }
                    ],
                },
            },
            "required": ["form", "mapped_fields"],
        }
    ],
}


def changes_default():
    return [
        {
            "form": "None",
            "mapped_fields": [
                {
                    "source_form": "None",
                    "mappings": {"from": "to"},
                    "updated_at": "None",
                    "created_at": "None",
                }
            ],
        }
    ]


def followups_default():
    return [{"condition": "None", "order": 0, "form_ids": ["None"], "created_at": "None", "updated_at": "None"}]


def validate_from_schema(value, the_schema):
    try:
        jsonschema.validate(instance=value, schema=the_schema)
    except jsonschema.exceptions.ValidationError as ve:
        print(f"Validation Error : {ve}")
        raise ValidationError(f"{value} failed schema validation")


def followups_validate(value):
    validate_from_schema(value, the_schema_followups)


def changes_validate(value):
    validate_from_schema(value, the_schema_changes)


WorkflowVersionsStatusAllowedTransitions = {"D": {"U", "P"}, "U": {"P"}, "P": {"U"}}


class WorkflowVersionsStatus(models.TextChoices):
    DRAFT = "D", "Draft"
    UNPUBLISHED = "U", "Unpublished"
    PUBLISHED = "P", "Published"

    def is_transition_allowed(self, new_status: "WorkflowVersionsStatus"):
        allowed_set = WorkflowVersionsStatusAllowedTransitions.get(self.value, {})
        return new_status.value in allowed_set


class WorkflowVersion(SoftDeletableModel):
    workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="workflow_versions")

    follow_ups = models.JSONField(default=followups_default, validators=[followups_validate])
    changes = models.JSONField(default=changes_default, validators=[changes_validate])

    status = models.CharField(
        max_length=2, choices=WorkflowVersionsStatus.choices, default=WorkflowVersionsStatus.DRAFT
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status_label = WorkflowVersionsStatus(self.status).label
        e_name = self.workflow.entity_type.name
        created_disp = self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        return f"Workflow ({status_label}) ({e_name}) @ {created_disp}"
