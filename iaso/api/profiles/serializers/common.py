# not sure this is the right place to put this

from django.utils.translation import gettext_lazy as _
from phonenumber_field.phonenumber import PhoneNumber
from phonenumbers import NumberParseException
from rest_framework import serializers


class CountryAwarePhoneNumberField(serializers.CharField):
    default_error_messages = {
        "invalid": _("Enter a valid phone number."),
        "both_required": _("Both phone number and country code must be provided"),
    }

    def __init__(self, country_code_field="country_code", **kwargs):
        self.country_code_field = country_code_field
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        value = super().to_internal_value(data)

        if isinstance(value, PhoneNumber):
            return value

        serializer = self.parent
        country_code = serializer.initial_data.get(self.country_code_field)

        if not country_code:
            self.fail("both_required")

        try:
            number = PhoneNumber.from_string(
                value,
                region=country_code.upper(),
            )
        except NumberParseException:
            self.fail("invalid")

        if not number.is_valid():
            self.fail("invalid")

        return number

    def to_representation(self, value):
        if not value:
            return None

        return value.as_e164
