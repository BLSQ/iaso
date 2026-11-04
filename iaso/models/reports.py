import os

from django.contrib.auth.models import User
from django.db import models

from iaso.models import Project
from iaso.utils.models.sized_file_field import SizedFileField
from iaso.utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)
from iaso.utils.models.upload_to import get_account_name_based_on_user


def report_version_upload_to(report_version: "ReportVersion", filename: str):
    """
    Updating the previous upload_to to include the account name
    It's not possible to fetch the account from the report directly because the reverse FK needs the object to be saved first
    So, created_by was added to be able to fetch the account from the user
    However, I don't know how these versions are created and don't know how this field will be populated
    """
    account_name = get_account_name_based_on_user(report_version.created_by)

    return os.path.join(
        account_name,
        "report_versions",
        filename,
    )


class ReportVersion(SoftDeletableModel):
    PUBLISHED = [("published", "Published"), ("unpublished", "Unpublished")]

    # SET_NULL rather than CASCADE: Report.published_version already points the other way (PROTECT).
    report = models.ForeignKey("Report", null=True, blank=True, related_name="versions", on_delete=models.SET_NULL)
    file = SizedFileField(upload_to=report_version_upload_to)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, related_name="report_version_created_set", on_delete=models.SET_NULL
    )
    updated_by = models.ForeignKey(
        User, null=True, blank=True, related_name="report_version_updated_set", on_delete=models.SET_NULL
    )
    status = models.CharField(choices=PUBLISHED, max_length=255, default="unpublished")

    objects = DefaultSoftDeletableManager()
    objects_only_deleted = OnlyDeletedSoftDeletableManager()
    objects_include_deleted = IncludeDeletedSoftDeletableManager()

    def __str__(self):
        return f"{self.name}"


class Report(SoftDeletableModel):
    name = models.CharField(max_length=255)
    published_version = models.ForeignKey(ReportVersion, related_name="published_in_reports", on_delete=models.PROTECT)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DefaultSoftDeletableManager()
    objects_only_deleted = OnlyDeletedSoftDeletableManager()
    objects_include_deleted = IncludeDeletedSoftDeletableManager()

    def publish(self, version: ReportVersion, user=None):
        """Make `version` the version served to the mobile app, and mark the others as unpublished."""
        self.versions.exclude(pk=version.pk).update(status="unpublished", updated_by=user)
        version.status = "published"
        version.updated_by = user
        version.save()
        self.published_version = version
        self.save()

    def __str__(self):
        return f"{self.name} {self.project}"
