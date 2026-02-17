import re

from django.core.exceptions import ValidationError
from django.db import models


HEX_COLOR_REGEX = re.compile(r"#[0-9A-Fa-f]{6}$")


def validate_hex_color(value):
    if not HEX_COLOR_REGEX.match(value):
        raise ValidationError(f"{value} is not a valid hex color code. It should be in the format #RRGGBB.")


class ColorField(models.CharField):
    description = "A color field that accepts hex color codes (e.g., #RRGGBB)."

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_length", 7)  # Length for hex color code (#RRGGBB)
        validators = kwargs.get("validators", [])
        if not validators or validate_hex_color not in validators:
            validators.append(validate_hex_color)
        kwargs["validators"] = validators
        super().__init__(*args, **kwargs)

    def to_python(self, value):
        value = super().to_python(value)
        if value:
            return value.upper()  # Normalize to uppercase
        return value
