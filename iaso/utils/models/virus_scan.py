from django.db import models
from django.utils.translation import gettext as _


class VirusScanStatus(models.TextChoices):
    CLEAN = "CLEAN", _("Clean")
    PENDING = "PENDING", _("Pending")  # default value + when scanning is not enabled
    INFECTED = "INFECTED", _("Infected")
    ERROR = "ERROR", _("Error")  # in case the scan couldn't be done
