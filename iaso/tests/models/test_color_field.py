from django.core.exceptions import ValidationError
from django.db import models

from iaso.test import TestCase
from iaso.utils.models.color import ColorField


class ColorFieldTestModel(models.Model):
    color = ColorField()


VALIDATION_ERROR_MESSAGE = "is not a valid hex color code. It should be in the format #RRGGBB."


class ColorFieldTest(TestCase):
    def test_color_field_ok(self):
        # Test that the ColorField can be created and retrieved correctly
        color_value = "#FF5733"
        obj = ColorFieldTestModel(color=color_value)
        self.assertEqual(obj.color, color_value)

    def test_color_field_without_hashtag(self):
        # Test that a color value without the hashtag is rejected
        obj = ColorFieldTestModel(color="FF5733")
        with self.assertRaisesMessage(ValidationError, VALIDATION_ERROR_MESSAGE):
            obj.full_clean()

    def test_color_field_with_long_hex(self):
        # Test that a color value with more than 6 hex digits is rejected
        obj = ColorFieldTestModel(color="#FF5733AA")
        with self.assertRaisesMessage(ValidationError, VALIDATION_ERROR_MESSAGE):
            obj.full_clean()

    def test_color_field_with_short_hex(self):
        # Test that a color value with less than 6 hex digits is rejected
        obj = ColorFieldTestModel(color="#FF573")
        with self.assertRaisesMessage(ValidationError, VALIDATION_ERROR_MESSAGE):
            obj.full_clean()

    def test_color_field_with_invalid_characters(self):
        # Test that a color value with invalid characters is rejected
        obj = ColorFieldTestModel(color="#GG5733")
        with self.assertRaisesMessage(ValidationError, VALIDATION_ERROR_MESSAGE):
            obj.full_clean()

    def test_color_field_casing(self):
        # Test that the ColorField normalizes to uppercase
        obj = ColorFieldTestModel(color="#ff5733")
        obj.full_clean()
        self.assertEqual(obj.color, "#FF5733")

    def test_color_field_empty_value(self):
        obj = ColorFieldTestModel(color="")
        with self.assertRaisesMessage(ValidationError, "This field cannot be blank."):
            obj.full_clean()

    def test_color_field_null_value(self):
        obj = ColorFieldTestModel(color=None)
        with self.assertRaisesMessage(ValidationError, "This field cannot be null."):
            obj.full_clean()
