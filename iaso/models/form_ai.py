import uuid

from django.contrib.auth.models import User
from django.db import models

from iaso.models.base import Account


def _xls_file_upload_to(instance, filename):
    return f"form_ai/{instance.uuid}/form.xlsx"


class TemporaryForm(models.Model):
    """Tracks an AI-generated XLSForm file produced by the Form AI."""

    uuid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    xls_file = models.FileField(upload_to=_xls_file_upload_to)
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="temporary_forms")
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="temporary_forms")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"TemporaryForm {self.uuid} ({self.user})"
