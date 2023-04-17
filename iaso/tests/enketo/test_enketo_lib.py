from django.test import TestCase

import iaso.models as m
from iaso.enketo import to_xforms_xml
from iaso.enketo.enketo_xml import inject_xml_find_uuid


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

    def test_to_xforms_xml(self):
        form = m.Form.objects.create(name="name < with entity", form_id="odk_form_id")
        m.FormVersion.objects.create(form=form, version_id="2012010601")
        xml = to_xforms_xml(
            form=form, version="2019559126", download_url="https://xlsform/odk_form_id.xml", md5checksum="857564sdf"
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
