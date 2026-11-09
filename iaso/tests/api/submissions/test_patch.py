import copy

from django.core.files.base import ContentFile
from pyxform.builder import create_survey_element_from_dict
from rest_framework import status

from hat.audit.models import INSTANCE_API, Modification
from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION, CORE_SUBMISSIONS_UPDATE_PERMISSION
from iaso.tests.api.submissions.fixtures import HOUSEHOLD_SURVEY, URL, SubmissionsTestCase, requires_odk_cli


@requires_odk_cli
class SubmissionsPatchTestCase(SubmissionsTestCase):
    def setUp(self):
        super().setUp()
        self.instance = self.create(content={"child": [{"child_name": "Bob", "child_age": 2}]})
        self.file_name = self.instance.file.name

    def patch(self, body, query=""):
        return self.client.patch(f"{URL}{self.instance.id}/{query}", body, format="json")

    def assertPatched(self, body, query=""):
        data = self.assertJSONResponse(self.patch(body, query), status.HTTP_200_OK)
        self.assertResponseCompliantToSwagger(data, "SubmissionPatchResult")
        self.instance.refresh_from_db()
        return data

    def assertRefused(self, body, expected_errors):
        """400 with these (`code`, `field`), and the submission as it was: same content, same file, no audit."""
        json_before = self.instance.json
        modifications = Modification.objects.count()
        data = self.assertJSONResponse(self.patch(body), status.HTTP_400_BAD_REQUEST)
        self.assertResponseCompliantToSwagger(data, "SubmissionErrors")
        self.assertEqual([(error["code"], error["field"]) for error in data["errors"]], expected_errors)
        self.instance.refresh_from_db()
        self.assertEqual(self.instance.json, json_before)
        self.assertEqual(self.instance.file.name, self.file_name)
        self.assertEqual(Modification.objects.count(), modifications)
        return data

    def test_patch_content(self):
        data = self.assertPatched({"content": {"population": 5}})

        self.assertEqual(self.instance.json["population"], "5")
        # computed again
        self.assertEqual(self.instance.json["double_population"], "10")
        # untouched
        self.assertEqual(self.instance.json["head_name"], "Alice")
        self.assertEqual(self.instance.json["child"], [{"child_name": "Bob", "child_age": "2"}])
        self.assertEqual(data["submission"]["content"], self.instance.json)
        self.assertEqual(data["warnings"], [])
        self.assertNotEqual(self.instance.file.name, self.file_name, "a new file, the previous one kept")
        self.assertEqual(self.instance.last_modified_by, self.user)
        modification = Modification.objects.filter(object_id=str(self.instance.id)).latest("id")
        self.assertEqual((modification.source, modification.user), (INSTANCE_API, self.user))
        self.assertEqual(modification.past_value[0]["fields"]["json"]["population"], "3")
        self.assertEqual(modification.new_value[0]["fields"]["json"]["population"], "5")

    def test_null_clears(self):
        self.assertPatched({"content": {"population": None}})
        self.assertEqual(self.instance.json["population"], "")
        self.file_name = self.instance.file.name

        self.assertRefused({"content": {"head_name": None}}, [("REQUIRED", "content.head_name")])

    def test_repeats_by_position(self):
        self.assertPatched({"content": {"child": [{}, {"child_name": "Eve"}]}})

        self.assertEqual(
            self.instance.json["child"],
            [{"child_name": "Bob", "child_age": "2"}, {"child_name": "Eve", "child_age": ""}],
        )
        self.assertEqual(self.instance.json["children_count"], "2")

    def test_null_removes_repeat_instances(self):
        self.assertPatched({"content": {"child": [{}, {"child_name": "Eve"}, {"child_name": "Paul"}]}})

        # Bob removed: Eve is then the first, the answer in the list is for her
        self.assertPatched({"content": {"child": [None, {"child_age": 3}]}})

        self.assertEqual(
            self.instance.json["child"],
            [{"child_name": "Eve", "child_age": "3"}, {"child_name": "Paul", "child_age": ""}],
        )
        self.assertEqual(self.instance.json["children_count"], "2", "computed again")
        modification = Modification.objects.filter(object_id=str(self.instance.id)).latest("id")
        self.assertEqual(len(modification.past_value[0]["fields"]["json"]["child"]), 3)

        self.assertPatched({"content": {"child": None}})

        self.assertNotIn("child", self.instance.json)
        self.assertEqual(self.instance.json["children_count"], "0")

    def test_removing_what_isnt_there(self):
        self.assertRefused({"content": {"child": [{}, None]}}, [("INVALID", "content.child[2]")])

    def test_change_the_org_unit_injects_its_context_again(self):
        self.assertPatched({"org_unit_id": self.brussels.id, "content": {"district_code": "BXL"}})

        self.assertEqual(self.instance.org_unit, self.brussels)
        self.assertEqual(self.instance.json["current_ou_name"], "Brussels")
        self.assertEqual(self.instance.json["district_code"], "BXL")

    def test_a_reference_submission_moved_to_another_org_unit_is_no_longer_its_reference(self):
        self.district.reference_forms.add(self.form)
        self.instance.flag_reference_instance(self.antwerp)

        self.assertPatched({"org_unit_id": self.brussels.id})

        self.assertFalse(self.antwerp.reference_instances.filter(id=self.instance.id).exists())
        self.assertFalse(self.brussels.reference_instances.exists())

    def test_org_unit_and_period_problems(self):
        self.assertRefused({"org_unit_id": self.paris.id}, [("UNKNOWN_REFERENCE", "org_unit_id")])
        self.assertRefused({"org_unit_id": self.flanders.id}, [("INVALID", "org_unit_id")])
        self.assertRefused({"period": "2026"}, [("INVALID", "period")])

        self.assertPatched({"period": "202612"})
        self.assertEqual(self.instance.period, "202612")
        self.assertEqual(self.instance.file.name, self.file_name, "the content wasn't touched")

    def test_content_problems(self):
        self.assertRefused({"content": {"population": -1}}, [("CONSTRAINT", "content.population")])
        self.assertRefused(
            {"content": {"double_population": 7}}, [("CALCULATION_MISMATCH", "content.double_population")]
        )
        self.assertRefused({"content": {"nope": 1}}, [("UNKNOWN_QUESTION", "content.nope")])
        self.assertRefused({"content": {"_version": "2026010101"}}, [("UNKNOWN_REFERENCE", "content._version")])
        self.assertRefused({"content": {"instanceID": "uuid:other"}}, [("INVALID", "content.instanceID")])

    def test_a_problem_already_there_is_only_reported(self):
        # the form now wants at least 5 people: this submission (3) was saved before
        survey = copy.deepcopy(HOUSEHOLD_SURVEY)
        household = next(child for child in survey["children"] if child["name"] == "household")
        population = next(child for child in household["children"] if child["name"] == "population")
        population["bind"] = {"constraint": ". >= 5", "jr:constraintMsg": "At least 5"}
        xform = create_survey_element_from_dict(survey).to_xml(validate=False).encode()
        self.form_version.file.save("household.xml", ContentFile(xform))

        data = self.assertPatched({"content": {"head_name": "Alicia"}})

        self.assertEqual(self.instance.json["head_name"], "Alicia")
        self.assertEqual(self.instance.json["population"], "3", "left as it is")
        self.assertEqual(
            data["warnings"],
            [
                {
                    "code": "CONSTRAINT",
                    "field": "content.population",
                    "question": "household/population",
                    "message": "Already in the submission, left as it is: At least 5",
                    "answer": "3",
                }
            ],
        )
        # answered, it must be right
        self.file_name = self.instance.file.name
        self.assertRefused({"content": {"population": 4}}, [("CONSTRAINT", "content.population")])
        data = self.assertPatched({"content": {"population": 5}})
        self.assertEqual(data["warnings"], [])

    def test_what_get_returns_can_be_sent_back(self):
        read = self.assertJSONResponse(self.client.get(f"{URL}{self.instance.id}/"), status.HTTP_200_OK)

        self.assertPatched({"content": {**read["content"], "head_name": "Alicia"}})

        self.assertEqual(self.instance.json["head_name"], "Alicia")

    def test_volatile_calculates_are_only_reported(self):
        data = self.assertPatched({"content": {"head_name": "Alicia", "visit_hour": "99"}})

        self.assertEqual(
            [(warning["code"], warning["field"], warning["answer"]) for warning in data["warnings"]],
            [("CALCULATION_IGNORED", "content.visit_hour", "99")],
        )
        self.assertEqual(self.instance.json["head_name"], "Alicia", "saved all the same")
        self.assertNotEqual(self.instance.json["visit_hour"], "99")

    def test_expected_updated_at(self):
        read = self.assertJSONResponse(self.client.get(f"{URL}{self.instance.id}/"), status.HTTP_200_OK)
        self.assertPatched({"period": "202612", "expected_updated_at": read["updated_at"]})

        # the same updated_at again: the submission changed since
        self.assertRefused(
            {"period": "202610", "expected_updated_at": read["updated_at"]}, [("CONFLICT", "expected_updated_at")]
        )

    def test_dry_run_shows_without_saving(self):
        data = self.assertPatched(
            {"content": {"population": 5}, "org_unit_id": self.brussels.id}, query="?dry_run=true"
        )

        self.assertEqual(data["submission"]["content"]["double_population"], "10")
        self.assertEqual(data["submission"]["org_unit_id"], self.brussels.id)
        self.assertEqual(self.instance.json["population"], "3")
        self.assertEqual(self.instance.org_unit, self.antwerp)
        self.assertEqual(self.instance.file.name, self.file_name)

    def test_request_shape(self):
        for body in ({}, {"orgunit_id": self.brussels.id}, {"content": "x"}):
            with self.subTest(body=body):
                data = self.assertJSONResponse(self.patch(body), status.HTTP_400_BAD_REQUEST)
                self.assertEqual({error["code"] for error in data["errors"]}, {"INVALID"})

    def test_who_can_patch(self):
        reader = self.create_user_with_profile(
            username="belgium_reader", account=self.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        self.client.force_authenticate(reader)
        self.assertJSONResponse(self.patch({"period": "202612"}), status.HTTP_403_FORBIDDEN)

        french_editor = self.create_user_with_profile(
            username="france_editor", account=self.france, permissions=[CORE_SUBMISSIONS_UPDATE_PERMISSION]
        )
        self.client.force_authenticate(french_editor)
        self.assertJSONResponse(self.patch({"period": "202612"}), status.HTTP_404_NOT_FOUND)

        # locked at the Flanders level, which an Antwerp editor can't unlock
        m.InstanceLock.objects.create(instance=self.instance, locked_by=self.user, top_org_unit=self.flanders)
        antwerp_editor = self.create_user_with_profile(
            username="antwerp_editor",
            account=self.account,
            permissions=[CORE_SUBMISSIONS_UPDATE_PERMISSION],
            org_units=[self.antwerp],
        )
        self.client.force_authenticate(antwerp_editor)
        self.assertJSONResponse(self.patch({"period": "202612"}), status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(self.user)
        self.assertPatched({"period": "202612"})
