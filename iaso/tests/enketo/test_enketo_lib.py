from django.test import TestCase

import iaso.models as m

from iaso.enketo import to_xforms_xml
from iaso.enketo.enketo_xml import collect_values, inject_xml_find_uuid, parse_to_structured_dict


class EnketoLibTests(TestCase):
    def setUp(self):
        self.maxDiff = None

    def test_inject_userid_create_tag_if_not_present(self):
        original_xml = b'<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" id="quality_pca_2.31.8" version="1" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml"><meta><instanceID>uuid:demo</instanceID></meta></data>'
        uuid, xml = inject_xml_find_uuid(original_xml, 123, 2012010601, 546)
        expectedInjected = b'<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" id="quality_pca_2.31.8" version="2012010601" iasoInstance="123"><meta><instanceID>uuid:demo</instanceID><editUserID>546</editUserID></meta></data>'
        self.assertEqual(xml, expectedInjected)
        self.assertEqual(uuid, "demo")

    def test_inject_userid_update_tag_text_if_present(self):
        original_xml = b'<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" id="quality_pca_2.31.8" version="1"><meta><instanceID>uuid:demo</instanceID><editUserID>546</editUserID></meta></data>'
        uuid, xml = inject_xml_find_uuid(original_xml, 123, 2012010601, 977)
        expectedInjected = b'<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" id="quality_pca_2.31.8" version="2012010601" iasoInstance="123"><meta><instanceID>uuid:demo</instanceID><editUserID>977</editUserID></meta></data>'
        self.assertEqual(str(xml), str(expectedInjected))
        self.assertEqual(uuid, "demo")

    def test_inject_user_id_with_emoji_content(self):
        original_xml = b'<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" id="quality_pca_2.31.8" version="1"><meta><instanceID>uuid:demo</instanceID><editUserID>546</editUserID></meta><prevous_muac_color>&#55357;&#57313;Yellow</prevous_muac_color></data>'
        uuid, xml = inject_xml_find_uuid(original_xml, 123, 2012010601, 977)
        expectedInjected = b'<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" id="quality_pca_2.31.8" version="2012010601" iasoInstance="123"><meta><instanceID>uuid:demo</instanceID><editUserID>977</editUserID></meta><prevous_muac_color>\xf0\x9f\x9f\xa1Yellow</prevous_muac_color></data>'
        self.assertEqual(str(xml), str(expectedInjected))
        self.assertEqual(uuid, "demo")

    def test_to_xforms_xml(self):
        form = m.Form.objects.create(name="name < with entity", form_id="odk_form_id")
        m.FormVersion.objects.create(form=form, version_id="2012010601")
        xml = to_xforms_xml(
            form=form,
            version="2019559126",
            download_url="https://xlsform/odk_form_id.xml",
            md5checksum="857564sdf",
            manifest_url=None,
        )
        expectedXforms = [
            '<xforms xmlns="http://openrosa.org/xforms/xformsList">',
            "<xform>",
            "<formID>",
            f"odk_form_id-{form.id}-2012010601",
            "</formID>",
            "<name>",
            "name &lt; with entity",
            "</name>",
            "<version>2019559126</version>",
            "<hash>md5:857564sdf</hash>",
            "<descriptionText>",
            "name &lt; with entity",
            "</descriptionText>",
            "<downloadUrl>",
            "https://xlsform/odk_form_id.xml",
            "</downloadUrl>",
            "</xform>",
            "</xforms>",
        ]
        self.assertEqual(xml, "".join(expectedXforms))

    def test_parse_to_structured_dict(self):
        xml = b"""<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" id="survey-media" version="2025100901" iasoInstance="11854">
          <respondent>test bracket</respondent>
          <photo>Untitled-19_51_21 (Copy)-8_53_32.jpeg</photo>
          <pdf_attachment>export(11)-8_36_42.xlsx</pdf_attachment>
          
        
        <invoices>
            <excel>survey-media(6)-9_21_0.xlsx</excel>
            <photo_meeting>Untitled-19_51_21 (Copy)-9_21_6.jpeg</photo_meeting>
          </invoices><invoices>
            <excel>survey-media(6)-9_21_14.xlsx</excel>
            <photo_meeting>image (3)-9_23_14.png</photo_meeting>
          </invoices>
          <end_note/>
        <meta>
            <instanceID>uuid:12e9de6e-676c-4379-a816-9fabe9305c02</instanceID>
          <editUserID>1</editUserID><deprecatedID>uuid:26630473-f13b-4c6f-bbf7-82412eef9b3d</deprecatedID></meta>
        </data>"""

        json_payload = parse_to_structured_dict(xml)

        expected = {
            "data": {
                "_iasoInstance": "11854",
                "_id": "survey-media",
                "_version": "2025100901",
                "end_note": {},
                "invoices": [
                    {"excel": "survey-media(6)-9_21_0.xlsx", "photo_meeting": "Untitled-19_51_21 (Copy)-9_21_6.jpeg"},
                    {"excel": "survey-media(6)-9_21_14.xlsx", "photo_meeting": "image (3)-9_23_14.png"},
                ],
                "meta": {
                    "deprecatedID": "uuid:26630473-f13b-4c6f-bbf7-82412eef9b3d",
                    "editUserID": "1",
                    "instanceID": "uuid:12e9de6e-676c-4379-a816-9fabe9305c02",
                },
                "pdf_attachment": "export(11)-8_36_42.xlsx",
                "photo": "Untitled-19_51_21 (Copy)-8_53_32.jpeg",
                "respondent": "test bracket",
            }
        }

        self.assertEqual(json_payload, expected)

    def test_collect_values(self):
        input_dict = {
            "data": {
                "_iasoInstance": "11854",
                "_id": "survey-media",
                "_version": "2025100901",
                "end_note": {},
                "invoices": [
                    {"excel": "survey-media(6)-9_21_0.xlsx", "photo_meeting": "Untitled-19_51_21 (Copy)-9_21_6.jpeg"},
                    {"excel": "survey-media(6)-9_21_14.xlsx", "photo_meeting": "image (3)-9_23_14.png"},
                ],
                "meta": {
                    "deprecatedID": "uuid:26630473-f13b-4c6f-bbf7-82412eef9b3d",
                    "editUserID": "1",
                    "instanceID": "uuid:12e9de6e-676c-4379-a816-9fabe9305c02",
                },
                "pdf_attachment": "export(11)-8_36_42.xlsx",
                "photo": "Untitled-19_51_21 (Copy)-8_53_32.jpeg",
                "respondent": "test bracket",
            }
        }
        values = collect_values(input_dict)

        self.assertEqual(
            values,
            [
                "survey-media(6)-9_21_0.xlsx",
                "Untitled-19_51_21 (Copy)-9_21_6.jpeg",
                "survey-media(6)-9_21_14.xlsx",
                "image (3)-9_23_14.png",
                "uuid:26630473-f13b-4c6f-bbf7-82412eef9b3d",
                "1",
                "uuid:12e9de6e-676c-4379-a816-9fabe9305c02",
                "export(11)-8_36_42.xlsx",
                "Untitled-19_51_21 (Copy)-8_53_32.jpeg",
                "test bracket",
            ],
        )
