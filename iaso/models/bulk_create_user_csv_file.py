from django.contrib.auth.models import User
from django.db import models

from iaso.models import Account


class BulkCreateUserCsvFile(models.Model):
    file = models.FileField(blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, null=True)
