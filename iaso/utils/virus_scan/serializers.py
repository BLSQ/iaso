import os

from rest_framework import serializers

from iaso.utils.virus_scan.clamav import scan_uploaded_file_for_virus
from iaso.utils.virus_scan.model import ModelWithFile


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
        self.scan_file(validated_data)
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
        has_updated = self.scan_file_and_update(instance, validated_data)
        if has_updated:
            instance.save()
        return super().update(instance, validated_data)

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

    def scan_file(self, validated_data):
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

    def scan_file_and_update(self, obj, validated_data):
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
