import os

from django.contrib.auth.models import User
from django.db import models

from iaso.models import Project
from iaso.utils.models.soft_deletable import SoftDeletableModel
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

    file = models.FileField(upload_to=report_version_upload_to)
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

    def __str__(self):
        return f"{self.name}"


class Report(SoftDeletableModel):
    name = models.CharField(max_length=255)
    published_version = models.ForeignKey(ReportVersion, on_delete=models.PROTECT)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} {self.project}"
