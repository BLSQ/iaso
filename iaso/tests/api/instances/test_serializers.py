from django.test import TestCase
from rest_framework.exceptions import ValidationError

from iaso.api.instances.serializers import ImageOnlySerializer
from iaso.api.query_params import IMAGE_ONLY


class ImageOnlySerializerTestCase(TestCase):
    def test_no_value_passed(self):
        query_params = {}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], False)

    def test_blank_value_passed(self):
        query_params = {IMAGE_ONLY: ""}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(str(serializer.errors[IMAGE_ONLY][0]), "Must be a valid boolean.")

    def test_invalid_bool(self):
        query_params = {IMAGE_ONLY: "invalid_boolean_value"}
        serializer = ImageOnlySerializer(data=query_params)
        with self.assertRaises(ValidationError) as error:
            serializer.is_valid(raise_exception=True)
        self.assertEqual(error.exception.detail["image_only"][0], "Must be a valid boolean.")

    def test_string_true_passed(self):
        query_params = {IMAGE_ONLY: "true"}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], True)

    def test_int_1_passed(self):
        query_params = {IMAGE_ONLY: 1}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], True)

    def test_string_1_passed(self):
        query_params = {IMAGE_ONLY: "1"}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], True)

    def test_true_passed(self):
        query_params = {IMAGE_ONLY: True}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], True)

    def test_string_false_passed(self):
        query_params = {IMAGE_ONLY: "false"}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], False)

    def test_int_0_passed(self):
        query_params = {IMAGE_ONLY: 0}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], False)

    def test_string_0_passed(self):
        query_params = {IMAGE_ONLY: "0"}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], False)

    def test_false_passed(self):
        query_params = {IMAGE_ONLY: False}
        serializer = ImageOnlySerializer(data=query_params)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data[IMAGE_ONLY], False)
