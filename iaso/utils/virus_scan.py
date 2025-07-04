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


def scan_uploaded_file_for_virus(uploaded_file: InMemoryUploadedFile):
    """
    Scan an uploaded file for viruses using ClamAV.

    This function takes an InMemoryUploadedFile (typically from a Django form),
    creates a temporary file on disk, and scans it using ClamAV. The temporary
    file is automatically cleaned up after scanning.

    Args:
        uploaded_file (InMemoryUploadedFile): The file to scan, typically from
            a Django form upload or DRF serializer.

    Returns:
        tuple: A tuple containing (VirusScanStatus, datetime or None)
            - VirusScanStatus: The result of the scan (CLEAN, INFECTED, ERROR, PENDING)
            - datetime or None: Timestamp of when the scan was performed, or None if error

    Example:
        status, timestamp = scan_uploaded_file_for_virus(uploaded_file)
        if status == VirusScanStatus.CLEAN:
            # File is safe to use
            pass
        elif status == VirusScanStatus.INFECTED:
            # Handle infected file
            pass
    """
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
    """
    Scan a file on disk for viruses using ClamAV.

    This function scans an existing file on the filesystem using ClamAV.
    Useful for scanning files that are already saved to disk.

    Args:
        file_path (str): The absolute path to the file to scan.

    Returns:
        tuple: A tuple containing (VirusScanStatus, datetime or None)
            - VirusScanStatus: The result of the scan (CLEAN, INFECTED, ERROR, PENDING)
            - datetime or None: Timestamp of when the scan was performed, or None if error

    Example:
        status, timestamp = scan_disk_file_for_virus("/path/to/document.pdf")
        if status == VirusScanStatus.CLEAN:
            # File is safe to use
            pass
        elif status == VirusScanStatus.INFECTED:
            # Handle infected file
            pass
    """
    logger.info(f"Scanning disk file {file_path} for virus")
    return _scan_with_clamav(file_path)


def _scan_with_clamav(file_path: str):
    """
    Internal function to perform virus scanning using ClamAV.

    This function handles the actual communication with ClamAV and processes
    the scan results. It's called by the public scanning functions.

    Args:
        file_path (str): The absolute path to the file to scan.

    Returns:
        tuple: A tuple containing (VirusScanStatus, datetime or None)
            - VirusScanStatus: The result of the scan
            - datetime or None: Timestamp of when the scan was performed

    Note:
        This function is internal and should not be called directly.
        Use scan_uploaded_file_for_virus() or scan_disk_file_for_virus() instead.
    """
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


def scan_file(validated_data):
    """
    Scan a file in validated_data and add scan results to the data.

    This function is designed to be used in Django REST Framework serializers
    during the creation of objects that inherit from ModelWithFile. It scans
    the file in validated_data and adds the scan results as additional fields.

    Args:
        validated_data (dict): The validated data from a DRF serializer,
            which may contain a 'file' key with an uploaded file.

    Returns:
        None: The function modifies validated_data in place.

    Example:
        # In a DRF serializer's create method:
        def create(self, validated_data):
            scan_file(validated_data)  # Adds file_scan_status and file_last_scan
            return MyModel.objects.create(**validated_data)

        # validated_data before: {'file': <UploadedFile>, 'name': 'test'}
        # validated_data after: {'file': <UploadedFile>, 'name': 'test',
        #                        'file_scan_status': 'CLEAN', 'file_last_scan': datetime}
    """
    if "file" in validated_data:
        result, timestamp = scan_uploaded_file_for_virus(validated_data["file"])
        validated_data["file_scan_status"] = result
        validated_data["file_last_scan"] = timestamp


def scan_file_and_update(obj, validated_data):
    """
    Scan a file and update an existing object if the file has changed.

    This function is designed to be used in Django REST Framework serializers
    during the update of objects that inherit from ModelWithFile. It compares
    the new file with the existing one and only scans if the file has changed.

    Args:
        obj: An instance of a model that inherits from ModelWithFile.
        validated_data (dict): The validated data from a DRF serializer.

    Returns:
        bool: True if the object was updated, False otherwise.

    Example:
        # In a DRF serializer's update method:
        def update(self, instance, validated_data):
            has_updated = scan_file_and_update(instance, validated_data)
            if has_updated:
                instance.save()
            return super().update(instance, validated_data)

        # This will only scan the file if it's different from the existing one
        # and will update the instance's file_scan_status and file_last_scan fields
    """
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


class ModelWithFileSerializer(serializers.ModelSerializer):
    """
    Base serializer that automatically handles virus scanning for ModelWithFile models.

    This serializer provides automatic virus scanning functionality for models that
    inherit from ModelWithFile. It adds the file field and scan result fields,
    and automatically scans files during create and update operations.

    The serializer adds these fields:
    - file: The uploaded file field
    - scan_result: Read-only field that returns the scan status
    - scan_timestamp: Read-only field that returns the scan timestamp

    Attributes:
        file (FileField): The uploaded file field
        scan_result (SerializerMethodField): Read-only field returning file_scan_status
        scan_timestamp (SerializerMethodField): Read-only field returning file_last_scan timestamp

    Example:
        class DocumentSerializer(ModelWithFileSerializer):
            class Meta:
                model = Document  # Must inherit from ModelWithFile
                fields = ['id', 'title', 'file', 'scan_result', 'scan_timestamp']

        # When creating/updating, files are automatically scanned
        serializer = DocumentSerializer(data={'title': 'Test', 'file': uploaded_file})
        if serializer.is_valid():
            doc = serializer.save()  # File is automatically scanned
    """

    file = serializers.FileField(required=False)
    scan_result = serializers.SerializerMethodField()
    scan_timestamp = serializers.SerializerMethodField()

    class Meta:
        abstract = True

    def __init__(self, *args, **kwargs):
        """
        Initialize the serializer and validate that the model inherits from ModelWithFile.

        Raises:
            ValueError: If the model doesn't inherit from ModelWithFile.
        """
        super().__init__(*args, **kwargs)
        if not issubclass(self.Meta.model, ModelWithFile):
            raise ValueError(f"{self.Meta.model.__name__} must inherit from ModelWithFile")

    def create(self, validated_data):
        """
        Create a new instance with automatic virus scanning.

        This method automatically scans any uploaded file before creating
        the model instance. The scan results are added to the validated_data.

        Args:
            validated_data (dict): The validated data for creating the instance.

        Returns:
            The created model instance.

        Example:
            # The file will be automatically scanned during creation
            doc = DocumentSerializer().create({'title': 'Test', 'file': uploaded_file})
            # doc.file_scan_status will contain the scan result
        """
        model_class = self.Meta.model
        scan_file(validated_data)
        return model_class.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Update an existing instance with automatic virus scanning.

        This method automatically scans any new uploaded file before updating
        the model instance. It only scans if the file has actually changed.

        Args:
            instance: The existing model instance to update.
            validated_data (dict): The validated data for updating the instance.

        Returns:
            The updated model instance.

        Example:
            # The file will be automatically scanned if it's different
            doc = DocumentSerializer().update(existing_doc, {'file': new_file})
            # doc.file_scan_status will be updated if file changed
        """
        has_updated = scan_file_and_update(instance, validated_data)
        if has_updated:
            instance.save()
        return super().update(instance, validated_data)

    def get_scan_result(self, obj):
        """
        Get the scan result for serialization.

        Args:
            obj: The model instance.

        Returns:
            str: The scan status (CLEAN, INFECTED, PENDING, ERROR).
        """
        return obj.file_scan_status

    def get_scan_timestamp(self, obj):
        """
        Get the scan timestamp for serialization.

        Args:
            obj: The model instance.

        Returns:
            float or None: The timestamp as a Unix timestamp, or None if not scanned.
        """
        if obj.file_last_scan:
            return obj.file_last_scan.timestamp()
        return obj.file_last_scan
