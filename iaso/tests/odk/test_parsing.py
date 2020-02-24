from iaso.odk import parse_xls_form, XMLForm
from django.test import SimpleTestCase


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
        self.assertIsNone(xml_form['version'])
