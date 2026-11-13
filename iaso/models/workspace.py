from django.contrib.auth.models import User
from django.db import models
from django.db.models import Q

from iaso.models.common import CreatedAndUpdatedModel
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)


class Workspace(SoftDeletableModel, CreatedAndUpdatedModel):
    """Isolation boundary below the account: workspaces of one account share its geography but not their data."""

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["account", "name"],
                condition=Q(deleted_at__isnull=True),
                name="iaso_workspace_account_name_uniq",
            ),
        ]

    account = models.ForeignKey("iaso.Account", on_delete=models.CASCADE, related_name="workspaces")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    source_workspace = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        help_text="Workspace this one was duplicated from (provenance only).",
    )
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    objects = DefaultSoftDeletableManager()
    objects_only_deleted = OnlyDeletedSoftDeletableManager()
    objects_include_deleted = IncludeDeletedSoftDeletableManager()

    def __str__(self):
        return f"{self.name} ({self.account_id})"
