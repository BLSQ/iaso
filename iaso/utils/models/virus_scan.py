from builtins import type as builtin_type

from django.db import models
from django.db.models.base import ModelBase
from django.utils.translation import gettext as _


class VirusScanStatus(models.TextChoices):
    CLEAN = "CLEAN", _("Clean")
    PENDING = "PENDING", _("Pending")  # default value + when scanning is not enabled
    INFECTED = "INFECTED", _("Infected")
    ERROR = "ERROR", _("Error")  # in case the scan couldn't be done


class WithFileModelMeta(ModelBase):
    """Metaclass to automatically add file fields to models using WithFileMixin"""

    def __new__(self, name, bases, attrs):
        # Check if this class should have file fields added
        should_add_fields = "Meta" in attrs or any(
            issubclass(base, models.Model) for base in bases if isinstance(base, builtin_type)
        )

        if should_add_fields:
            # Get configuration from the current class being created
            file_field_name = attrs.get("file_field_name", "file")
            storage = attrs.get("storage", None)
            upload_to = attrs.get("upload_to", None)
            file_is_optional = attrs.get("file_is_optional", True)

            # Only add fields if this class has custom configuration
            if file_field_name != "file" or storage is not None or upload_to is not None:
                fields = {
                    file_field_name: models.FileField(
                        storage=storage,
                        upload_to=upload_to,
                        null=file_is_optional,
                        blank=file_is_optional,
                    ),
                    f"{file_field_name}_last_scan": models.DateTimeField(blank=True, null=True),
                    f"{file_field_name}_scan_status": models.CharField(
                        max_length=10, choices=VirusScanStatus.choices, default=VirusScanStatus.PENDING
                    ),
                }

                # Add the fields to the class being created
                for field_name, field_instance in fields.items():
                    if field_name not in attrs:  # Don't override existing fields
                        attrs[field_name] = field_instance

        # Create the class using the parent metaclass
        return super().__new__(self, name, bases, attrs)


class ModelWithFile(models.Model, metaclass=WithFileModelMeta):
    """Base model class that automatically adds file fields"""

    class Meta:
        abstract = True
