from unittest import mock

from django.apps import apps
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection, models

from iaso.test import TestCase
from iaso.utils.models.sized_file_field import SizedFileField


class SizedFileModel(models.Model):
    file = SizedFileField(upload_to="test_uploads/")

    class Meta:
        app_label = "iaso"


class CustomSizedFileModel(models.Model):
    file = SizedFileField(upload_to="test_uploads/", size_field_name="custom_size")

    class Meta:
        app_label = "iaso"


class SizedFileFieldTest(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        with connection.schema_editor() as schema_editor:
            schema_editor.create_model(SizedFileModel)
            schema_editor.create_model(CustomSizedFileModel)

    @classmethod
    def tearDownClass(cls):
        with connection.schema_editor() as schema_editor:
            schema_editor.delete_model(CustomSizedFileModel)
            schema_editor.delete_model(SizedFileModel)
        # Clean up test models from django's app registry
        for model in [SizedFileModel, CustomSizedFileModel]:
            app_models = apps.all_models.get(model._meta.app_label)
            if app_models:
                app_models.pop(model._meta.model_name, None)
        super().tearDownClass()

    def test_new_upload_populates_size(self):
        """Test that new uploads store the file size automatically."""
        mock_storage = mock.MagicMock()
        mock_storage.save.return_value = "test_uploads/hello.txt"
        SizedFileModel._meta.get_field("file").storage = mock_storage

        uploaded_file = SimpleUploadedFile("hello.txt", b"hello world")
        obj = SizedFileModel(file=uploaded_file)

        # Make sure django's FieldFile internals are what we expect.
        self.assertFalse(obj.file._committed)

        obj.save()

        refreshed_obj = SizedFileModel.objects.get(pk=obj.pk)
        self.assertEqual(refreshed_obj.file_size, 11)  # bytes

    def test_descriptor_access_bypasses_storage(self):
        """Test that storage is not called when accessing field size."""
        mock_storage = mock.MagicMock()
        mock_storage.save.return_value = "test_uploads/bypass.txt"
        mock_storage.size.side_effect = Exception("Storage should NOT be called!")
        SizedFileModel._meta.get_field("file").storage = mock_storage

        uploaded_file = SimpleUploadedFile("bypass.txt", b"bypassed content")
        obj = SizedFileModel(file=uploaded_file)
        obj.save()

        refreshed_obj = SizedFileModel.objects.get(pk=obj.pk)

        # Accessing size should bypass storage entirely.
        try:
            size = refreshed_obj.file.size
        except Exception as e:
            self.fail(f"Accessing file.size raised an exception: {e}")

        self.assertEqual(size, 16)
        mock_storage.size.assert_not_called()

    def test_legacy_fallback_calls_storage(self):
        """Test existing instances that have a null file size."""
        mock_storage = mock.MagicMock()
        mock_storage.save.return_value = "test_uploads/legacy.txt"
        mock_storage.size.return_value = 123
        SizedFileModel._meta.get_field("file").storage = mock_storage

        uploaded_file = SimpleUploadedFile("legacy.txt", b"legacy data")
        obj = SizedFileModel(file=uploaded_file)
        obj.save()

        SizedFileModel.objects.filter(pk=obj.pk).update(file_size=None)

        refreshed_obj = SizedFileModel.objects.get(pk=obj.pk)
        self.assertIsNone(refreshed_obj.file_size)

        # Accessing file.size should fall back to storage.size()
        size = refreshed_obj.file.size
        self.assertEqual(size, 123)
        mock_storage.size.assert_called_once_with("test_uploads/legacy.txt")

    def test_custom_size_field_name(self):
        """Check that the field behaves correctly with a custom `size_field_name`."""
        mock_storage = mock.MagicMock()
        mock_storage.save.return_value = "test_uploads/custom.txt"
        CustomSizedFileModel._meta.get_field("file").storage = mock_storage

        uploaded_file = SimpleUploadedFile("custom.txt", b"custom size content")
        obj = CustomSizedFileModel(file=uploaded_file)
        obj.save()

        refreshed_obj = CustomSizedFileModel.objects.get(pk=obj.pk)
        self.assertTrue(hasattr(refreshed_obj, "custom_size"))
        self.assertFalse(hasattr(refreshed_obj, "file_size"))
        self.assertEqual(refreshed_obj.custom_size, 19)  # bytes

        mock_storage.size.side_effect = Exception("Storage should NOT be called!")
        self.assertEqual(refreshed_obj.file.size, 19)
        mock_storage.size.assert_not_called()

    def test_updating_existing_file_updates_size(self):
        """Test that updating an existing file updates the size field correctly."""
        mock_storage = mock.MagicMock()
        mock_storage.save.side_effect = ["test_uploads/first.txt", "test_uploads/second.txt"]
        SizedFileModel._meta.get_field("file").storage = mock_storage

        uploaded_file_1 = SimpleUploadedFile("first.txt", b"hello world")
        obj = SizedFileModel(file=uploaded_file_1)
        obj.save()

        refreshed_obj = SizedFileModel.objects.get(pk=obj.pk)
        self.assertEqual(refreshed_obj.file_size, 11)

        uploaded_file_2 = SimpleUploadedFile("second.txt", b"hello world 20 bytes")
        refreshed_obj.file = uploaded_file_2
        refreshed_obj.save()

        refreshed_obj_2 = SizedFileModel.objects.get(pk=obj.pk)
        self.assertEqual(refreshed_obj_2.file_size, 20)
