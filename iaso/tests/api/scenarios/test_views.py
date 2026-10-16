from django.contrib.contenttypes.models import ContentType
from rest_framework import status

from hat.audit.models import SCENARIO_API, Modification
from iaso import models as m
from iaso.scenarios.schema import json_schema
from iaso.tests.api.scenarios.base import URL, ScenarioAPITestCase
from iaso.tests.scenarios.fixtures import FORM, PASSING, create_form, example


class ScenarioPermissionsTestCase(ScenarioAPITestCase):
    def test_anonymous(self):
        self.client.force_authenticate(None)

        for response in (self.client.get(URL), self.client.post(URL, {}, format="json")):
            self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_without_permission(self):
        self.client.force_authenticate(self.user_without_permission)

        self.assertJSONResponse(self.client.get(URL), status.HTTP_403_FORBIDDEN)
        self.assertJSONResponse(self.client.get(f"{URL}{self.passing.id}/"), status.HTTP_403_FORBIDDEN)
        self.assertJSONResponse(self.client.delete(f"{URL}{self.passing.id}/"), status.HTTP_403_FORBIDDEN)
        self.assertJSONResponse(self.client.get(f"{URL}schema/"), status.HTTP_403_FORBIDDEN)

    def test_user_without_profile(self):
        self.client.force_authenticate(m.User.objects.create(username="no_profile", is_superuser=True))

        self.assertJSONResponse(self.client.get(URL), status.HTTP_403_FORBIDDEN)

    def test_no_put(self):
        # PATCH replaces the file (test_editor); PUT isn't offered
        response = self.client.put(f"{URL}{self.passing.id}/", {"name": "Renamed"}, format="json")

        self.assertJSONResponse(response, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.passing.refresh_from_db()
        self.assertEqual(self.passing.name, "Oedema leads to OTP")


class ScenarioListTestCase(ScenarioAPITestCase):
    def test_list(self):
        self.passing.last_run_result = {"failed_step": None, "failures": []}
        self.failing.last_run_result = {"failed_step": 2, "failures": ["Step 2: 'oedema_status' should be 'yes'"]}
        m.Scenario.objects.bulk_update([self.passing, self.failing], ["last_run_result"])

        # the permission check (the user's permissions, its groups' permissions), the form names, the scenarios - the
        # profile is already loaded on the test user (in a real request, one more query)
        with self.assertNumQueries(4):
            response = self.client.get(URL)

        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidListData(list_data=data, results_key="results", expected_length=3)
        self.assertResponseCompliantToSwagger(data["results"], "ScenarioList", as_array=True)
        # Belgium's only (not France's, not the deleted one), by name
        self.assertEqual(
            [scenario["id"] for scenario in data["results"]], [self.form_scenario.id, self.failing.id, self.passing.id]
        )
        form_scenario, failing, passing = data["results"]
        self.assertEqual(
            passing,
            {
                "id": self.passing.id,
                "name": "Oedema leads to OTP",
                "description": self.passing.definition["description"],
                "kind": "entity",
                "entity_type_id": self.belgium.entity_type.id,
                "steps_count": 3,
                "forms": ["child_registration", "anthropometry", "otp_admission"],
                "journey": ["Child registration", "Anthropometry", "OTP admission"],
                "last_run_at": None,
                "last_run_status": "",
                "last_run_workflow_version_id": None,
                "last_run_failed_step": None,
                "last_run_failures": [],
                "created_at": passing["created_at"],
                "updated_at": passing["updated_at"],
            },
        )
        self.assertEqual(
            (failing["last_run_failed_step"], failing["last_run_failures"]),
            (2, ["Step 2: 'oedema_status' should be 'yes'"]),
        )
        self.assertEqual((form_scenario["kind"], form_scenario["entity_type_id"]), ("form", None))
        self.assertEqual(form_scenario["forms"], ["child_registration"])
        self.assertNotIn("definition", passing)

    def test_journey_of_a_form_not_found(self):
        # a form deleted (or its form_id changed) since the import: its form_id
        self.belgium.project.forms.get(form_id="anthropometry").delete()

        data = self.assertJSONResponse(self.client.get(URL, {"kind": "entity"}), status.HTTP_200_OK)

        journeys = {scenario["id"]: scenario["journey"] for scenario in data["results"]}
        self.assertEqual(journeys[self.passing.id], ["Child registration", "anthropometry", "OTP admission"])

    def test_list_other_account(self):
        self.client.force_authenticate(self.user_france)

        data = self.assertJSONResponse(self.client.get(URL), status.HTTP_200_OK)

        self.assertEqual([scenario["id"] for scenario in data["results"]], [self.france_scenario.id])


class ScenarioRetrieveTestCase(ScenarioAPITestCase):
    def test_retrieve(self):
        data = self.assertJSONResponse(self.client.get(f"{URL}{self.passing.id}/"), status.HTTP_200_OK)

        self.assertResponseCompliantToSwagger(data, "ScenarioDetail")
        # the file as imported: the download
        self.assertEqual(data["definition"], example(PASSING))
        self.assertIsNone(data["last_run_result"])
        # for the page: the entity type, and its reference form's questions (follow-up conditions in words)
        self.assertEqual(
            (data["entity_type_name"], data["reference_form_id"]),
            ("Child", self.belgium.entity_type.reference_form_id),
        )

    def test_retrieve_form_scenario(self):
        data = self.assertJSONResponse(self.client.get(f"{URL}{self.form_scenario.id}/"), status.HTTP_200_OK)

        self.assertEqual((data["entity_type_name"], data["reference_form_id"]), (None, None))

    def test_retrieve_other_account_or_deleted(self):
        for scenario in (self.france_scenario, self.deleted):
            with self.subTest(scenario=scenario.name):
                self.assertJSONResponse(self.client.get(f"{URL}{scenario.id}/"), status.HTTP_404_NOT_FOUND)


class ScenarioCreateTestCase(ScenarioAPITestCase):
    def post(self, definition):
        return self.client.post(URL, {"definition": definition}, format="json")

    def assertRefused(self, response, message, field="definition"):
        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(data, field)
        self.assertIn(message, " | ".join(data[field]))

    def test_import_entity_scenario(self):
        definition = example(PASSING, name="Oedema at 11 months")

        data = self.assertJSONResponse(self.post(definition), status.HTTP_201_CREATED)

        self.assertResponseCompliantToSwagger(data, "ScenarioDetail")
        scenario = m.Scenario.objects.get(id=data["id"])
        self.assertEqual(
            (scenario.account, scenario.kind, scenario.entity_type, scenario.name),
            (
                self.belgium.account,
                m.ScenarioKind.ENTITY,
                self.belgium.entity_type,
                "Oedema at 11 months",
            ),
        )
        self.assertEqual(scenario.description, definition["description"])
        self.assertEqual(scenario.definition, definition)
        self.assertEqual((scenario.created_by, scenario.updated_by), (self.user, self.user))
        modification = Modification.objects.get(
            content_type=ContentType.objects.get_for_model(m.Scenario), object_id=scenario.id
        )
        self.assertEqual(
            (modification.source, modification.user, modification.past_value), (SCENARIO_API, self.user, [])
        )

    def test_import_form_scenario(self):
        data = self.assertJSONResponse(self.post(example(FORM, name="Registration")), status.HTTP_201_CREATED)

        scenario = m.Scenario.objects.get(id=data["id"])
        self.assertEqual((scenario.kind, scenario.entity_type), (m.ScenarioKind.FORM, None))

    def test_invalid_file(self):
        definition = example(PASSING, name="Numbers")
        definition["steps"][0]["answers"]["age_months"] = 11

        self.assertRefused(self.post(definition), "steps.0.answers.age_months: Input should be a valid string")
        self.assertRefused(
            self.post({"name": "No kind", "steps": []}), "Unable to extract tag using discriminator 'kind'"
        )
        self.assertFalse(m.Scenario.objects.filter(name="Numbers").exists())

    def test_unknown_form(self):
        definition = example(PASSING, name="Unknown form")
        definition["steps"][1]["form"] = "muac_screening"

        self.assertRefused(self.post(definition), "Unknown forms in this account: muac_screening")

    def test_form_of_another_account(self):
        # a form of France only: unknown in Belgium
        france_project = self.france.project
        france_project.forms.add(m.Form.objects.create(form_id="muac_screening", name="MUAC screening"))
        definition = example(PASSING, name="France's form")
        definition["steps"][1]["form"] = "muac_screening"

        self.assertRefused(self.post(definition), "Unknown forms in this account: muac_screening")

    def test_form_in_several_projects(self):
        # entity types and forms can be shared by several projects
        other_project = m.Project.objects.create(name="Other", app_id="other", account=self.belgium.account)
        other_project.forms.add(*self.belgium.project.forms.all())

        self.assertJSONResponse(self.post(example(PASSING, name="Shared")), status.HTTP_201_CREATED)

    def test_two_forms_with_the_same_form_id(self):
        other_project = m.Project.objects.create(name="Other", app_id="other", account=self.belgium.account)
        other_project.forms.add(create_form("anthropometry"))

        self.assertRefused(
            self.post(example(PASSING, name="Ambiguous")),
            "Several forms of the account have the form_id: anthropometry",
        )

    def test_first_step_is_not_a_registration(self):
        definition = example(PASSING, name="No registration")
        definition["steps"] = definition["steps"][1:]

        self.assertRefused(
            self.post(definition),
            "The first step registers the entity: 'anthropometry' isn't the reference form of an entity type of this account",
        )

    def test_name_too_long(self):
        self.assertRefused(self.post(example(FORM, name="x" * 256)), "name: at most 255 characters")

    def test_duplicate_name(self):
        self.assertRefused(
            self.post(example(PASSING)), "A scenario 'Oedema leads to OTP' already exists in this account"
        )

    def test_name_of_a_deleted_scenario(self):
        self.assertJSONResponse(self.post(example(PASSING, name="Deleted")), status.HTTP_201_CREATED)

    def test_name_used_in_another_account(self):
        self.client.force_authenticate(self.user_france)

        response = self.post(example(FORM))

        self.assertJSONResponse(response, status.HTTP_201_CREATED)


class ScenarioDeleteTestCase(ScenarioAPITestCase):
    def test_delete(self):
        self.assertJSONResponse(self.client.delete(f"{URL}{self.passing.id}/"), status.HTTP_204_NO_CONTENT)

        scenario = m.Scenario.objects_include_deleted.get(id=self.passing.id)
        self.assertIsNotNone(scenario.deleted_at)
        self.assertEqual(scenario.updated_by, self.user)
        modification = Modification.objects.get(
            content_type=ContentType.objects.get_for_model(m.Scenario), object_id=scenario.id
        )
        self.assertEqual((modification.source, modification.user), (SCENARIO_API, self.user))
        self.assertIn("deleted_at", modification.field_diffs()["modified"])

    def test_delete_other_account(self):
        self.assertJSONResponse(self.client.delete(f"{URL}{self.france_scenario.id}/"), status.HTTP_404_NOT_FOUND)

        self.assertTrue(m.Scenario.objects.filter(id=self.france_scenario.id).exists())


class ScenarioSchemaTestCase(ScenarioAPITestCase):
    def test_schema(self):
        data = self.assertJSONResponse(self.client.get(f"{URL}schema/"), status.HTTP_200_OK)

        self.assertEqual(data, json_schema())
