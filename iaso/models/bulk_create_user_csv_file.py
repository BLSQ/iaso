import os

from django.contrib.auth.models import Permission, User
from django.db import models
from django.utils import timezone


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
    account = models.ForeignKey("Account", on_delete=models.PROTECT, null=True)
    default_permissions = models.ManyToManyField(
        Permission, blank=True, related_name="bulk_create_defaults_permissions"
    )
    default_projects = models.ManyToManyField("Project", blank=True, related_name="bulk_create_defaults_projects")
    default_user_roles = models.ManyToManyField("UserRole", blank=True, related_name="bulk_create_defaults_user_roles")
    default_org_units = models.ManyToManyField("OrgUnit", blank=True, related_name="bulk_create_defaults_org_units")
    default_teams = models.ManyToManyField("Team", blank=True, related_name="bulk_create_defaults_teams")
    default_profile_language = models.CharField(max_length=10, blank=True, default="")
    default_organization = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
