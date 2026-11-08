from django.test import SimpleTestCase
from lxml import etree  # type: ignore

from iaso.odk.submission_xml import NoSuchElement, move_to_version, remove_repeat_instances


SUBMISSION = b"""<?xml version='1.0' ?><data xmlns:jr="http://openrosa.org/javarosa" id="household" version="1">
<household><head_name>Alice</head_name></household>
<child><child_name>Bob</child_name><toy><toy_name>ball</toy_name></toy><toy><toy_name>car</toy_name></toy></child>
<child><child_name>Eve</child_name><toy><toy_name>doll</toy_name></toy></child>
<child><child_name>Paul &#55357;&#56832;</child_name></child>
<meta><instanceID>uuid:1</instanceID></meta>
</data>"""


def names(xml: bytes) -> list:
    """The children's names, with their toys."""
    root = etree.fromstring(xml)
    return [
        (child.findtext("child_name"), [toy.findtext("toy_name") for toy in child.findall("toy")])
        for child in root.findall("child")
    ]


class RemoveRepeatInstancesTestCase(SimpleTestCase):
    def test_indexes_of_the_submission_as_it_is(self):
        # child[1] removed first doesn't make child[3] the 2nd: every index is one before any removal
        xml = remove_repeat_instances(SUBMISSION, ["child[1]", "child[3]", "child[2]/toy[1]"])

        self.assertEqual(names(xml), [("Eve", [])])
        root = etree.fromstring(xml)
        self.assertEqual((root.get("id"), root.findtext("household/head_name")), ("household", "Alice"))

    def test_every_instance(self):
        self.assertEqual(names(remove_repeat_instances(SUBMISSION, ["child[*]"])), [])
        self.assertEqual(
            names(remove_repeat_instances(SUBMISSION, ["child[1]/toy[*]", "child[3]/toy[*]"])),
            [("Bob", []), ("Eve", ["doll"]), ("Paul 😀", [])],
        )

    def test_unknown_instance(self):
        for path in ("child[4]", "child[2]/toy[2]", "household/child[1]"):
            with self.subTest(path=path):
                with self.assertRaisesMessage(NoSuchElement, path):
                    remove_repeat_instances(SUBMISSION, [path])

    def test_no_entity_expanded(self):
        xml = (
            b'<!DOCTYPE data [<!ENTITY secret SYSTEM "file:///etc/passwd">]><data><child><n>&secret;</n></child></data>'
        )

        self.assertNotIn(b"root:", remove_repeat_instances(xml, []))


#: the household form's next version, as pyxform writes it: a water source (default "well"), whether each child is
#: vaccinated, a group of pets; the repeats with their template and their first instance
NEXT_XFORM = b"""<h:html xmlns="http://www.w3.org/2002/xforms" xmlns:h="http://www.w3.org/1999/xhtml"
 xmlns:jr="http://openrosa.org/javarosa"><h:head><model>
<instance><data id="household" version="2">
<household><head_name/><water_source>well</water_source></household>
<child jr:template=""><child_name/><toy jr:template=""><toy_name/></toy><toy><toy_name/></toy><vaccinated/></child>
<child><child_name/><toy><toy_name/></toy><vaccinated/></child>
<pets><pet jr:template=""><pet_name/></pet><pet><pet_name/></pet><pets_count>0</pets_count></pets>
<meta><instanceID/></meta>
</data></instance>
<instance id="villages"><root><item><name>Ghent</name></item></root></instance>
</model></h:head></h:html>"""


class MoveToVersionTestCase(SimpleTestCase):
    def test_labelled_and_completed_with_the_nodes_the_version_adds(self):
        root = etree.fromstring(move_to_version(SUBMISSION, NEXT_XFORM, "2"))

        self.assertEqual((root.get("id"), root.get("version")), ("household", "2"))
        self.assertEqual(
            (root.findtext("household/head_name"), root.findtext("household/water_source")), ("Alice", "well")
        )
        # in every child, not a toy more
        self.assertEqual([child.findtext("vaccinated") for child in root.findall("child")], ["", "", ""])
        self.assertEqual(names(etree.tostring(root)), [("Bob", ["ball", "car"]), ("Eve", ["doll"]), ("Paul 😀", [])])
        # a group added without its repeat's instances
        self.assertEqual([(child.tag, child.text) for child in root.find("pets")], [("pets_count", "0")])
        self.assertIsNone(root.find("item"), "nothing of another instance")
        self.assertEqual(root.findtext("meta/instanceID"), "uuid:1")

    def test_in_the_submissions_namespace(self):
        submission = b'<data xmlns="http://www.w3.org/2002/xforms" id="household"><household/></data>'

        root = etree.fromstring(move_to_version(submission, NEXT_XFORM, "2"))

        self.assertEqual(
            root.findtext("{http://www.w3.org/2002/xforms}household/{http://www.w3.org/2002/xforms}water_source"),
            "well",
        )
