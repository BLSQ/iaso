import os

from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils import timezone

from iaso.models import Account


def bulk_create_user_csv_file_upload_to(bulk_create, filename):
    account_name = "unknown_account"  #  shouldn't be unknown, but the model is nullable

    today = timezone.now().date()
    year_month = today.strftime("%Y_%m")

    account = bulk_create.account
    if account:
        account_name = f"{account.short_sanitized_name}_{account.id}"

    return os.path.join(
        account_name,
        "bulk_create_user_csv",
        year_month,
        filename,
    )


class BulkCreateUserCsvFile(models.Model):
    file = models.FileField(upload_to=bulk_create_user_csv_file_upload_to, blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, null=True)
    default_permissions = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    default_projects = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    default_user_roles = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    default_org_units = ArrayField(models.IntegerField(), default=list, blank=True)
    default_teams = ArrayField(models.CharField(max_length=255), default=list, blank=True)
    default_profile_language = models.CharField(max_length=10, blank=True, default="")
    default_organization = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
