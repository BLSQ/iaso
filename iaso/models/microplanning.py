import operator
import typing
from functools import reduce

from django.contrib.auth.models import User
from django.db import models, transaction
from django_ltree.fields import PathField  # type: ignore

from iaso.models import Project, Form, OrgUnit
from iaso.utils.expressions import ArraySubquery
from iaso.utils.models.soft_deletable import SoftDeletableModel


class TeamQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        return self.filter(project__account=user.iaso_profile.account)

    def hierarchy(self, teams: typing.Union[typing.List["Team"], "models.QuerySet[Team]", "Team"]) -> "TeamQuerySet":
        """The Team and all their descendants"""
        if isinstance(teams, Team):
            query = models.Q(path__descendants=teams.path)
        elif isinstance(teams, models.QuerySet):
            team_qs = teams
            query = models.Q(path__descendants=ArraySubquery(team_qs.values("path")))
        elif isinstance(teams, (list,)):
            query = reduce(operator.or_, [models.Q(path__descendants=str(ou.path)) for ou in teams])
        else:
            raise NotImplemented

        return self.filter(query)


class TeamType(models.TextChoices):
    TEAM_OF_TEAMS = "TEAM_OF_TEAMS", "Team of teams"
    TEAM_OF_USERS = "TEAM_OF_USERS", "Team of users"


TeamManager = models.Manager.from_queryset(TeamQuerySet)


class Team(SoftDeletableModel):
    objects = TeamManager()

    class Meta:
        ordering = ("name",)

    name = models.CharField(max_length=100, null=False, blank=False)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    users = models.ManyToManyField(User, related_name="teams", blank=True)
    manager = models.ForeignKey(User, on_delete=models.PROTECT, related_name="managed_teams")
    parent = models.ForeignKey("self", on_delete=models.PROTECT, null=True, blank=True, related_name="sub_teams")
    path = PathField(unique=True)
    # scope = models.ManyToManyField("OrgUnit", related_name="teams")
    type = models.CharField(choices=TeamType.choices, max_length=100, null=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Path management logic, taken from org_unit.
    def save(self, *args, skip_calculate_path: bool = False, force_recalculate: bool = False, **kwargs):
        """Override default save() to make sure that the path property is calculated and saved,
        for this org unit and its children.

        :param skip_calculate_path: use with caution - can be useful in scripts where the extra transactions
                                    would be a burden, but the path needs to be set afterwards
        :param force_recalculate: use with caution - used to force recalculation of paths
        """
        # correct type for parent type
        if self.parent and self.parent.type is None:
            self.parent.type = TeamType.TEAM_OF_TEAMS
            self.parent.save(skip_calculate_path=True)

        if skip_calculate_path:
            super().save(*args, **kwargs)
        else:
            with transaction.atomic():
                super().save(*args, **kwargs)
                Team.objects.bulk_update(self.calculate_paths(force_recalculate=force_recalculate), ["path"])

    def calculate_paths(self, force_recalculate: bool = False) -> typing.List["Team"]:
        """Calculate the path for this Team and all its children recursively.

        This method will check if this instance path should change. If it is the case (or if force_recalculate is
        True), it will update the path property for the instance and its children, and return all the modified
        records.

        Please note that this method does not save the modified records. Instead, they are updated in bulk in the
        save() method.

        :param force_recalculate: calculate path for all descendants, even if this instance path does not change
        """

        # keep track of updated records
        updated_records = []

        # noinspection PyUnresolvedReferences
        base_path = [] if self.parent is None else list(self.parent.path)
        new_path = [*base_path, str(self.pk)]
        path_has_changed = new_path != self.path

        if path_has_changed:
            self.path = new_path
            updated_records += [self]

        if path_has_changed or force_recalculate:
            for child in self.sub_teams.all():
                updated_records += child.calculate_paths(force_recalculate)

        return updated_records

    def __str__(self):
        return self.name


class PlanningQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        return self.filter(project__account=user.iaso_profile.account)

class MissionType(models.TextChoices):
    DEFAULT = "DEFAULT", "default"
    FORMS = "MULTIPLE_FORMS", "Multiple Forms"
    CREATE_ORG_UNITS = "CREATE_ORG_UNITS", "Create org units"
    CREATE_ENTITIES = "CREATE_ENTITIES", "Create entities"


"""
Current ideas to improve plannings. 

We have now 4 examples of plannings that we would like to allow to specify:
- Like in Luallaba: for each area, create at least 10 (an as much as you want) POI and for each one of these, fill  
one or multiple forms. 
- Polio LQAS: go to an orgunit and find 60 children and check if they have been vaccinated
- Like for malaria bed net distribution: for a given set of households,  create one entity per person in the household and fill the reference form of that entity. 
  (It should also be possible to add households if they are missing)
- for Niger: ask that a form is filled for a given entity every night (on top of having an initial form filled to specify existing stocks)
"""


class Mission(SoftDeletableModel):
    type = models.CharField(choices=MissionType.choices, max_length=100, null=True, blank=True)
    # org_unit_type ????
    # type could limit the existence of sub-missions
    #   org_unit mission could allow form or/and entity or/and org unit  sub-missions
    #   entity mission could allow form sub_mission
    #   form mission does not allow sub-missions

    task_min_count = models.IntegerField(null=True, blank=True) # this should always be minimum 1
    task_max_count = models.IntegerField(null=True, blank=True)
    forms = models.ManyToManyField(Form, related_name="teams")
    parent = models.ForeignKey(Mission, null=True, blank=True)
    #status = models.CharField(choices=MissionType.choices, max_length=100, null=True, blank=True) to do / finalized to include on mobile?


class FormMission(Mission):

class EntityMission(Mission):

class OrgUnitMission(Mission):


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
    missions = models.ManyToManyField(Mission, related_name="teams")  # should replace forms
    team = models.ForeignKey(Team, on_delete=models.CASCADE)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.PROTECT)
    published_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class AssignmentQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        return self.filter(planning__project__account=user.iaso_profile.account)


class Assignment(SoftDeletableModel):
    objects = AssignmentQuerySet.as_manager()

    class Meta:
        unique_together = [["planning", "org_unit"]]
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
