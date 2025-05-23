import decimal

from django.test import TestCase
from rest_framework.exceptions import ValidationError

from iaso.utils.serializer.rounded_decimal_field import RoundedDecimalField


class RoundedDecimalFieldTestCase(TestCase):
    def test_to_internal_value(self):
        field = RoundedDecimalField(max_digits=6, decimal_places=4)
        self.assertEqual(field.to_internal_value("1.12345"), decimal.Decimal("1.1234"))

        field = RoundedDecimalField(max_digits=6, decimal_places=4)
        self.assertEqual(field.to_internal_value("1.12346"), decimal.Decimal("1.1235"))

        field = RoundedDecimalField(max_digits=4, decimal_places=2, rounding=decimal.ROUND_HALF_UP)
        self.assertEqual(field.to_internal_value("1.234"), decimal.Decimal("1.23"))

        field = RoundedDecimalField(max_digits=4, decimal_places=2, rounding=decimal.ROUND_HALF_UP)
        self.assertEqual(field.to_internal_value("1.235"), decimal.Decimal("1.24"))

        field = RoundedDecimalField(max_digits=2, decimal_places=1)
        with self.assertRaises(ValidationError) as error:
            field.to_internal_value("1.19")
        self.assertIn("Ensure that there are no more than 2 digits in total.", error.exception.detail)

        field = RoundedDecimalField(max_digits=4, decimal_places=2)
        with self.assertRaises(ValidationError) as error:
            field.to_internal_value("100.22")
        self.assertIn("Ensure that there are no more than 2 digits before the decimal point.", error.exception.detail)
