from django.test import TestCase

from rest_framework.exceptions import ValidationError
from django.contrib.gis.geos import GEOSGeometry

from iaso.utils.serializer.three_dim_point_field import ThreeDimPointField


class ThreeDimPointFieldTestCase(TestCase):
    def test_to_internal_value(self):
        field = ThreeDimPointField()
        data = {
            "latitude": 49.133333,
            "longitude": 6.166667,
            "altitude": 10.0,
        }
        value = field.to_internal_value(data)
        self.assertEqual(value, "SRID=4326;POINT Z (6.166667 49.133333 10)")

    def test_to_internal_value_empty(self):
        field = ThreeDimPointField(required=False)
        data = {}
        value = field.to_internal_value(data)
        self.assertIsNone(value)

    def test_to_internal_value_empty_but_required(self):
        field = ThreeDimPointField(required=True)
        data = {}
        with self.assertRaises(ValidationError) as error:
            field.to_internal_value(data)
        self.assertIn("Enter a valid location.", error.exception.detail)

    def test_to_internal_value_incomplete(self):
        field = ThreeDimPointField()
        data = {
            "latitude": 49.133333,
            "longitude": None,
            "altitude": 10.0,
        }
        with self.assertRaises(ValidationError) as error:
            field.to_internal_value(data)

    def test_to_representation(self):
        field = ThreeDimPointField()
        data = GEOSGeometry(f"POINT(6.166667 49.133333 10)", srid=4326)
        value = field.to_representation(data)
        self.assertEqual(value, {"latitude": 49.133333, "longitude": 6.166667, "altitude": 10.0})

    def test_to_representation_empty(self):
        field = ThreeDimPointField()
        value = field.to_representation(None)
        self.assertIsNone(value)
