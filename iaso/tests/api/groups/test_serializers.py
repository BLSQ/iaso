from iaso.api.groups.serializers import GroupExportSerializer
from iaso.test import TestCase


class GroupExportSerializerTestCase(TestCase):
    """
    Test GroupExportSerializer.
    """

    def test_happy_path(self):
        serializer_xlsx = GroupExportSerializer(data={"file_format": "xlsx"})
        self.assertTrue(serializer_xlsx.is_valid())
        serializer_csv = GroupExportSerializer(data={"file_format": "csv"})
        self.assertTrue(serializer_csv.is_valid())

    def test_invalid_file_format(self):
        serializer = GroupExportSerializer(data={"file_format": "invalid"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("file_format", serializer.errors)
        self.assertEqual(serializer.errors["file_format"], ['"invalid" is not a valid choice.'])

    def test_blank_file_format(self):
        serializer = GroupExportSerializer(data={"file_format": ""})
        self.assertFalse(serializer.is_valid())
        self.assertIn("file_format", serializer.errors)
        self.assertEqual(serializer.errors["file_format"], ['"" is not a valid choice.'])

    def test_missing_file_format(self):
        serializer = GroupExportSerializer(data={})
        self.assertFalse(serializer.is_valid())
        self.assertIn("file_format", serializer.errors)
        self.assertEqual(serializer.errors["file_format"], ["This field is required."])
