import json
from unittest.mock import patch

from django.test import SimpleTestCase
from django.utils.dateparse import parse_datetime

from iaso.odk import parse_xls_form, Survey, ParsingError, to_questions_by_name


class ParsingTestCase(SimpleTestCase):
    def test_parse_xls_form_valid(self):
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xls", "rb") as xls_file:
            survey = parse_xls_form(xls_file)

        self.assertIsInstance(survey, Survey)
        self.assertEqual(survey.generate_file_name("xml"), "odk_form_valid_sample1_2020022401.xml")
        xml_content = survey.to_xml()
        self.assertIsInstance(xml_content, bytes)
        self.assertGreater(len(xml_content), 100)
        # check correctness of root data key
        self.assertIn(f'<data id="sample1" version="2020022401">', xml_content.decode("utf-8"))
        self.assertEqual(survey.form_id, "sample1")
        self.assertEqual(survey.version, "2020022401")

    def test_parse_xls_form_valid_no_settings(self):
        with open("iaso/tests/fixtures/odk_form_valid_no_settings.xls", "rb") as xls_file:
            survey = parse_xls_form(xls_file)

        self.assertIsInstance(survey, Survey)
        xml_content = survey.to_xml()
        self.assertIsInstance(xml_content, bytes)
        self.assertGreater(len(xml_content), 100)
        self.assertEqual(survey.form_id, "odk_form_valid_no_settings")
        self.assertIsInstance(survey.version, str)

    def test_parse_xls_form_invalid_version(self):
        with open("iaso/tests/fixtures/odk_form_invalid_version.xls", "rb") as xls_file:
            with self.assertRaises(ParsingError) as cm:
                parse_xls_form(xls_file)
            self.assertEqual(str(cm.exception), "Invalid XLS file: Invalid version (must be a string of 1-10 numbers).")

    def test_parse_xls_form_invalid_version_inferior_to_previous(self):
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xls", "rb") as xls_file:
            with self.assertRaises(ParsingError) as cm:
                parse_xls_form(xls_file, previous_version="2020022501")
            self.assertEqual(
                str(cm.exception), "Invalid XLS file: Parsed version should be greater than previous version."
            )

    def test_parse_xls_form_invalid_version_same_as_previous(self):
        with open("iaso/tests/fixtures/odk_form_valid_sample1_2020022401.xls", "rb") as xls_file:
            with self.assertRaises(ParsingError) as cm:
                parse_xls_form(xls_file, previous_version="2020022401")
            self.assertEqual(
                str(cm.exception), "Invalid XLS file: Parsed version should be greater than previous version."
            )

    def test_parse_xls_form_blatantly_invalid(self):
        with open("iaso/tests/fixtures/odk_form_blatantly_invalid.xls", "rb") as xls_file:
            with self.assertRaises(ParsingError) as cm:
                parse_xls_form(xls_file)
            self.assertEqual(
                str(cm.exception),
                "Invalid XLS file: The survey sheet is either empty or missing important column headers.",
            )

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_first_version(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_valid_sample1_no_version.xls", "rb") as xls_file:
            survey = parse_xls_form(xls_file)

        self.assertEqual(survey.version, "2020022401")

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_second_version_of_the_day(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_valid_sample1_no_version.xls", "rb") as xls_file:
            survey = parse_xls_form(xls_file, previous_version="2020022401")

        self.assertEqual(survey.version, "2020022402")

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_second_version_different_day(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_valid_sample1_no_version.xls", "rb") as xls_file:
            survey = parse_xls_form(xls_file, previous_version="2020022301")

        self.assertEqual(survey.version, "2020022401")

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_previous_version_old_format(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_valid_sample1_no_version.xls", "rb") as xls_file:
            survey = parse_xls_form(xls_file, previous_version="1")

        self.assertEqual(survey.version, "2020022401")

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_100th_version_of_the_day(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_valid_sample1_no_version.xls", "rb") as xls_file:
            with self.assertRaises(ParsingError) as cm:
                parse_xls_form(xls_file, previous_version="2020022499")
            self.assertEqual(str(cm.exception), "Invalid XLS file: Too many versions.")

    def fixture_json(self, name):
        with open("./iaso/tests/fixtures/" + name + ".json") as json_file:
            return json.load(json_file)

    def test_to_questions_by_name(self):

        descriptor = self.fixture_json("odk_json_descriptor")

        questions_by_name = to_questions_by_name(descriptor)
        keys = list(questions_by_name.keys())
        self.assertEqual(
            keys,
            [
                "start",
                "end",
                "today",
                "deviceid",
                "subscriberid",
                "imei",
                "simserial",
                "phonenumber",
                "PBF_PCA_qlt_3_1_1",
                "PBF_PCA_qlt_3_1",
                "PBF_PCA_qlt_3_2_1",
                "PBF_PCA_qlt_3_2",
                "PBF_PCA_qlt_3_3_1",
                "PBF_PCA_qlt_3_3",
                "PBF_PCA_qlt_3_4_1",
                "PBF_PCA_qlt_3_4",
                "PBF_PCA_qlt_3_5_1",
                "PBF_PCA_qlt_3_5",
                "PBF_PCA_qlt_point_v3",
                "PBF_PCA_qlt_max_point_v3",
                "PBF_PCA_qlt_point_vol_3",
                "PBF_PCA_qlte_nom_enqueteur",
                "PBF_PCA_qlte_qualif_enqueteur",
                "PBF_PCA_qlte_struct_enqueteur",
                "PBF_PCA_qlte_signature_respo_fosa",
                "PBF_PCA_qlte_tel_enqueteur",
                "PBF_PCA_qlte_problem_ident",
                "PBF_PCA_qlte_action_urgent",
                "PBF_PCA_qlte_nom_evalu",
                "PBF_PCA_qlte_qualification_eval",
                "PBF_PCA_qlte_struct_eval",
                "PBF_PCA_qlte_signature_eval",
                "PBF_PCA_qlte_nom_respo_fosa",
                "instanceID",
            ],
        )

        self.assertEqual(
            questions_by_name["PBF_PCA_qlt_3_1"],
            {"name": "PBF_PCA_qlt_3_1", "type": "calculate", "bind": {"calculate": r"if(${PBF_PCA_qlt_3_1_1}=1,2,0)"}},
        )

    def test_to_questions_by_name_with_empty_dict(self):

        self.assertEqual(to_questions_by_name({}), {})

        self.assertEqual(to_questions_by_name(None), {})

    def test_to_questions_by_name_with_node_without_children(self):
        flattened = to_questions_by_name(
            {"name": "parent", "type": "survey", "children": [{"name": "group_without_children", "type": "group"}]}
        )
        self.assertEqual({}, flattened)
