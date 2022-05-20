from django.contrib.auth.models import User
from django.db import models

from iaso.models import Project
from iaso.utils.models.soft_deletable import SoftDeletableModel


class TeamQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        return self.filter(project__account=user.iaso_profile.account)


class TeamType(models.TextChoices):
    TEAM_OF_TEAMS = "TEAM_OF_TEAMS", "Team of teams"
    TEAM_OF_USERS = "TEAM_OF_USERS", "Team of users"


class Team(SoftDeletableModel):
    objects = TeamQuerySet.as_manager()

    class Meta:
        ordering = ("name",)

    name = models.CharField(max_length=100, null=False, blank=False)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    description = models.TextField(blank=True)
    users = models.ManyToManyField(User, related_name="teams", blank=True)
    manager = models.ForeignKey(User, on_delete=models.PROTECT, related_name="managed_teams")
    parent = models.ForeignKey("self", on_delete=models.PROTECT, null=True, blank=True, related_name="sub_teams")
    # scope = models.ManyToManyField("OrgUnit", related_name="teams")
    type = models.CharField(choices=TeamType.choices, max_length=100, null=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
