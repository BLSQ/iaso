import os

from django.db import models
from django.utils import timezone

from iaso.models import DataSource


def import_gpkg_upload_to(import_gpkg: "ImportGPKG", filename: str):
    # Updating the previous upload_to to include the account name
    account_name = "unknown_account"  # uploads shouldn't be anonymous, but maybe we can't find the account

    today = timezone.now().date()
    year_month = today.strftime("%Y_%m")

    projects = import_gpkg.data_source.projects
    if projects.exists():
        account = projects.first().account
        account_name = f"{account.short_sanitized_name}_{account.id}"

    return os.path.join(
        account_name,
        "import_gpkgs",
        year_month,
        filename,
    )


class ImportGPKG(models.Model):
    """This file is mainly there to store the gpkg file for the import task"""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    file = models.FileField(upload_to=import_gpkg_upload_to)
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE)
    version_number = models.IntegerField(blank=True, null=True)
    description = models.CharField(max_length=200, blank=True, null=True)
    default_valid = models.BooleanField(default=False)
