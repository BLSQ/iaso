import json

from django.test import SimpleTestCase

from iaso.odk.validator import get_list_name_from_select, validate_xls_form


class ValidatorTestCase(SimpleTestCase):
    def test_parse_xls_form_valid(self):
        with open("iaso/tests/fixtures/odk_instance_repeat_group_form.xlsx", "rb") as xls_file:
            errors = validate_xls_form(xls_file)
            # print(json.dumps(errors, indent=4))
            self.assertEqual(errors, [])

    def test_parse_xls_form_invalid(self):
        with open("iaso/tests/fixtures/odk_invalid_xlsform_expected_errors.json") as expected_errors_file:
            expected_errors = json.loads(expected_errors_file.read())
        with open("iaso/tests/fixtures/odk_invalid_xlsform.xlsx", "rb") as xls_file:
            errors = validate_xls_form(xls_file)
            # print(json.dumps(errors, indent=4))
            self.assertEqual(errors, expected_errors)

    def test_get_list_name_from_select_options(self):
        self.assertEqual(get_list_name_from_select({"type": "select_one demo_choices or_other"}), "demo_choices")

        self.assertEqual(get_list_name_from_select({"type": "select_one demo_choices "}), "demo_choices")

        self.assertEqual(get_list_name_from_select({"type": "select_one  demo_choices "}), "demo_choices")

        self.assertEqual(get_list_name_from_select({"type": "select one  demo_choices "}), "demo_choices")

        self.assertEqual(get_list_name_from_select({"type": "select one demo_choices"}), "demo_choices")

        self.assertEqual(get_list_name_from_select({"type": "select one demo_choices or_other "}), "demo_choices")
