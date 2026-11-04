from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import CheckConstraint, Q, UniqueConstraint
from django.utils.translation import gettext_lazy as _

from iaso.models.team import Team, TeamQuerySet


User = get_user_model()


class PlanningConfigQuerySet(models.QuerySet):
    def filter_for_user(self, user: User) -> "PlanningConfigQuerySet":
        account = getattr(getattr(user, "iaso_profile", None), "account", None)
        if not account:
            return self.none()

        return self.filter(Q(planning__deleted_at__isnull=True) & Q(planning__project__account=account))


class PlanningConfig(models.Model):
    planning = models.ForeignKey("Planning", on_delete=models.CASCADE, related_name="configs")

    level = models.PositiveIntegerField(validators=[MinValueValidator(1)], null=False)

    org_unit_types = models.ManyToManyField("OrgUnitType", blank=True)
    org_unit_groups = models.ManyToManyField("iaso.Group", blank=True)

    objects = PlanningConfigQuerySet.as_manager()

    class Meta:
        ordering = ("level",)
        constraints = [
            CheckConstraint(check=Q(level__gte=1), name="level_gte_1"),
            UniqueConstraint(
                fields=("planning", "level"),
                name="planning_config_planning_level_uniq",
            ),
        ]

    def get_related_teams(self) -> TeamQuerySet:
        return (
            Team.objects.filter_for_account(account=self.planning.project.account)
            .annotate_with_depth()
            .filter(depth__lte=self.level)
        )

    def __str__(self):
        return _("Planning Config for planning {planning} at level {level}").format(
            level=self.level, planning=self.planning
        )
