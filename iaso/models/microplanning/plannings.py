from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models.org_unit import OrgUnit, OrgUnitType
from iaso.models.project import Project
from iaso.models.team import Team
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)


class PlanningQuerySet(models.QuerySet):
    def filter_for_user(self, user: User) -> "PlanningQuerySet":
        account = getattr(getattr(user, "iaso_profile", None), "account", None)

        if not account:
            return self.none()

        return self.filter(project__account=account)


class Planning(SoftDeletableModel):
    objects = DefaultSoftDeletableManager.from_queryset(PlanningQuerySet)()
    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(PlanningQuerySet)()
    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(PlanningQuerySet)()

    class Meta:
        ordering = ("name",)

    name = models.CharField(max_length=100, null=False, blank=False)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    started_at = models.DateField(null=True, blank=True)
    ended_at = models.DateField(null=True, blank=True)
    missions = models.ManyToManyField("Mission", blank=True, related_name="plannings")
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    org_unit = models.ForeignKey(
        OrgUnit,
        on_delete=models.PROTECT,
        help_text="The root org unit of the planning used to scope the assignments org units",
        related_name="plannings",
    )
    target_org_unit_types = models.ManyToManyField(
        OrgUnitType,
        related_name="target_plannings",
        blank=True,
        help_text="Org unit types that can receive assignments in this planning",
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
    selected_sampling_result = models.OneToOneField(
        "PlanningSamplingResult",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="selected_by_planning",
    )
    deprecated = models.BooleanField(
        default=False,
        help_text=_(
            "Indicates that this planning is now considered deprecated as it was created before the mission feature was launched."
        ),
    )

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
