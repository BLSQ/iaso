import logging
import os
import tempfile

import clamav_client

from clamav_client.clamd import CommunicationError
from django.conf import settings
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext as _
from rest_framework import serializers


logger = logging.getLogger(__name__)


class VirusScanStatus(models.TextChoices):
    CLEAN = "CLEAN", _("Clean")
    PENDING = "PENDING", _("Pending")  # default value + when scanning is not enabled
    INFECTED = "INFECTED", _("Infected")
    ERROR = "ERROR", _("Error")  # in case the scan couldn't be done


def scan_uploaded_file_for_virus(uploaded_file: InMemoryUploadedFile):
    # We need a temporary file because the library requires sending disk files (not memory files)
    logger.info(f"Scanning InMemoryUploadedFile {uploaded_file.name} for virus")
    with tempfile.NamedTemporaryFile(mode="wb") as temp_file:
        for chunk in uploaded_file.chunks():
            temp_file.write(chunk)

        temp_file.flush()  # If you don't flush, you send an empty file
        temp_file_path = temp_file.name
        result = _scan_with_clamav(temp_file_path)

    return result


def scan_disk_file_for_virus(file_path: str):
    logger.info(f"Scanning disk file {file_path} for virus")
    return _scan_with_clamav(file_path)


def _scan_with_clamav(file_path: str):
    is_clamav_active = settings.CLAMAV_ACTIVE
    if not is_clamav_active:
        logger.info("ClamAV is not active, skipping scan")
        return VirusScanStatus.PENDING, None

    try:
        scanner = clamav_client.get_scanner(config=settings.CLAMAV_CONFIGURATION)
        before = timezone.now()
        scan = scanner.scan(file_path)
        after = timezone.now()
        file_size = os.path.getsize(file_path)
        logger.info(f"Scan result: {scan} - done in {after - before} - size {file_size} B")

        if scan.passed:
            return VirusScanStatus.CLEAN, after
        if scan.state == "FOUND":
            return VirusScanStatus.INFECTED, after
        if scan.state == "ERROR":
            return VirusScanStatus.ERROR, None

        return VirusScanStatus.PENDING, None

    except CommunicationError as e:
        logger.error(f"Connection error to ClamAV - {e}")
        return VirusScanStatus.ERROR, None
    except Exception as e:
        logger.error(f"Unknown error while scanning file - {e}")
        return VirusScanStatus.ERROR, None


# This method assules we're dealing with a subclass of ModelWithFile
def scan_file(validated_data):
    if "file" in validated_data:
        result, timestamp = scan_uploaded_file_for_virus(validated_data["file"])
        validated_data["file_scan_status"] = result
        validated_data["file_last_scan"] = timestamp


def scan_file_and_update(obj, validated_data):
    has_updated = False
    for key in validated_data.keys():
        if key == "file":
            if not validated_data[key]:
                print("+" * 50)
                print("NO FILE FOUND")
                print("+" * 50)
                continue

            new_file = validated_data[key]
            old_file = obj.file

            if not old_file or (
                os.path.basename(old_file.name) != os.path.basename(new_file.name) or old_file.size != new_file.size
            ):
                print("+" * 50)
                print("UPDATING")
                print("+" * 50)
                has_updated = True
                result, timestamp = scan_uploaded_file_for_virus(new_file)
                obj.file = new_file
                obj.file_scan_status = result
                obj.file_last_scan = timestamp
                print("-" * 50)
                print(result, timestamp)
        elif hasattr(obj, key) and getattr(obj, key) != validated_data[key]:
            has_updated = True
            setattr(obj, key, validated_data[key])
    return has_updated


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


class ModelWithFileSerializer(serializers.ModelSerializer):
    """Base serializer class that adds the file field from ModelWithFile and scans on create and on update"""

    file = serializers.FileField(required=False)
    scan_result = serializers.SerializerMethodField()
    scan_timestamp = serializers.SerializerMethodField()

    class Meta:
        abstract = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not issubclass(self.Meta.model, ModelWithFile):
            raise ValueError(f"{self.Meta.model.__name__} must inherit from ModelWithFile")

    def create(self, validated_data):
        model_class = self.Meta.model
        scan_file(validated_data)
        return model_class.objects.create(**validated_data)

    def update(self, instance, validated_data):
        has_updated = scan_file_and_update(instance, validated_data)
        print("Has UPDATED", has_updated)
        if has_updated:
            instance.save()
        return super().update(instance, validated_data)

    def get_scan_result(self, obj):
        return obj.file_scan_status

    def get_scan_timestamp(self, obj):
        if obj.file_last_scan:
            return obj.file_last_scan.timestamp()
        return obj.file_last_scan
