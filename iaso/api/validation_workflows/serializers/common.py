from rest_framework import serializers


class UserDisplayNameField(serializers.CharField):
    def __init__(self, **kwargs):
        kwargs["read_only"] = True
        kwargs["allow_blank"] = True
        super().__init__(**kwargs)

    def to_representation(self, value):
        if value is None:
            return None
        full_name = value.get_full_name()
        if full_name:
            return full_name
        return getattr(value, "username", "")
