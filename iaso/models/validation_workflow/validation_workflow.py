from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Q

from iaso.models.common import CreatedAndUpdatedModel
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    SoftDeletableModel,
)


class ValidationWorkflow(CreatedAndUpdatedModel, SoftDeletableModel):
    """
    Static definition of a workflow
    """

    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name", unique=True, unique_with="account_id")
    description = models.TextField(blank=True, max_length=1024)

    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_created_set"
    )
    updated_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_updated_set"
    )

    account = models.ForeignKey("Account", on_delete=models.CASCADE)

    objects = DefaultSoftDeletableManager()
    all_objects = IncludeDeletedSoftDeletableManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["account", "slug"],
                condition=Q(deleted_at__isnull=True),
                name="unique_account_slug_if_not_deleted",
            ),
            models.UniqueConstraint(
                fields=["account", "name"],
                condition=Q(deleted_at__isnull=True),
                name="unique_account_name_if_not_deleted",
            ),
        ]

    def __str__(self):
        return self.name

    def get_latest_version(self):
        return self.versions.latest_by_version()
