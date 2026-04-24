from django.conf import settings
from rest_framework import serializers


class DynamicFieldsModelSerializerMixin(serializers.Serializer):
    def __init__(self, *args, **kwargs):
        # todo: should be settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME directly , but polio serializers crash if not so
        # todo: is it also really needed, it's only used in some places like OrgUnitType
        self.dynamic_fields = kwargs.pop(getattr(settings, "DYNAMIC_FIELDS_QUERY_PARAM_NAME", "fields"), None)
        self.string_field = kwargs.pop("string_field", False)
        super().__init__(*args, **kwargs)
        self._applied_dynamic_fields = False

    @classmethod
    def get_dynamic_fields_options(cls):
        meta_all_fields = getattr(cls.Meta, settings.DYNAMIC_FIELDS_ALL_FIELDS_META_PARAM, [])
        if hasattr(cls.Meta, settings.DYNAMIC_FIELDS_DEFAULT_FIELDS_META_PARAM):
            meta_default_fields = getattr(cls.Meta, settings.DYNAMIC_FIELDS_DEFAULT_FIELDS_META_PARAM, [])
        else:
            meta_default_fields = meta_all_fields
        return {"meta_default": meta_default_fields, "meta_all_fields": meta_all_fields}

    @classmethod
    def get_valid_options(cls):
        return [
            settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE,
            settings.DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE,
        ] + cls.get_dynamic_fields_options().get("meta_all_fields", [])

    def apply_dynamic_fields(self, fields):
        params_fields = self.get_fields_value_from_query() or self.dynamic_fields

        if params_fields and settings.DYNAMIC_FIELDS_ALL_FIELDS_PARAM_VALUE in params_fields:
            return fields

        if not params_fields or settings.DYNAMIC_FIELDS_DEFAULT_FIELDS_PARAM_VALUE in params_fields:
            filtered_fields = self.get_dynamic_fields_options()["meta_default"]
        else:
            filtered_fields = params_fields

        fields = {k: v for k, v in fields.items() if k in filtered_fields}
        return fields

    def to_representation(self, instance):
        if not self._applied_dynamic_fields:
            self.fields = self.apply_dynamic_fields(self.fields)
            self._applied_dynamic_fields = True
        return super().to_representation(instance)

    def get_fields_value_from_query(self):
        if self.context.get("request", None):
            if self.string_field:
                return [
                    v
                    for v in self.context.get("request")
                    .query_params.get(settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME, "")
                    .split(",")
                    if v
                ]
            return [
                v
                for v in self.context.get("request").query_params.getlist(settings.DYNAMIC_FIELDS_QUERY_PARAM_NAME)
                if v
            ]
        return []


class DynamicFieldsModelSerializer(DynamicFieldsModelSerializerMixin, serializers.ModelSerializer):
    pass


class DynamicFieldsModelSerializerBackwardCompatible(DynamicFieldsModelSerializerMixin, serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("string_field", True)
        super().__init__(*args, **kwargs)
