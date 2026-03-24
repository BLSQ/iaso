from django.db import models
from django.test import TestCase, override_settings
from django.utils.module_loading import import_string
from rest_framework import serializers

from iaso.api.common import ModelSerializer as BaseModelSerializer


class DummyModel(models.Model):
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7)


class DummySerializer(serializers.Serializer):
    pass


class ModelSerializerMappingTest(TestCase):
    @override_settings(REST_FRAMEWORK_SERIALIZER_FIELDS_MAPPINGS={DummyModel: DummySerializer})
    def test_class_reference_mapping(self):
        serializer = BaseModelSerializer()
        mapping = serializer.serializer_field_mapping

        self.assertIn(DummyModel, mapping)
        self.assertEqual(mapping[DummyModel], DummySerializer)

        self.assertIn(serializers.CharField, mapping.values() or [])

    @override_settings(
        REST_FRAMEWORK_SERIALIZER_FIELDS_MAPPINGS={"django.db.models.CharField": "rest_framework.serializers.CharField"}
    )
    def test_string_path_mapping(self):
        serializer = BaseModelSerializer()
        mapping = serializer.serializer_field_mapping

        expected_model_field = import_string("django.db.models.CharField")
        expected_serializer_field = import_string("rest_framework.serializers.CharField")

        self.assertIn(expected_model_field, mapping)
        self.assertEqual(mapping[expected_model_field], expected_serializer_field)

    def test_merged_with_default_mapping(self):
        serializer = BaseModelSerializer()
        mapping = serializer.serializer_field_mapping

        # DRF default CharField mapping exists
        self.assertIn(models.CharField, mapping)
        self.assertTrue(issubclass(mapping[models.CharField], serializers.Field))
