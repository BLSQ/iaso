from iaso.enketo import inject_userid, to_xforms_xml

from django.test import TestCase

import iaso.models as m


class EnketoLibTests(TestCase):
    def setUp(self):
        self.maxDiff = None

    def test_inject_userid_create_tag_if_not_present(self):
        xml = inject_userid(
            '<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" id="quality_pca_2.31.8" version="1" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml"><meta><instanceID>uuid:demo</instanceID></meta></data>',
            546,
        )
        expectedInjected = '<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" id="quality_pca_2.31.8" version="1"><meta><instanceID>uuid:demo</instanceID><editUserID>546</editUserID></meta></data>'
        self.assertEqual(xml, expectedInjected)

    def test_inject_userid_update_tag_text_if_present(self):
        xml = inject_userid(
            '<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" id="quality_pca_2.31.8" version="1"><meta><instanceID>uuid:demo</instanceID><editUserID>546</editUserID></meta></data>',
            977,
        )
        expectedInjected = '<data xmlns:jr="http://openrosa.org/javarosa" xmlns:orx="http://openrosa.org/xforms" xmlns:ev="http://www.w3.org/2001/xml-events" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:odk="http://www.opendatakit.org/xforms" xmlns:h="http://www.w3.org/1999/xhtml" id="quality_pca_2.31.8" version="1"><meta><instanceID>uuid:demo</instanceID><editUserID>977</editUserID></meta></data>'
        self.assertEqual(xml, expectedInjected)

    def test_to_xforms_xml(self):
        form = m.Form(id=10, name="name < with entity", form_id="odk_form_id")
        xml = to_xforms_xml(
            form=form,
            version="2019559126",
            download_url="https://xlsform/odk_form_id.xml",
            md5checksum="857564sdf",
        )
        expectedXforms = [
            '<xforms xmlns="http://openrosa.org/xforms/xformsList">',
            "<xform>",
            "<formID>",
            "odk_form_id-10",
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
