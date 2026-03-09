from rest_framework import serializers

from iaso.test import APITestCase
from iaso.utils.serializer.color import ColorFieldSerializer


class TestColorFieldSerializer(APITestCase):
    class TestSerializer(serializers.Serializer):
        color = ColorFieldSerializer()

    def test_valid_colors(self):
        valid_colors = ["#FF00AA", "#00ff00", "#123456", "#abcdef"]
        for color in valid_colors:
            serializer = self.TestSerializer(data={"color": color})
            self.assertTrue(serializer.is_valid())

    def test_invalid_colors(self):
        invalid_colors = ["FF00AA", "#FF00A", "#GGHHII", "#12345G", "123456", "#1234567", ""]
        for color in invalid_colors:
            with self.subTest(f"Testing invalid color {color}"):
                serializer = self.TestSerializer(data={"color": color})
                self.assertFalse(serializer.is_valid())
                self.assertIn("color", serializer.errors)
                self.assertIn("Color must be a valid hex code", serializer.errors["color"][0])

    def test_max_length_enforced(self):
        serializer = self.TestSerializer(data={"color": "#1234567"})
        self.assertFalse(serializer.is_valid())
        self.assertIn("color", serializer.errors)

    def test_empty_value(self):
        serializer = self.TestSerializer(data={"color": ""})
        self.assertFalse(serializer.is_valid())
        self.assertIn("color", serializer.errors)

    def test_uppercase_normalization(self):
        serializer = self.TestSerializer(data={"color": "#ff00aa"})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["color"], "#FF00AA")

        serializer = self.TestSerializer(data={"color": "#abcdef"})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["color"], "#ABCDEF")

        serializer = self.TestSerializer(data={"color": "#123456"})
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["color"], "#123456".upper())

    def test_representation_uppercase(self):
        instance = type("Obj", (), {"color": "#abcdef"})()
        serializer = self.TestSerializer(instance)
        self.assertEqual(serializer.data["color"], "#ABCDEF")

        instance = type("Obj", (), {"color": "#123456"})()
        serializer = self.TestSerializer(instance)
        self.assertEqual(serializer.data["color"], "#123456".upper())
