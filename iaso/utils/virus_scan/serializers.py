import os

from rest_framework import serializers

from iaso.utils.virus_scan.clamav import scan_uploaded_file_for_virus
from iaso.utils.virus_scan.model import ModelWithFile


class ModelWithFileSerializer(serializers.ModelSerializer):
    """
    Base serializer that handles virus scanning for ModelWithFile models.

    This serializer provides virus scanning functionality for models that
    inherit from ModelWithFile. It adds the file field and scan result fields,
    and can scan files.

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
    """

    file = serializers.FileField(required=False)
    scan_result = serializers.CharField(read_only=True, source="file_scan_status")
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

    def scan_file_if_exists(self, validated_data, obj=None) -> bool:
        """
        Scan a potential file in validated_data and add scan results to the data.

        This function is designed to be used in Django REST Framework serializers
        during the creation of objects that inherit from ModelWithFile. It scans
        a potential file in validated_data and adds the scan results as additional fields.

        Args:
            validated_data (dict): The validated data from a DRF serializer,
                which may contain a 'file' key with an uploaded file.
            obj (ModelWithFile, optional): The existing object being updated,
                which is None for create operations.

        Returns:
            bool: returns True if a file was scanned, otherwise False.

        Example:
            # In a DRF serializer's create method:
            def create(self, validated_data):
                self.scan_file_if_exists(validated_data)  # Adds file_scan_status and file_last_scan
                return super().create(**validated_data)

            validated_data before: {'file': <UploadedFile>, 'name': 'test'}
            validated_data after: {'file': <UploadedFile>, 'name': 'test',
                                   'file_scan_status': 'CLEAN', 'file_last_scan': datetime}
        """
        needs_scanning = self._check_if_file_exists_and_needs_scanning(validated_data, obj)
        if needs_scanning:
            result, timestamp = scan_uploaded_file_for_virus(validated_data["file"])
            validated_data["file_scan_status"] = result
            validated_data["file_last_scan"] = timestamp
        return needs_scanning

    def _check_if_file_exists_and_needs_scanning(self, validated_data, obj):
        """
        Determines if a file exists in validated_data and if it needs scanning.
        Files are always scanned during creation. Files are scanned during update only if they have changed.
        """
        if "file" not in validated_data:
            return False

        file = validated_data["file"]
        if not file:
            return False

        if not obj:  # this is a create operation, so we always scan
            return True

        # At this point, we know that a file is present and that it's an update operation
        old_file = obj.file
        if not old_file:
            return True  # no previous file, so we need to scan the new one

        # Compare the new file with the existing one
        needs_scanning = os.path.basename(old_file.name) != os.path.basename(file.name) or old_file.size != file.size
        # we should compare file hashes instead - see POLIO-1959
        return needs_scanning
