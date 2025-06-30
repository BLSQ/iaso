from django.db import models
from django.utils.translation import gettext as _


class VirusScanStatus(models.TextChoices):
    CLEAN = "CLEAN", _("Clean")
    PENDING = "PENDING", _("Pending")  # default value + when scanning is not enabled
    INFECTED = "INFECTED", _("Infected")
    ERROR = "ERROR", _("Error")  # in case the scan couldn't be done


class ModelWithFile(models.Model):
    """Base model class that automatically adds file fields"""

    file = models.FileField(
        null=True,
        blank=True,
    )
    file_last_scan = models.DateTimeField(blank=True, null=True)
    file_scan_status = models.CharField(max_length=10, choices=VirusScanStatus.choices, default=VirusScanStatus.PENDING)

    class Meta:
        abstract = True
