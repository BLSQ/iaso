from __future__ import annotations

import operator

from functools import reduce
from typing import Self

from django.contrib.auth.models import User
from django.db import models, transaction
from django.db.models import F
from django.utils.translation import gettext_lazy as _
from django_ltree.fields import PathField

from iaso.models import Account, Project
from iaso.models.common import CreatedAndUpdatedModel
from iaso.utils.colors import COLOR_CHOICES
from iaso.utils.expressions import ArraySubquery
from iaso.utils.models.color import ColorField
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)


class TeamQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        account: Account | None = getattr(getattr(user, "iaso_profile", None), "account", None)
        if not account:
            return self.none()
        return self.filter_for_account(account)

    def filter_for_account(self, account: Account) -> Self:
        if not account:
            return self.none()
        return self.filter(project__account=account)

    def annotate_with_depth(self) -> Self:
        return self.annotate(depth=F("path__depth"))

    def hierarchy(self, teams: list[Team] | Self | Team) -> Self:
        """The Team and all their descendants"""
        if isinstance(teams, Team):
            query = models.Q(path__descendants=teams.path)
        elif isinstance(teams, models.QuerySet):
            team_qs = teams
            query = models.Q(path__descendants=ArraySubquery(team_qs.values("path")))
        elif isinstance(teams, list):
            query = reduce(operator.or_, [models.Q(path__descendants=str(ou.path)) for ou in teams])
        else:
            raise NotImplementedError

        return self.filter(query)

    def get_tree(
        self,
        root: list[Team] | Self | Team | None = None,
        max_depth: int | None = None,
    ) -> Self:
        if not root:
            root = self.filter(parent__isnull=True)

        queryset = self.hierarchy(root)

        if max_depth is not None:
            queryset = queryset.filter(path__depth__lte=max_depth)

        return queryset.order_by("path")


class TeamType(models.TextChoices):
    TEAM_OF_TEAMS = "TEAM_OF_TEAMS", _("Team of teams")
    TEAM_OF_USERS = "TEAM_OF_USERS", _("Team of users")

    @classmethod
    def is_valid_team_type(cls, value):
        return value in cls.values


class Team(CreatedAndUpdatedModel, SoftDeletableModel):
    objects = DefaultSoftDeletableManager.from_queryset(TeamQuerySet)()
    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(TeamQuerySet)()
    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(TeamQuerySet)()

    class Meta:
        ordering = ("name",)

    name = models.CharField(max_length=100, null=False, blank=False)
    description = models.TextField(blank=True)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    users = models.ManyToManyField(User, related_name="teams", blank=True)
    manager = models.ForeignKey(User, on_delete=models.PROTECT, related_name="managed_teams")
    parent = models.ForeignKey("self", on_delete=models.PROTECT, null=True, blank=True, related_name="sub_teams")
    path = PathField(unique=True)
    type = models.CharField(choices=TeamType.choices, max_length=100, null=True, blank=True)
    color = ColorField(default=COLOR_CHOICES[0][0])

    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="%(class)s_created_by"
    )
    updated_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="%(class)s_updated_by"
    )

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

    def calculate_paths(self, force_recalculate: bool = False) -> list[Team]:
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
