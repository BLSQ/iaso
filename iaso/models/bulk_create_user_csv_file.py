import os

from datetime import date

from django.contrib.auth.models import User
from django.db import models

from iaso.models import Account


def bulk_create_user_csv_file_upload_to(bulk_create, filename):
    account_name = "unknown_account"  #  shouldn't be unknown, but the model is nullable

    today = date.today()
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
