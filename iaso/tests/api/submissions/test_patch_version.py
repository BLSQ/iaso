import copy

from lxml import etree  # type: ignore
from rest_framework import status

from hat.audit.models import Modification
from iaso import models as m
from iaso.tests.api.submissions.fixtures import (
    HOUSEHOLD_SURVEY,
    URL,
    VERSION,
    SubmissionsTestCase,
    create_form_version,
    requires_odk_cli,
)


NEXT_VERSION = "2026110901"


def next_household_survey() -> dict:
    """The household form's next version: no head name any more, a water source required."""
    survey = copy.deepcopy(HOUSEHOLD_SURVEY)
    survey["version"] = NEXT_VERSION
    household = next(child for child in survey["children"] if child["name"] == "household")
    household["children"] = [child for child in household["children"] if child["name"] != "head_name"] + [
        {"type": "text", "name": "water_source", "label": "Water source", "bind": {"required": "true()"}}
    ]
    return survey


@requires_odk_cli
class SubmissionsPatchVersionTestCase(SubmissionsTestCase):
    """`content._version` moves a submission to another version of its form."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.next_version = create_form_version(cls.form, next_household_survey())

    def setUp(self):
        super().setUp()
        self.instance = self.create(content={"_version": VERSION, "child": [{"child_name": "Bob", "child_age": 2}]})
        self.file_name = self.instance.file.name

    def patch(self, body, query=""):
        return self.client.patch(f"{URL}{self.instance.id}/{query}", body, format="json")

    def assertRefused(self, body, expected_errors):
        data = self.assertJSONResponse(self.patch(body), status.HTTP_400_BAD_REQUEST)
        self.assertEqual([(error["code"], error["field"]) for error in data["errors"]], expected_errors)
        self.instance.refresh_from_db()
        self.assertEqual(
            (self.instance.form_version, self.instance.file.name), (self.form_version, self.file_name), "unchanged"
        )

    def xml_version(self) -> str:
        self.instance.file.open("rb")
        return etree.fromstring(self.instance.file.read()).get("version")

    def test_moved_to_the_next_version(self):
        data = self.assertJSONResponse(
            self.patch({"content": {"_version": NEXT_VERSION, "water_source": "well"}}), status.HTTP_200_OK
        )

        self.assertResponseCompliantToSwagger(data, "SubmissionPatchResult")
        self.instance.refresh_from_db()
        self.assertEqual(self.instance.form_version, self.next_version)
        self.assertEqual(self.xml_version(), NEXT_VERSION)
        self.assertEqual(
            {key: self.instance.json.get(key) for key in ("_version", "water_source", "population", "head_name")},
            {"_version": NEXT_VERSION, "water_source": "well", "population": "3", "head_name": None},
        )
        self.assertEqual(self.instance.json["child"], [{"child_name": "Bob", "child_age": "2"}])
        self.assertEqual(
            [(w["code"], w["field"], w["answer"]) for w in data["warnings"]],
            [("DROPPED", "content.head_name", "Alice")],
        )
        modification = Modification.objects.filter(object_id=str(self.instance.id)).latest("id")
        self.assertEqual(modification.past_value[0]["fields"]["form_version"], self.form_version.id)
        self.assertEqual(modification.new_value[0]["fields"]["form_version"], self.next_version.id)

        # and back, the head name answered again
        data = self.assertJSONResponse(
            self.patch({"content": {"_version": VERSION, "head_name": "Alicia"}}), status.HTTP_200_OK
        )
        self.instance.refresh_from_db()
        self.assertEqual((self.instance.form_version, self.instance.json["head_name"]), (self.form_version, "Alicia"))
        self.assertEqual([(w["code"], w["field"]) for w in data["warnings"]], [("DROPPED", "content.water_source")])

    def test_a_question_the_version_requires(self):
        self.assertRefused({"content": {"_version": NEXT_VERSION}}, [("REQUIRED", "content.water_source")])

    def test_unknown_version(self):
        other_form = m.Form.objects.create(name="Belgium school")
        other_form.projects.add(self.project)
        create_form_version(other_form, {**HOUSEHOLD_SURVEY, "id_string": "school", "version": "2026110902"})

        for version_id in ("1999", "2026110902"):
            with self.subTest(version_id=version_id):
                self.assertRefused({"content": {"_version": version_id}}, [("UNKNOWN_REFERENCE", "content._version")])

    def test_move_and_remove_repeats_in_two_patches(self):
        self.assertRefused(
            {"content": {"_version": NEXT_VERSION, "water_source": "well", "child": [None]}},
            [("INVALID", "content.child[1]")],
        )

    def test_dry_run(self):
        data = self.assertJSONResponse(
            self.patch({"content": {"_version": NEXT_VERSION, "water_source": "well"}}, query="?dry_run=true"),
            status.HTTP_200_OK,
        )

        self.assertEqual(data["submission"]["content"]["_version"], NEXT_VERSION)
        self.instance.refresh_from_db()
        self.assertEqual((self.instance.form_version, self.instance.file.name), (self.form_version, self.file_name))
