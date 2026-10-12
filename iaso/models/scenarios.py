from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q

from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)


class ScenarioKind(models.TextChoices):
    ENTITY = "entity", "Entity"
    FORM = "form", "Form"


class ScenarioStatus(models.TextChoices):
    PASSED = "passed", "Passed"
    FAILED = "failed", "Failed"
    ERROR = "error", "Error"


class StepStatus(models.TextChoices):
    OK = "ok", "OK"
    FAILED = "failed", "Failed"  # an expectation isn't met
    REFUSED = "refused", "Refused"  # the form refuses the answers, unexpectedly
    NOT_OFFERED = "not_offered", "Not offered"  # entity steps: the app wouldn't offer the form
    ERROR = "error", "Error"  # the step can't run


class Scenario(SoftDeletableModel):
    """A scenario file (`iaso.scenarios.schema`), kept to be run again, against a workflow version or a form.

    Scoped by account, like entity types (an entity type can be used by several projects; TODO an optional project,
    if scenarios need one). Entity and form scenarios are expected to merge into one, where a journey mixes plain forms
    and several entity types: `entity_type` is a filter for entity scenarios, not their identity.
    """

    account = models.ForeignKey("iaso.Account", on_delete=models.CASCADE)
    kind = models.CharField(max_length=20, choices=ScenarioKind.choices)
    entity_type = models.ForeignKey(
        "iaso.EntityType", null=True, blank=True, on_delete=models.CASCADE, related_name="scenarios"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    definition = models.JSONField()

    # the last run only
    last_run_at = models.DateTimeField(null=True, blank=True)
    last_run_workflow_version = models.ForeignKey(
        "iaso.WorkflowVersion", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )
    last_run_status = models.CharField(max_length=20, choices=ScenarioStatus.choices, blank=True, default="")
    last_run_result = models.JSONField(null=True, blank=True)

    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DefaultSoftDeletableManager()
    objects_only_deleted = OnlyDeletedSoftDeletableManager()
    objects_include_deleted = IncludeDeletedSoftDeletableManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["account", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_scenario_name_per_account",
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.kind})"
