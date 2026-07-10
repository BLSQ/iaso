from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q

from iaso.models.team import Team
from iaso.utils.models.soft_deletable import SoftDeletableModel


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
