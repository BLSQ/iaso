import os

from contextlib import contextmanager
from pathlib import Path
from unittest import skipUnless

from django.conf import settings
from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from lxml import etree

from hat.audit.models import INSTANCE_API, Modification
from iaso import models as m
from iaso.graphql.instances.mutations import MAX_ANSWERS
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION, CORE_SUBMISSIONS_UPDATE_PERMISSION
from iaso.tests.graphql.base import URL, GraphQLTestCase
from iaso.tests.graphql.fixtures import health_account


FIXTURES = Path(__file__).parent.parent / "fixtures" / "odk_cli"

#: `census_xform.xml`, as pyxform describes it: what `Instance.json` is parsed with
DESCRIPTOR = {
    "name": "data",
    "type": "survey",
    "version": "2024010101",
    "children": [
        {"name": "start", "type": "start"},
        {
            "name": "household",
            "type": "group",
            "children": [
                {"name": "population", "type": "integer"},
                {"name": "adults", "type": "integer"},
                {"name": "children_count", "type": "calculate"},
                {"name": "vaccinated", "type": "select one"},
                {"name": "reason", "type": "text"},
            ],
        },
        {"name": "gps", "type": "geopoint"},
        {
            "name": "child",
            "type": "repeat",
            "children": [{"name": "child_name", "type": "text"}, {"name": "child_age", "type": "integer"}],
        },
        {"name": "meta", "type": "group", "children": [{"name": "instanceID", "type": "calculate"}]},
    ],
}


class InstanceMutationsSetUp(GraphQLTestCase):
    """A monthly census of districts, edited by a district supervisor restricted to the North Region: never the
    River District, outside it."""

    @classmethod
    def setUpTestData(cls):
        health = health_account(project="Census", app_id="census")
        account, version = health.account, health.version
        cls.project = project = health.project

        cls.region_type = m.OrgUnitType.objects.create(name="Region")
        cls.district_type = m.OrgUnitType.objects.create(name="District")
        cls.north_region = m.OrgUnit.objects.create(name="North Region", org_unit_type=cls.region_type, version=version)
        cls.kanda_district = m.OrgUnit.objects.create(
            name="Kanda District", parent=cls.north_region, org_unit_type=cls.district_type, version=version
        )
        cls.bo_district = m.OrgUnit.objects.create(
            name="Bo District", parent=cls.north_region, org_unit_type=cls.district_type, version=version
        )
        cls.river_district = m.OrgUnit.objects.create(
            name="River District", org_unit_type=cls.district_type, version=version
        )

        cls.census = m.Form.objects.create(
            name="Census", form_id="census", period_type="MONTH", single_per_period=True, location_field="gps"
        )
        cls.census.projects.add(project)
        cls.census.org_unit_types.add(cls.district_type)
        cls.census.org_unit_types.add(cls.region_type)
        cls.form_version = m.FormVersion.objects.create(
            form=cls.census,
            version_id="2024010101",
            form_descriptor=DESCRIPTOR,
            file=SimpleUploadedFile("census.xml", (FIXTURES / "census_xform.xml").read_bytes()),
        )
        cls.district_type.reference_forms.add(cls.census)

        cls.user = cls.create_user_with_profile(
            username="district_supervisor",
            account=account,
            permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_SUBMISSIONS_UPDATE_PERMISSION],
            org_units=[cls.north_region],
        )
        cls.reader = cls.create_user_with_profile(
            username="viewer", account=account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.boss = cls.create_user_with_profile(
            username="national_admin", account=account, permissions=[CORE_SUBMISSIONS_UPDATE_PERMISSION]
        )

    def setUp(self):
        super().setUp()
        self.instance = m.Instance.objects.create(
            form=self.census,
            form_version=self.form_version,
            org_unit=self.kanda_district,
            project=self.project,
            period="202401",
            location=Point(5, 5, 100),
            accuracy=3,
        )
        submission = (FIXTURES / "census_submission.xml").read_text().format(id=self.instance.id)
        self.instance.file = SimpleUploadedFile("census.xml", submission.encode())
        self.instance.save()
        self.instance.get_and_save_json_of_xml()
        self.client.force_authenticate(self.user)

    # -- helpers --

    def mutate(self, mutation, selection="id", **arguments):
        variables = {"id": self.instance.id, **arguments}
        returned = f"submission {{ {selection} }} errors {{ code message field question }}"
        return self.execute(self.operation(mutation, returned, **variables), variables)

    def updated(self, mutation, selection="id", **arguments):
        body = self.mutate(mutation, selection, **arguments)
        self.assertNotIn("errors", body, body.get("errors"))
        self.assertEqual(body["data"][mutation]["errors"], [])
        return body["data"][mutation]["submission"]

    @contextmanager
    def unchanged(self):
        """Checks the submission and its log are, after the block, as they were before it."""
        before = m.Instance.objects.get(pk=self.instance.pk)
        modifications = Modification.objects.count()
        yield
        after = m.Instance.objects.get(pk=self.instance.pk)
        for field in ("period", "org_unit_id", "json", "file", "updated_at"):
            self.assertEqual(getattr(after, field), getattr(before, field), field)
        self.assertEqual(Modification.objects.count(), modifications)

    def refusals(self, mutation, **arguments):
        """The payload's `errors`, after checking nothing changed."""
        with self.unchanged():
            body = self.mutate(mutation, **arguments)
        self.assertNotIn("errors", body, body.get("errors"))
        payload = body["data"][mutation]
        self.assertIsNone(payload["submission"])
        self.assertTrue(payload["errors"])
        return payload["errors"]

    def refused(self, mutation, **arguments):
        """The only error, as `(code, message, field)`."""
        (error,) = self.refusals(mutation, **arguments)
        return error["code"], error["message"], error["field"]

    def denied(self, mutation, code, **arguments):
        """A top-level GraphQL error (not about the input): its message."""
        with self.unchanged():
            body = self.mutate(mutation, **arguments)
        (error,) = body["errors"]
        self.assertEqual(error["extensions"]["code"], code, error)
        return error["message"]

    def answers(self, **answers):
        """`group__question=` for `group/question`."""
        return [{"path": path.replace("__", "/"), "value": value} for path, value in answers.items()]


class InstanceMutationsTestCase(InstanceMutationsSetUp):
    # -- what every mutation checks --

    def test_requires_the_update_permission(self):
        self.client.force_authenticate(self.reader)
        self.assertIn("permission", self.denied("updateSubmissionPeriod", "FORBIDDEN", period="202402"))
        self.client.force_authenticate(None)
        self.assertIn("not provided", self.denied("updateSubmissionPeriod", "UNAUTHENTICATED", period="202402"))

    def test_only_in_the_users_scope(self):
        self.instance.org_unit = self.river_district
        self.instance.save()
        code, message, field = self.refused("updateSubmissionPeriod", period="202402")
        self.assertEqual((code, field), ("NOT_FOUND", ["id"]))
        self.assertIn("does not exist", message)

    def test_not_deleted_ones(self):
        self.instance.soft_delete()
        self.assertEqual(self.refused("updateSubmissionPeriod", period="202402")[0], "NOT_EDITABLE")

    def test_not_locked_above_the_user(self):
        # locked at the North Region: the supervisor's level
        lock = m.InstanceLock.objects.create(
            instance=self.instance, locked_by=self.boss, top_org_unit=self.north_region
        )
        self.assertEqual(self.updated("updateSubmissionPeriod", "period", period="202402"), {"period": "202402"})
        lock.unlocked_by = self.boss
        lock.save()
        Modification.objects.all().delete()
        # locked by someone seeing an org unit the supervisor doesn't
        m.InstanceLock.objects.create(instance=self.instance, locked_by=self.boss, top_org_unit=self.river_district)
        self.assertEqual(self.refused("updateSubmissionPeriod", period="202403")[0], "NOT_EDITABLE")

    def test_logged_and_returned_as_saved(self):
        row = self.updated("updateSubmissionPeriod", "period status lastModifiedBy { username }", period="202402")
        self.assertEqual(
            row, {"period": "202402", "status": "READY", "lastModifiedBy": {"username": "district_supervisor"}}
        )
        (modification,) = Modification.objects.all()
        self.assertEqual((modification.source, modification.user), (INSTANCE_API, self.user))
        self.assertEqual(modification.past_value[0]["fields"]["period"], "202401")
        self.assertEqual(modification.new_value[0]["fields"]["period"], "202402")

    def test_a_refused_mutation_leaves_the_others_applied(self):
        query = """mutation ($id: Int!, $orgUnitId: Int!) {
          period: updateSubmissionPeriod(id: $id, period: "202402") { submission { id } errors { code } }
          orgUnit: updateSubmissionOrgUnit(id: $id, orgUnitId: $orgUnitId) { submission { id } errors { code } }
        }"""
        body = self.execute(query, {"id": self.instance.id, "orgUnitId": self.river_district.id})
        self.assertNotIn("errors", body)
        self.assertEqual(body["data"]["period"], {"submission": {"id": self.instance.id}, "errors": []})
        self.assertEqual(body["data"]["orgUnit"], {"submission": None, "errors": [{"code": "NOT_FOUND"}]})
        self.instance.refresh_from_db()
        self.assertEqual((self.instance.period, self.instance.org_unit_id), ("202402", self.kanda_district.id))

    def test_json_body_only(self):
        query = 'mutation { updateSubmissionPeriod(id: 1, period: "202402") { errors { code } } }'
        response = self.client.post(URL, f'{{"query": "{query}"}}', content_type="text/plain")
        self.assertEqual(response.status_code, 415)

    # -- updateSubmissionPeriod --

    def test_period_of_the_forms_period_type(self):
        code, message, field = self.refused("updateSubmissionPeriod", period="2024Q1")
        self.assertEqual((code, field), ("INVALID", ["period"]))
        self.assertIn("expects a MONTH period", message)
        self.assertEqual(self.refused("updateSubmissionPeriod", period="202413")[0], "INVALID")
        self.assertEqual(self.refused("updateSubmissionPeriod", period="")[0], "INVALID")
        self.census.period_type = None
        self.census.save()
        self.assertEqual(self.refused("updateSubmissionPeriod", period="202402")[0], "NOT_EDITABLE")

    # -- updateSubmissionOrgUnit --

    def test_org_unit(self):
        row = self.updated("updateSubmissionOrgUnit", "orgUnit { name }", orgUnitId=self.bo_district.id)
        self.assertEqual(row, {"orgUnit": {"name": "Bo District"}})

    def test_org_unit_visible_to_the_user_of_the_forms_types(self):
        refusal = self.refused("updateSubmissionOrgUnit", orgUnitId=self.river_district.id)
        self.assertEqual((refusal[0], refusal[2]), ("NOT_FOUND", ["orgUnitId"]))
        self.census.org_unit_types.remove(self.region_type)
        refusal = self.refused("updateSubmissionOrgUnit", orgUnitId=self.north_region.id)
        self.assertEqual((refusal[0], refusal[2]), ("INVALID", ["orgUnitId"]))

    def test_moved_reference_instance_is_no_longer_its_previous_org_units(self):
        self.instance.flag_reference_instance(self.kanda_district)
        row = self.updated("updateSubmissionOrgUnit", "isReferenceSubmission", orgUnitId=self.bo_district.id)
        self.assertEqual(row, {"isReferenceSubmission": False})
        self.assertFalse(self.kanda_district.reference_instances.exists())

    # -- updateSubmissionContent: what doesn't run odk_cli --

    def test_content_refused_answers(self):
        thrice = [{"path": "household/population", "value": "1"}] * 3
        self.assertEqual(
            [(error["code"], error["field"]) for error in self.refusals("updateSubmissionContent", answers=thrice)],
            [("INVALID", ["answers", "1", "path"]), ("INVALID", ["answers", "2", "path"])],
        )
        too_many = [{"path": f"child[{i}]/child_age", "value": "1"} for i in range(1, MAX_ANSWERS + 2)]
        self.assertEqual(self.refused("updateSubmissionContent", answers=too_many)[::2], ("INVALID", ["answers"]))

    def test_content_needs_a_form_version(self):
        self.instance.form_version = None
        self.instance.save()
        answers = self.answers(household__population="7")
        self.assertEqual(self.refused("updateSubmissionContent", answers=answers)[::2], ("NOT_EDITABLE", ["id"]))

    @override_settings(ODK_CLI_PATH="/nonexistent/odk_cli")
    def test_content_without_odk_cli(self):
        answers = self.answers(household__population="7")
        message = self.denied("updateSubmissionContent", "SERVICE_UNAVAILABLE", answers=answers)
        self.assertIn("odk_cli isn't installed", message)


@skipUnless(os.path.exists(settings.ODK_CLI_PATH), f"odk_cli isn't installed at {settings.ODK_CLI_PATH}")
class InstanceContentMutationTestCase(InstanceMutationsSetUp):
    """`updateSubmissionContent` through the real odk_cli."""

    def edit(self, selection="content", **answers):
        return self.updated("updateSubmissionContent", selection, answers=self.answers(**answers))

    def refused_edit(self, **answers):
        """Every problem, as `(code, field, question)`."""
        errors = self.refusals("updateSubmissionContent", answers=self.answers(**answers))
        return [(error["code"], error["field"], error["question"]) for error in errors]

    def xml(self):
        self.instance.refresh_from_db()
        with self.instance.file.open("rb") as file:
            return etree.fromstring(file.read())

    def test_recomputes_and_keeps_the_rest(self):
        content = self.edit(household__population="7")["content"]
        self.assertEqual((content["population"], content["children_count"]), ("7", "5"))
        # the repeat instances, the preloads and the metadata as they were - the emoji written as entities by an
        # old device included
        self.assertEqual(
            content["child"],
            [{"child_name": "Amina", "child_age": "3"}, {"child_name": "Ibrahim \U0001f44d", "child_age": "3"}],
        )
        self.assertEqual(content["start"], "2024-01-15T10:00:00.000+01:00")
        self.assertEqual(content["instanceID"], "uuid:2b7f3cfe-0001")
        xml = self.xml()
        self.assertEqual(xml.findtext("household/children_count"), "5")
        self.assertEqual(xml.get("iasoInstance"), str(self.instance.id))
        self.assertEqual(self.instance.json, content)

    def test_logged(self):
        self.edit(household__population="7")
        (modification,) = Modification.objects.all()
        self.assertEqual(modification.past_value[0]["fields"]["json"]["children_count"], "3")
        self.assertEqual(modification.new_value[0]["fields"]["json"]["children_count"], "5")

    def test_keeps_the_previous_file(self):
        previous = self.instance.file.name
        self.edit(household__population="7")
        self.instance.refresh_from_db()
        self.assertNotEqual(self.instance.file.name, previous)
        self.assertTrue(self.instance.file.storage.exists(previous))

    def test_repeat_instances(self):
        content = self.edit(**{"child[2]/child_age": "4", "child/child_name": "Amina K."})["content"]
        self.assertEqual(
            content["child"],
            [{"child_name": "Amina K.", "child_age": "3"}, {"child_name": "Ibrahim \U0001f44d", "child_age": "4"}],
        )
        self.assertEqual(
            self.refused_edit(**{"child[3]/child_age": "4"}),
            [("INVALID", ["answers", "0", "path"], "child[3]/child_age")],
        )

    def test_relevance(self):
        content = self.edit(household__reason="fear", household__vaccinated="no")["content"]
        self.assertEqual(content["reason"], "fear")
        self.assertEqual(
            self.refused_edit(household__vaccinated="yes", household__reason="fear"),
            [("INVALID", ["answers", "1", "path"], "household/reason")],
        )
        # no longer relevant: dropped, as Collect would
        self.assertNotIn("reason", self.edit(household__vaccinated="yes")["content"])

    def test_constraints_and_required(self):
        self.assertEqual(
            self.refused_edit(household__adults="9"),
            [("INVALID", ["answers", "0", "value"], "household/adults")],
        )
        # `adults` breaks its constraint when `population` drops below it: not answered, so on `answers` as a whole
        self.assertEqual(
            self.refused_edit(household__population="1"),
            [("INVALID", ["answers"], "household/adults")],
        )
        self.assertEqual(
            self.refused_edit(household__population=None),
            [
                ("INVALID", ["answers", "0", "value"], "household/population"),
                ("INVALID", ["answers"], "household/adults"),
            ],
        )

    def test_every_problem_at_once_in_the_forms_order(self):
        self.assertEqual(
            self.refused_edit(household__vaccinated="maybe", household__adults="9", household__population="many"),
            [
                ("INVALID", ["answers", "2", "value"], "household/population"),
                ("INVALID", ["answers", "1", "value"], "household/adults"),
                ("INVALID", ["answers", "0", "value"], "household/vaccinated"),
            ],
        )

    def test_values_xml_cant_hold(self):
        self.assertEqual(
            self.refused_edit(household__reason="a\x00", household__population="b\x01"),
            [
                ("INVALID", ["answers", "0", "value"], "household/reason"),
                ("INVALID", ["answers", "1", "value"], "household/population"),
            ],
        )

    def test_questions_only(self):
        for path, message in [
            ("household/children_count", "Not a question: computed or metadata"),
            ("meta/instanceID", "Not a question: computed or metadata"),
            ("start", "Not a question: computed or metadata"),
            ("household", "Not a question: computed or metadata"),
            ("household/unknown", "No such question in this submission"),
        ]:
            with self.subTest(path=path):
                (error,) = self.refusals("updateSubmissionContent", answers=self.answers(**{path: "1"}))
                self.assertEqual(
                    (error["code"], error["field"], error["question"], error["message"]),
                    ("INVALID", ["answers", "0", "path"], path, message),
                )

    def test_location(self):
        row = self.edit("location { latitude longitude altitude } accuracy", gps="6.5 7.5 10 4")
        self.assertEqual(row, {"location": {"latitude": 6.5, "longitude": 7.5, "altitude": 10.0}, "accuracy": 4.0})
        self.assertEqual(self.edit("location { latitude }", gps=None), {"location": None})
