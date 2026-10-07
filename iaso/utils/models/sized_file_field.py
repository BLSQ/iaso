from django.core.exceptions import FieldDoesNotExist
from django.db import models
from django.db.models.fields.files import FieldFile


class SizedFieldFile(FieldFile):
    """
    A custom FieldFile proxy that returns a cached size from the model instance's
    database field if available, instead of network calls to remote storage.
    """

    @property
    def size(self):
        """
        Return the file size from the cached database column if available.
        """
        if self._committed and self.field and self.instance:
            size_field_name = getattr(self.field, "size_field_name", None)
            if size_field_name:
                val = getattr(self.instance, size_field_name, None)
                if val is not None:
                    return val
        # Fall back to default FieldFile behavior:
        # Access the size of the file being uploaded or query the storage backend.
        return super().size


class SizedFileField(models.FileField):
    """
    FileField subclass that automatically records file sizes on upload.

    A BigIntegerField is added to the model to store the sizes in bytes.
    By default, the extra column's name is the field name + "_size".
    """

    attr_class = SizedFieldFile

    def __init__(self, *args, size_field_name=None, **kwargs):
        """
        Initialize the field with an optional custom database size column name.
        """
        self._explicit_size_field_name = size_field_name
        super().__init__(*args, **kwargs)

    def contribute_to_class(self, cls, name, private_only=False, **kwargs):
        """
        Set up the field on the model and dynamically inject the database size column
        if it does not already exist.

        This is a Django hook called during model class creation.
        """
        self.size_field_name = self._explicit_size_field_name or f"{name}_size"

        super().contribute_to_class(cls, name, private_only=private_only, **kwargs)

        try:
            cls._meta.get_field(self.size_field_name)
        except FieldDoesNotExist:
            size_field = models.PositiveBigIntegerField(null=True, blank=True, editable=False)
            size_field.contribute_to_class(cls, self.size_field_name, private_only=private_only, **kwargs)

    def pre_save(self, model_instance, add):
        """
        Populate the database size column prior to saving the model instance
        if the file is newly uploaded.
        """
        if file := getattr(model_instance, self.attname):
            if not file._committed:
                try:
                    file_size = file.size
                    if not isinstance(file_size, (int, float)):
                        file_size = None
                except AttributeError:
                    file_size = None
                setattr(model_instance, self.size_field_name, file_size)
        else:
            setattr(model_instance, self.size_field_name, None)
        return super().pre_save(model_instance, add)

    def deconstruct(self):
        """
        Return enough information to recreate this field in migrations.
        """
        name, path, args, kwargs = super().deconstruct()
        if self._explicit_size_field_name is not None:
            kwargs["size_field_name"] = self._explicit_size_field_name
        return name, path, args, kwargs
