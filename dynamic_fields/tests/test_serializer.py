from django.test import TestCase, override_settings
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from dynamic_fields.serializer import DynamicFieldsModelSerializerMixin


class TestSerializer(DynamicFieldsModelSerializerMixin, serializers.Serializer):
    name = serializers.CharField()
    age = serializers.IntegerField()
    email = serializers.EmailField()

    class Meta:
        fields = ["name", "age", "email"]
        default_fields = ["name", "age"]


@override_settings(
    DYNAMIC_FIELDS_QUERY_PARAM_NAME="fields",
    DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE=":default",
    DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE=":all",
    DYNAMIC_FIELDS_DEFAULT_FIELDS_META_PARAM="default_fields",
    DYNAMIC_FIELDS_ALL_FIELDS_META_PARAM="fields",
)
class DynamicFieldsSerializerTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.factory = APIRequestFactory()

    def get_instance(self):
        return {"name": "John", "age": 30, "email": "john@example.com"}

    def test_default_fields_applied(self):
        serializer = TestSerializer()

        data = serializer.to_representation(self.get_instance())
        self.assertSetEqual(set(data.keys()), {"name", "age"})

    def test_all_fields(self):
        serializer = TestSerializer(fields=[":all"])

        data = serializer.to_representation(self.get_instance())
        self.assertSetEqual(set(data.keys()), {"name", "age", "email"})

    def test_specific_fields(self):
        serializer = TestSerializer(fields=["email"])

        data = serializer.to_representation(self.get_instance())
        self.assertSetEqual(set(data.keys()), {"email"})

    def test_default_keyword(self):
        serializer = TestSerializer(fields=[":default"])

        data = serializer.to_representation(self.get_instance())
        self.assertSetEqual(set(data.keys()), {"name", "age"})

    def test_request_overrides_serializer_fields(self):
        request = Request(self.factory.get("/?fields=email"))

        serializer = TestSerializer(
            self.get_instance(),
            context={"request": request},
            fields=["name", "age"],  # should be ignored
        )

        data = serializer.to_representation(self.get_instance())

        self.assertSetEqual(set(data.keys()), {"email"})

    def test_request_all_fields(self):
        request = Request(self.factory.get("/?fields=:all"))

        serializer = TestSerializer(self.get_instance(), context={"request": request})

        data = serializer.to_representation(self.get_instance())

        self.assertSetEqual(set(data.keys()), {"name", "age", "email"})

    def test_default_overrides_specific_fields(self):
        request = Request(self.factory.get("/?fields=:default&fields=email"))

        serializer = TestSerializer(self.get_instance(), context={"request": request}, fields=["email"])

        data = serializer.to_representation(self.get_instance())

        self.assertSetEqual(set(data.keys()), {"name", "age"})

    def test_all_overrides_specific_fields(self):
        request = Request(self.factory.get("/?fields=:all&fields=email"))

        serializer = TestSerializer(self.get_instance(), context={"request": request}, fields=["email"])

        data = serializer.to_representation(self.get_instance())

        self.assertSetEqual(set(data.keys()), {"name", "age", "email"})


@override_settings(
    DYNAMIC_FIELDS_QUERY_PARAM_NAME="fields",
    DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE=":default",
    DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE=":all",
    DYNAMIC_FIELDS_DEFAULT_FIELDS_META_PARAM="default_fields",
    DYNAMIC_FIELDS_ALL_FIELDS_META_PARAM="fields",
)
class DynamicFieldsSerializerBackwardCompatibleTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.factory = APIRequestFactory()

    def get_instance(self):
        return {"name": "John", "age": 30, "email": "john@example.com"}

    def test_default_fields_applied(self):
        serializer = TestSerializer(string_field=True)

        data = serializer.to_representation(self.get_instance())
        self.assertSetEqual(set(data.keys()), {"name", "age"})

    def test_all_fields(self):
        serializer = TestSerializer(fields=":all", string_field=True)

        data = serializer.to_representation(self.get_instance())
        self.assertSetEqual(set(data.keys()), {"name", "age", "email"})

    def test_specific_fields(self):
        serializer = TestSerializer(fields="email", string_field=True)

        data = serializer.to_representation(self.get_instance())
        self.assertSetEqual(set(data.keys()), {"email"})

    def test_default_keyword(self):
        serializer = TestSerializer(fields=":default", string_field=True)

        data = serializer.to_representation(self.get_instance())
        self.assertSetEqual(set(data.keys()), {"name", "age"})

    def test_request_overrides_serializer_fields(self):
        request = Request(self.factory.get("/?fields=email"))

        serializer = TestSerializer(
            self.get_instance(),
            string_field=True,
            context={"request": request},
            fields=["name", "age"],  # should be ignored
        )

        data = serializer.to_representation(self.get_instance())

        self.assertSetEqual(set(data.keys()), {"email"})

    def test_request_all_fields(self):
        request = Request(self.factory.get("/?fields=:all"))

        serializer = TestSerializer(self.get_instance(), context={"request": request}, string_field=True)

        data = serializer.to_representation(self.get_instance())

        self.assertSetEqual(set(data.keys()), {"name", "age", "email"})

    def test_default_overrides_specific_fields(self):
        request = Request(self.factory.get("/?fields=:default,email"))

        serializer = TestSerializer(
            self.get_instance(), context={"request": request}, fields="email", string_field=True
        )

        data = serializer.to_representation(self.get_instance())

        self.assertSetEqual(set(data.keys()), {"name", "age"})

    def test_all_overrides_specific_fields(self):
        request = Request(self.factory.get("/?fields=:all,email"))

        serializer = TestSerializer(
            self.get_instance(), context={"request": request}, fields="email", string_field=True
        )

        data = serializer.to_representation(self.get_instance())

        self.assertSetEqual(set(data.keys()), {"name", "age", "email"})
