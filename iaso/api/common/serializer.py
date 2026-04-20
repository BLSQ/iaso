from django.conf import settings
from django.contrib.auth.models import User
from django.utils.module_loading import import_string
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source="get_full_name")

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "username", "full_name"]


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """A ModelSerializer that
    - inspects the request to check if a specific field set has been requested through the "fields" query param
    - accepts an additional optional `fields` constructor argument that allows to specify which
      fields should be included if the request does not contain the "fields" query param

    Note that the request query param will always take precedence over the constructor argument.

    This field query param or constructor argument can be either a comma-separated list of field names,
    or the :all or :default keywords.

    When implementing this serializer class, you can define a "default_fields" attribute on your inner Meta
    class. This represents the default set of fields that will be returned. If you don't define this attribute,
    the standard "fields" attribute will be used instead.

    As an example, consider a viewset using the following serializer:

    class DinosaurSerializer(DynamicFieldsModelSerializer)
        class Meta:
            model = OrgUnitType
            fields = ["id", "name", "related_species"]
            default_fields = ["id", "name"]

    1. If the request does not contain the "field" query param, "id" and "name" will e returned.
    2. If the request has a "field" query param equals to "id", only the id will be returned
    3. If the request has a "field" query param equals to "id,name,related_species", all the fields will be returned
    4. If this serializer is manually instantiated in a piece of code with the ":all" keyword, and the request
       does not contain a "field" query param, then all fields will be returned as well.
    """

    def __init__(self, *args, **kwargs):
        # Avoid a `KeyError: 'context'` error for nested serializers.
        request = kwargs.get("context", {}).get("request")
        if not request:
            return super().__init__(*args, **kwargs)

        # Don't pass the 'fields' arg up to the superclass
        requested_fields = request.query_params.get("fields", kwargs.pop("fields", ":default"))

        # we tell drf-spectacular to use :all by default
        if getattr(kwargs.get("context", {}).get("view"), "swagger_fake_view", False):
            requested_fields = ":all"

        if requested_fields == ":all":
            fields = self.Meta.fields
        elif requested_fields == ":default":
            fields = self.Meta.default_fields if hasattr(self.Meta, "default_fields") else self.Meta.fields
        else:
            # fields could be a string (query param) or a list (constructor argument)
            fields = requested_fields.split(",") if isinstance(requested_fields, str) else requested_fields
            for field in fields:
                if field not in self.Meta.fields:
                    raise serializers.ValidationError(
                        {"fields": "field unknown '" + field + "', known fields :" + ", ".join(self.Meta.fields)}
                    )

        # Instantiate the superclass normally
        super().__init__(*args, **kwargs)

        # Drop any fields that are not specified in the `fields` argument.
        allowed = set(fields)
        existing = set(self.fields)
        for field_name in existing - allowed:
            self.fields.pop(field_name)


class ModelSerializerFieldMappingMixin:
    @property
    def serializer_field_mapping(self):
        mapping = getattr(settings, "REST_FRAMEWORK_SERIALIZER_FIELDS_MAPPINGS", {})
        resolved_mapping = {}

        for model_field_class, serializer_field in mapping.items():
            # Dynamically import from string path to avoid circular import in settings
            if isinstance(serializer_field, str):
                serializer_field = import_string(serializer_field)
            if isinstance(model_field_class, str):
                model_field_class = import_string(model_field_class)
            resolved_mapping[model_field_class] = serializer_field

        return {**serializers.ModelSerializer.serializer_field_mapping, **resolved_mapping}


class ModelSerializer(ModelSerializerFieldMappingMixin, serializers.ModelSerializer):
    pass


class DropdownOptionsSerializer(serializers.Serializer):
    value = serializers.CharField()
    label = serializers.CharField()


class DropdownOptionsWithRepresentationSerializer(DropdownOptionsSerializer):
    def to_representation(self, instance):
        return {"value": instance[0], "label": str(instance[1])}
