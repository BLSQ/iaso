import json
import os
import tempfile

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

    def test_hidden_question_type_validation(self):
        # Create a simple Excel file with a hidden question type
        import pandas as pd

        # Create a simple Excel file with a hidden question type
        survey_data = {
            "type": ["text", "hidden", "text"],
            "name": ["question1", "hidden_question", "question2"],
            "label": ["Question 1", "Hidden Question", "Question 2"],
            "hint": ["", "", ""],
            "appearance": ["", "", ""],
            "image": ["", "", ""],
            "audio": ["", "", ""],
            "video": ["", "", ""],
            "relevant": ["", "", ""],
            "calculation": ["", "", ""],
            "constraint": ["", "", ""],
            "constraint_message": ["", "", ""],
        }

        choices_data = {"list_name": [], "name": [], "label": []}

        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as temp_file:
            with pd.ExcelWriter(temp_file.name, engine="openpyxl") as writer:
                pd.DataFrame(survey_data).to_excel(writer, sheet_name="survey", index=False)
                pd.DataFrame(choices_data).to_excel(writer, sheet_name="choices", index=False)

            # Open the file and validate it
            with open(temp_file.name, "rb") as xls_file:
                errors = validate_xls_form(xls_file)

        # Clean up the temporary file
        os.unlink(temp_file.name)

        # Check that we have the expected error for hidden question type
        hidden_errors = [e for e in errors if "question type hidden is not supported" in e["message"]]
        self.assertEqual(len(hidden_errors), 1)

        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            pd.DataFrame(survey_data).to_excel(writer, sheet_name="survey", index=False)
            pd.DataFrame(choices_data).to_excel(writer, sheet_name="choices", index=False)

        output.seek(0)

        # Validate the form
        errors = validate_xls_form(output)

        # Check that we have the expected error for hidden question type
        hidden_errors = [e for e in errors if "question type hidden is not supported" in e["message"]]
        self.assertEqual(len(hidden_errors), 1)
        self.assertEqual(hidden_errors[0]["question"]["name"], "hidden_question")
