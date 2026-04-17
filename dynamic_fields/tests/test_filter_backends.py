from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from dynamic_fields.filter_backends import DynamicFieldsFilterBackend
from dynamic_fields.serializer import DynamicFieldsModelSerializerMixin


class DummySerializer:
    @classmethod
    def get_valid_options(cls):
        return [":all", ":default", "name", "age"]


class DummyView:
    serializer_class = DummySerializer


@override_settings(
    DYNAMIC_FIELDS_QUERY_PARAM_NAME="fields",
    DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE=":default",
    DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE=":all",
    DYNAMIC_FIELDS_DEFAULT_FIELDS_META_PARAM="default_fields",
    DYNAMIC_FIELDS_ALL_FIELDS_META_PARAM="fields",
)
class DynamicFieldsFilterBackendTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.factory = APIRequestFactory()
        cls.queryset = get_user_model().objects.all()

    def setUp(self):
        self.backend = DynamicFieldsFilterBackend()

    def test_no_query_params_returns_queryset(self):
        request = Request(self.factory.get("/"))

        result = self.backend.filter_queryset(request, self.queryset, DummyView())
        self.assertEqual(result, self.queryset)

    def test_valid_fields_pass(self):
        request = Request(self.factory.get("/?fields=name&fields=age"))

        result = self.backend.filter_queryset(request, self.queryset, DummyView())
        self.assertEqual(result, self.queryset)

    def test_invalid_fields_raises(self):
        request = Request(self.factory.get("/?fields=invalid"))

        with self.assertRaises(ValidationError):
            self.backend.filter_queryset(request, self.queryset, DummyView())

    def test_conflicting_params_raises(self):
        request = Request(self.factory.get("/?fields=:all&fields=:default"))

        with self.assertRaises(ValidationError):
            self.backend.filter_queryset(request, self.queryset, DummyView())

    def test_get_schema_operation_parameters(self):
        class TestSerializer(DynamicFieldsModelSerializerMixin, serializers.Serializer):
            name = serializers.CharField()
            age = serializers.IntegerField()
            email = serializers.EmailField()

            class Meta:
                fields = ["name", "age", "email"]
                default_fields = ["name", "age"]

        class View:
            def get_serializer_class(self):
                return TestSerializer

        backend = DynamicFieldsFilterBackend()
        params = backend.get_schema_operation_parameters(View())

        self.assertEqual(len(params), 1)
        self.assertEqual(
            params[0],
            {
                "name": "fields",
                "in": "query",
                "required": False,
                "description": ("Dynamic serializer fields. Use ':all' or ':default' or specific field names."),
                "schema": {
                    "type": "array",
                    "items": {"type": "string", "enum": [":all", ":default", "name", "age", "email"]},
                },
                "style": "form",
                "explode": True,
            },
        )
