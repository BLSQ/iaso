from rest_framework import serializers


class CurrentAccountDefault:
    requires_context = True

    def __call__(self, serializer_field):
        return serializer_field.context["request"].user.iaso_profile.account


class UserDisplayNameField(serializers.CharField):
    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        if value is None:
            return None
        full_name = value.get_full_name()
        if full_name:
            return full_name
        return getattr(value, "username", "")
