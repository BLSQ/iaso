from rest_framework import serializers


class RoundedDecimalField(serializers.DecimalField):
    """
    Some devices send accuracy with more than 2 decimals (IA-4159).

    This field will round the value to the number specified in `decimal_places`.
    """

    def validate_precision(self, value):
        """
        Override of `validate_precision` to remove the `decimal_places` validation.
        https://github.com/encode/django-rest-framework/blob/54399671/rest_framework/fields.py#L1049-L1082

        The quantize method is called afterward and will do the rounding.
        https://github.com/encode/django-rest-framework/blob/54399671/rest_framework/fields.py#L1047
        """
        sign, digittuple, exponent = value.as_tuple()

        if exponent >= 0:
            # 1234500.0
            total_digits = len(digittuple) + exponent
            whole_digits = total_digits
        elif len(digittuple) > abs(exponent):
            # 123.45
            total_digits = len(digittuple)
            whole_digits = total_digits - abs(exponent)
        else:
            # 0.001234
            total_digits = abs(exponent)
            whole_digits = 0

        if self.max_whole_digits is not None and whole_digits > self.max_whole_digits:
            self.fail("max_whole_digits", max_whole_digits=self.max_whole_digits)

        if self.max_digits is not None and total_digits > self.max_digits:
            self.fail("max_digits", max_digits=self.max_digits)

        return value
