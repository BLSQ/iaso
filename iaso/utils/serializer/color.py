from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from iaso.utils.models.color import HEX_COLOR_REGEX


class ColorFieldSerializer(serializers.CharField):
    default_error_messages = {"invalid_format": _("Color must be a valid hex code (#RRGGBB).")}

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_length", 7)
        kwargs.setdefault("upper", True)
        super().__init__(*args, **kwargs)
        validator = RegexValidator(regex=HEX_COLOR_REGEX, message=self.error_messages["invalid_format"])
        self.validators.append(validator)

    def to_internal_value(self, data):
        value = super().to_internal_value(data)
        return value.upper() if value else value

    def to_representation(self, value):
        return value.upper() if value else value
