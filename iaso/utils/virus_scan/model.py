from django.db import models
from django.utils.translation import gettext as _


class VirusScanStatus(models.TextChoices):
    """
    Enumeration of possible virus scan statuses.

    This class defines the different states a file can be in after virus scanning.

    Attributes:
        CLEAN: File has been scanned and is confirmed safe
        PENDING: File is waiting to be scanned or scanning is disabled
        INFECTED: File contains a virus or malicious content
        ERROR: An error occurred during the scanning process
    """

    CLEAN = "CLEAN", _("Clean")
    PENDING = "PENDING", _("Pending")  # default value + when scanning is not enabled
    INFECTED = "INFECTED", _("Infected")
    ERROR = "ERROR", _("Error")  # in case the scan couldn't be done


class ModelWithFile(models.Model):
    """
    Abstract base model that automatically adds virus scanning fields.

    This model provides the basic fields needed for virus scanning functionality:
    - file: The uploaded file
    - file_scan_status: The result of the virus scan
    - file_last_scan: When the file was last scanned

    Any model that inherits from this class will automatically get these fields
    and can use the virus scanning functionality.

    Attributes:
        file (FileField): The uploaded file, can be null/blank
        file_last_scan (DateTimeField): When the file was last scanned
        file_scan_status (CharField): The result of the virus scan (CLEAN, INFECTED, etc.)

    Example:
        class Document(ModelWithFile):
            title = models.CharField(max_length=200)
            content = models.TextField()

        # Now Document has file, file_scan_status, and file_last_scan fields
        doc = Document.objects.create(title="Test Doc")
        # doc.file_scan_status defaults to PENDING
    """

    file = models.FileField(
        null=True,
        blank=True,
    )
    file_last_scan = models.DateTimeField(blank=True, null=True)
    file_scan_status = models.CharField(max_length=10, choices=VirusScanStatus.choices, default=VirusScanStatus.PENDING)

    class Meta:
        abstract = True
