import re

from django.core.validators import RegexValidator
from django.db import models


HEX_COLOR_REGEX = re.compile(r"#[0-9A-Fa-f]{6}$")


class ColorField(models.CharField):
    description = "A color field that accepts hex color codes (e.g., #RRGGBB)."
    default_validators = [
        RegexValidator(
            regex=HEX_COLOR_REGEX,
            message="%(value)s is not a valid hex color code. It should be in the format #RRGGBB.",
        ),
    ]

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("max_length", 7)  # Length for hex color code (#RRGGBB)
        super().__init__(*args, **kwargs)

    def to_python(self, value):
        value = super().to_python(value)
        if value:
            return value.upper()  # Normalize to uppercase
        return value
