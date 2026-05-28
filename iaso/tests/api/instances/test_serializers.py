from django.test import TestCase
from rest_framework.exceptions import ValidationError

from iaso.api.instances.serializers import FileTypeSerializer, InstanceLocationSerializer


class FileTypeSerializerTestCase(TestCase):
    def test_no_value_passed(self):
        query_params = {}
        serializer = FileTypeSerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["image_only"], False)
        self.assertEqual(serializer.validated_data["video_only"], False)
        self.assertEqual(serializer.validated_data["document_only"], False)
        self.assertEqual(serializer.validated_data["other_only"], False)

    def test_blank_value_passed(self):
        query_params = {"image_only": "", "video_only": "", "document_only": "", "other_only": ""}
        serializer = FileTypeSerializer(data=query_params)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(str(serializer.errors["image_only"][0]), "Must be a valid boolean.")
        self.assertEqual(str(serializer.errors["video_only"][0]), "Must be a valid boolean.")
        self.assertEqual(str(serializer.errors["document_only"][0]), "Must be a valid boolean.")
        self.assertEqual(str(serializer.errors["other_only"][0]), "Must be a valid boolean.")

    def test_invalid_bool(self):
        query_params = {"image_only": "invalid_boolean_value"}
        serializer = FileTypeSerializer(data=query_params)
        with self.assertRaises(ValidationError) as error:
            serializer.is_valid(raise_exception=True)
        self.assertEqual(error.exception.detail["image_only"][0], "Must be a valid boolean.")

    def test_true_passed(self):
        query_params = {"image_only": "true", "video_only": 1, "document_only": True, "other_only": "1"}
        serializer = FileTypeSerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["image_only"], True)
        self.assertEqual(serializer.validated_data["video_only"], True)
        self.assertEqual(serializer.validated_data["document_only"], True)
        self.assertEqual(serializer.validated_data["other_only"], True)

    def test_false_passed(self):
        query_params = {"image_only": "false", "video_only": 0, "document_only": False, "other_only": "0"}
        serializer = FileTypeSerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["image_only"], False)
        self.assertEqual(serializer.validated_data["video_only"], False)
        self.assertEqual(serializer.validated_data["document_only"], False)
        self.assertEqual(serializer.validated_data["other_only"], False)


class InstanceLocationSerializerTestCase(TestCase):
    def test_location_none(self):
        class MockInstance:
            id = 1
            location = None

        serializer = InstanceLocationSerializer(MockInstance())
        data = dict(serializer.data)
        self.assertIsNone(data["latitude"])
        self.assertIsNone(data["longitude"])

    def test_location_returns_lat_lng(self):
        class MockPoint:
            x = 2.5
            y = 48.8

        class MockInstance:
            id = 2
            location = MockPoint()

        serializer = InstanceLocationSerializer(MockInstance())
        data = dict(serializer.data)
        self.assertEqual(data["latitude"], 48.8)
        self.assertEqual(data["longitude"], 2.5)
