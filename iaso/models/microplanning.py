from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Q

from iaso.models.forms import Form
from iaso.models.org_unit import OrgUnit, OrgUnitType
from iaso.models.project import Project
from iaso.models.team import Team
from iaso.utils.models.soft_deletable import SoftDeletableModel


class PlanningSamplingResult(models.Model):
    """Stores the results of sampling runs."""

    planning = models.ForeignKey("Planning", on_delete=models.CASCADE, related_name="sampling_results")
    task = models.ForeignKey("Task", on_delete=models.SET_NULL, null=True, blank=True, related_name="sampling_results")
    pipeline_id = models.CharField(max_length=36, null=True, blank=True, help_text="OpenHexa pipeline UUID")
    pipeline_version = models.CharField(max_length=100, null=True, blank=True, help_text="Pipeline version identifier")
    pipeline_name = models.CharField(max_length=100, null=True, blank=True, help_text="Pipeline name")
    group = models.ForeignKey(
        "Group",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Created org unit group containing sampled units",
    )
    parameters = models.JSONField(help_text="Sampling parameters used for this run")
    status = models.CharField(
        max_length=20,
        choices=[
            ("SUCCESS", "Success"),
            ("FAILED", "Failed"),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Sampling Result"
        verbose_name_plural = "Sampling Results"


class PlanningQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        return self.filter(project__account=user.iaso_profile.account)


class Planning(SoftDeletableModel):
    objects = PlanningQuerySet.as_manager()

    class Meta:
        ordering = ("name",)

    name = models.CharField(max_length=100, null=False, blank=False)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    started_at = models.DateField(null=True, blank=True)
    ended_at = models.DateField(null=True, blank=True)
    forms = models.ManyToManyField(Form, related_name="plannings")
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.PROTECT)
    target_org_unit_type = models.ForeignKey(
        OrgUnitType, on_delete=models.PROTECT, related_name="target_plannings", null=True, blank=True
    )
    published_at = models.DateTimeField(null=True, blank=True)
    pipeline_uuids = ArrayField(
        models.CharField(max_length=36),
        default=list,
        blank=True,
        help_text="List of OpenHexa pipeline UUIDs available for this planning",
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def add_pipeline_uuid(self, pipeline_uuid: str):
        """Add a pipeline UUID to the planning if not already present."""
        if pipeline_uuid not in self.pipeline_uuids:
            self.pipeline_uuids.append(pipeline_uuid)
            self.save(update_fields=["pipeline_uuids"])

    def remove_pipeline_uuid(self, pipeline_uuid: str):
        """Remove a pipeline UUID from the planning."""
        if pipeline_uuid in self.pipeline_uuids:
            self.pipeline_uuids.remove(pipeline_uuid)
            self.save(update_fields=["pipeline_uuids"])

    def has_pipeline_uuid(self, pipeline_uuid: str) -> bool:
        """Check if the planning has a specific pipeline UUID."""
        return pipeline_uuid in self.pipeline_uuids

    def get_pipeline_uuids(self) -> list:
        """Get the list of pipeline UUIDs for this planning."""
        return self.pipeline_uuids or []


class AssignmentQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        return self.filter(planning__project__account=user.iaso_profile.account)


class Assignment(SoftDeletableModel):
    objects = AssignmentQuerySet.as_manager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["planning", "org_unit"],
                condition=Q(deleted_at__isnull=True),
                name="unique_planning_org_unit_when_not_deleted",
            ),
        ]
        ordering = ("planning", "created_at")

    planning = models.ForeignKey("Planning", on_delete=models.CASCADE, null=True, blank=True)
    org_unit = models.ForeignKey("OrgUnit", on_delete=models.CASCADE, null=True, blank=True)

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments")
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True)

    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assignments_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
