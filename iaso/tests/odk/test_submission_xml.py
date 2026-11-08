from django.test import SimpleTestCase
from lxml import etree  # type: ignore

from iaso.odk.submission_xml import NoSuchElement, remove_repeat_instances


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
