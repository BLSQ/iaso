import json
from unittest.mock import patch

from django.test import SimpleTestCase
from django.utils.dateparse import parse_datetime

from iaso.odk import validate_xls_form


class ValidatorTestCase(SimpleTestCase):
    def test_parse_xls_form_valid(self):
        with open("iaso/tests/fixtures/odk_instance_repeat_group_form.xlsx", "rb") as xls_file:
            errors = validate_xls_form(xls_file)
            # print(json.dumps(errors, indent=4))
            self.assertEqual(errors, [])

    def test_parse_xls_form_invalid(self):
        with open("iaso/tests/fixtures/odk_invalid_xlsform_expected_errors.json", "r") as expected_errors_file:
            expected_errors = json.loads(expected_errors_file.read())
        with open("iaso/tests/fixtures/odk_invalid_xlsform.xlsx", "rb") as xls_file:
            errors = validate_xls_form(xls_file)
            # print(json.dumps(errors, indent=4))
            self.assertEqual(errors, expected_errors)