from iaso.odk import parse_xls_form, XMLForm
from django.test import SimpleTestCase
from django.utils.dateparse import parse_datetime
from unittest.mock import patch


class ParsingTestCase(SimpleTestCase):
    def test_parse_xls_form_valid(self):
        with open("iaso/tests/fixtures/odk_form.xls", "rb") as xls_file:
            xml_form = parse_xls_form(xls_file)

        self.assertIsInstance(xml_form, XMLForm)
        self.assertEqual(xml_form.file_name, 'odk_form.xml')
        self.assertIsInstance(xml_form.file_content, bytes)
        self.assertGreater(len(xml_form.file_content), 100)
        self.assertEqual(xml_form['form_id'], 'sample_form_id')
        self.assertEqual(xml_form['form_title'], 'Sample form title')
        self.assertEqual(xml_form['version'], '2017021501')

    def test_parse_xls_form_valid_no_settings(self):
        with open("iaso/tests/fixtures/odk_form_no_settings.xls", "rb") as xls_file:
            xml_form = parse_xls_form(xls_file)

        self.assertIsInstance(xml_form, XMLForm)
        self.assertIsInstance(xml_form.file_content, bytes)
        self.assertGreater(len(xml_form.file_content), 100)
        self.assertEqual(xml_form['form_id'], 'odk_form_no_settings')
        self.assertEqual(xml_form['form_title'], 'odk_form_no_settings')
        self.assertIsInstance(xml_form['version'], str)

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_first_version(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_no_version.xls", "rb") as xls_file:
            xml_form = parse_xls_form(xls_file)

        self.assertEqual(xml_form['version'], "2020022401")

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_second_version_of_the_day(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_no_version.xls", "rb") as xls_file:
            xml_form = parse_xls_form(xls_file, previous_version="2020022401")

        self.assertEqual(xml_form['version'], "2020022402")

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_second_version_different_day(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_no_version.xls", "rb") as xls_file:
            xml_form = parse_xls_form(xls_file, previous_version="2020022301")

        self.assertEqual(xml_form['version'], "2020022401")

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_previous_version_old_format(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_no_version.xls", "rb") as xls_file:
            xml_form = parse_xls_form(xls_file, previous_version="1")

        self.assertEqual(xml_form['version'], "2020022401")

    @patch("django.utils.timezone.now")
    def test_parse_xls_form_autogenerate_100th_version_of_the_day(self, now_mock):
        now_mock.return_value = parse_datetime("2020-02-24T10:00:00Z")

        with open("iaso/tests/fixtures/odk_form_no_version.xls", "rb") as xls_file:
            with self.assertRaises(ValueError) as cm:
                parse_xls_form(xls_file, previous_version="2020022499")
            self.assertEqual(str(cm.exception), 'Too many versions')
