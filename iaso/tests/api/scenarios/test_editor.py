import datetime

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from lxml import etree
from rest_framework import status

from hat.audit.models import SCENARIO_API, Modification
from iaso import models as m
from iaso.tests.api.scenarios.base import URL, ScenarioAPITestCase
from iaso.tests.scenarios.fixtures import FAILING, PASSING, example


PREVIEW_URL = f"{URL}preview/"
FORMS_URL = f"{URL}forms/"


class ScenarioPreviewTestCase(ScenarioAPITestCase):
    def preview(self, definition, expected_status=status.HTTP_200_OK, **params):
        response = self.client.post(PREVIEW_URL, {"definition": definition, **params}, format="json")
        return self.assertJSONResponse(response, expected_status)

    def assertRefused(self, data, field, message):
        self.assertHasError(data, field)
        self.assertIn(message, " | ".join(data[field]))

    def test_preview(self):
        # the editor, while the first step is being filled: no check yet
        definition = example(PASSING, name="Being written")
        definition["steps"] = [{"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "11"}}]
        scenarios_before = m.Scenario.objects_include_deleted.count()

        data = self.preview(definition)

        self.assertResponseCompliantToSwagger(data, "ScenarioOutcome")
        self.assertEqual(
            (data["id"], data["status"], data["workflow_version_id"]), (None, "passed", self.belgium.version.id)
        )
        step = data["steps"][0]
        self.assertEqual(step["next"]["forms"], ["anthropometry"])
        self.assertEqual(step["profile"]["age_months"], "11")
        self.assertEqual(data["forms"]["child_registration"]["labels"]["age_months"], "Age (months)")
        # nothing saved
        self.assertEqual(m.Scenario.objects_include_deleted.count(), scenarios_before)

    def test_preview_of_a_refused_step(self):
        definition = example(PASSING, name="Refused")
        definition["steps"] = [{"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "130"}}]

        step = self.preview(definition)["steps"][0]

        self.assertEqual(step["status"], "refused")
        self.assertEqual(
            [(problem["path"], problem["code"]) for problem in step["problems"]], [("age_months", "CONSTRAINT")]
        )

    def test_preview_against_a_draft(self):
        draft = m.WorkflowVersion.objects.create(workflow=self.belgium.version.workflow, name="Draft")
        definition = example(PASSING, name="Being written")

        data = self.preview(definition, workflow_version_id=draft.id)

        self.assertEqual(data["workflow_version_id"], draft.id)
        self.assertEqual(data["steps"][0]["next"]["forms"], [])

    def test_preview_of_a_form_scenario(self):
        data = self.preview(example("scenario-form-child_registration.json"))

        self.assertEqual((data["kind"], data["status"], data["workflow_version_id"]), ("form", "passed", None))

    def test_invalid_file(self):
        data = self.preview({"kind": "entity", "name": "No steps key"}, status.HTTP_400_BAD_REQUEST)

        self.assertRefused(data, "definition", "steps: Field required")

    def test_first_step_is_not_a_registration(self):
        definition = example(PASSING, name="No registration")
        definition["steps"] = definition["steps"][1:]

        data = self.preview(definition, status.HTTP_400_BAD_REQUEST)

        self.assertRefused(data, "definition", "'anthropometry' isn't the reference form of an entity type")

    def test_workflow_version_of_another_account(self):
        data = self.preview(example(PASSING), status.HTTP_400_BAD_REQUEST, workflow_version_id=self.france.version.id)

        self.assertRefused(data, "workflow_version_id", "Invalid pk")

    def test_workflow_version_of_another_entity_type(self):
        household = m.EntityType.objects.create(
            name="Household",
            account=self.belgium.account,
            reference_form=self.belgium.project.forms.get(form_id="otp_admission"),
        )
        version = m.WorkflowVersion.objects.create(workflow=m.Workflow.objects.create(entity_type=household))

        data = self.preview(example(PASSING), status.HTTP_400_BAD_REQUEST, workflow_version_id=version.id)

        self.assertRefused(data, "workflow_version_id", "Not a workflow version of 'Child'")

    def test_without_permission(self):
        self.client.force_authenticate(self.user_without_permission)

        self.preview(example(PASSING), status.HTTP_403_FORBIDDEN)


class ScenarioFormsTestCase(ScenarioAPITestCase):
    def forms(self, entity_type, expected_status=status.HTTP_200_OK):
        response = self.client.get(FORMS_URL, {"entity_type_id": entity_type.id} if entity_type else {})
        return self.assertJSONResponse(response, expected_status)

    def test_forms(self):
        data = self.forms(self.belgium.entity_type)

        self.assertResponseCompliantToSwagger(data, "EditorForms")
        # the reference form first, then the forms of the workflow's follow-ups and copy rules
        self.assertEqual(
            [(form["form_id"], form["is_reference"]) for form in data["results"]],
            [("child_registration", True), ("anthropometry", False), ("otp_admission", False)],
        )
        anthropometry = data["results"][1]
        self.assertEqual(anthropometry["name"], "Anthropometry")
        # its id: the follow-up conditions are put in words from the reference form's fields
        self.assertEqual(data["results"][0]["id"], self.belgium.entity_type.reference_form_id)
        # the labels of the hidden questions too: the entity's information shown next to the journey
        self.assertEqual(data["results"][0]["labels"]["oedema_status"], "Oedema status")
        # what a person answers: no calculate (visit_number, _first_name) nor note (child)
        self.assertEqual(
            anthropometry["questions"],
            [
                {
                    "name": "muac",
                    "label": "MUAC (cm)",
                    "type": "decimal",
                    "required": True,
                    "relevant": "",
                    "choices": [],
                },
                {
                    "name": "oedema",
                    "label": "Oedema",
                    "type": "select_one",
                    "required": False,
                    "relevant": "",
                    "choices": [{"name": "yes", "label": "Yes"}, {"name": "no", "label": "No"}],
                },
            ],
        )
        # a read-only question isn't answered: oedema_status is copied from the follow-ups
        registration = data["results"][0]
        self.assertEqual([question["name"] for question in registration["questions"]], ["first_name", "age_months"])

    def test_form_out_of_the_workflow(self):
        self.belgium.project.forms.add(m.Form.objects.create(form_id="muac_screening", name="MUAC screening"))

        data = self.forms(self.belgium.entity_type)

        self.assertNotIn("muac_screening", [form["form_id"] for form in data["results"]])

    def test_entity_type_of_another_account(self):
        data = self.forms(self.france.entity_type, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(data, "entity_type_id")

    def test_entity_type_required(self):
        data = self.forms(None, status.HTTP_400_BAD_REQUEST)

        self.assertHasError(data, "entity_type_id")


class ScenarioUpdateTestCase(ScenarioAPITestCase):
    def patch(self, scenario, definition):
        return self.client.patch(f"{URL}{scenario.id}/", {"definition": definition}, format="json")

    def test_update(self):
        self.passing.last_run_at, self.passing.last_run_status = timezone.now(), m.ScenarioStatus.PASSED
        self.passing.last_run_result = {"status": "passed"}
        self.passing.save()
        definition = example(PASSING, name="Oedema at 11 months leads to OTP", description="Edited")

        data = self.assertJSONResponse(self.patch(self.passing, definition), status.HTTP_200_OK)

        self.assertResponseCompliantToSwagger(data, "ScenarioDetail")
        self.passing.refresh_from_db()
        self.assertEqual(
            (self.passing.name, self.passing.description, self.passing.definition),
            ("Oedema at 11 months leads to OTP", "Edited", definition),
        )
        self.assertEqual(self.passing.updated_by, self.user)
        # the last result was for the previous file
        self.assertEqual(
            (self.passing.last_run_at, self.passing.last_run_status, self.passing.last_run_result), (None, "", None)
        )
        modification = Modification.objects.get(
            content_type=ContentType.objects.get_for_model(m.Scenario), object_id=self.passing.id
        )
        self.assertEqual((modification.source, modification.user), (SCENARIO_API, self.user))
        self.assertIn("name", modification.field_diffs()["modified"])

    def test_keep_its_name(self):
        self.assertJSONResponse(self.patch(self.passing, example(PASSING, description="Edited")), status.HTTP_200_OK)

    def test_name_of_another_scenario(self):
        response = self.patch(self.passing, example(FAILING))

        data = self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(data, "definition")
        self.assertIn("A scenario 'Oedema forgotten: OTP isn't offered' already exists", " | ".join(data["definition"]))
        self.passing.refresh_from_db()
        self.assertEqual(self.passing.name, "Oedema leads to OTP")

    def test_scenario_of_another_account(self):
        self.assertJSONResponse(self.patch(self.france_scenario, example(PASSING)), status.HTTP_404_NOT_FOUND)

    def test_without_permission(self):
        self.client.force_authenticate(self.user_without_permission)

        self.assertJSONResponse(self.patch(self.passing, example(PASSING)), status.HTTP_403_FORBIDDEN)


class ScenarioPrepareStepTestCase(ScenarioAPITestCase):
    def prepare(self, steps, form, expected_status=status.HTTP_200_OK, **params):
        definition = {"kind": "entity", "name": "Being written", "steps": steps}
        response = self.client.post(
            f"{URL}prepare_step/", {"definition": definition, "form": form, **params}, format="json"
        )
        return self.assertJSONResponse(response, expected_status)

    def instance_value(self, xform, name):
        """The default answer of a question in the XForm's primary instance."""
        root = etree.fromstring(xform.encode("utf-8"))
        model = root.find("{http://www.w3.org/1999/xhtml}head/{http://www.w3.org/2002/xforms}model")
        instance = next(
            child for child in model if etree.QName(child.tag).localname == "instance" and not child.get("id")
        )
        return next(element.text for element in instance.iter() if etree.QName(element.tag).localname == name)

    def test_first_step(self):
        data = self.prepare([], "child_registration")

        self.assertResponseCompliantToSwagger(data, "ScenarioStepPrepareResponse")
        # the app offers the registration form only
        self.assertEqual(
            (data["form"], data["offered"], data["prefilled"]), ("child_registration", ["child_registration"], {})
        )
        self.assertIsNone(self.instance_value(data["xform"], "first_name"))

    def test_next_step_is_prefilled_from_the_entity(self):
        steps = [{"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "11"}}]

        data = self.prepare(steps, "anthropometry")

        self.assertEqual(data["offered"], ["anthropometry"])
        self.assertEqual(data["prefilled"], {"_first_name": "Amina", "_visits__int__": "0"})
        # the entity's information at that point, shown next to the journey
        self.assertEqual(data["profile"]["first_name"], "Amina")
        self.assertEqual(data["profile"]["age_months"], "11")
        self.assertEqual(self.instance_value(data["xform"], "_first_name"), "Amina")

    def test_first_form_offered_by_default(self):
        steps = [{"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "11"}}]

        data = self.prepare(steps, None)

        self.assertEqual((data["form"], data["offered"]), ("anthropometry", ["anthropometry"]))
        self.assertEqual(self.instance_value(data["xform"], "_first_name"), "Amina")

    def test_nothing_offered(self):
        # a draft without follow-ups: the app offers nothing after the registration
        draft = m.WorkflowVersion.objects.create(workflow=self.belgium.version.workflow, name="Draft")
        steps = [{"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "11"}}]

        data = self.prepare(steps, None, workflow_version_id=draft.id)

        self.assertResponseCompliantToSwagger(data, "ScenarioStepPrepareResponse")
        self.assertEqual(
            data,
            {
                "form": None,
                "xform": None,
                "prefilled": {},
                "offered": [],
                "next": {"forms": [], "followups": []},
                "profile": {"first_name": "Amina", "age_months": "11", "visits__int__": "0"},
                "search": None,
            },
        )

    def test_follow_ups_as_the_app_evaluates_them(self):
        # what offers a form or not at that point: shown when a step fills a form not offered
        steps = [{"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "11"}}]

        data = self.prepare(steps, "otp_admission")

        self.assertResponseCompliantToSwagger(data, "ScenarioStepPrepareResponse")
        self.assertEqual(data["offered"], ["anthropometry"])
        self.assertEqual(data["next"]["forms"], ["anthropometry"])
        self.assertEqual(
            [(followup["forms"], followup["value"], followup["read"]) for followup in data["next"]["followups"]],
            [(["anthropometry"], True, {}), (["otp_admission"], False, {"oedema_status": None, "age_months": 11})],
        )

    def test_first_step_has_no_follow_ups(self):
        data = self.prepare([], "child_registration")

        self.assertEqual((data["next"], data["profile"]), (None, {}))

    def test_editing_a_step_keeps_its_answers(self):
        data = self.prepare([], "child_registration", answers={"first_name": "Jules", "age_months": "30"})

        self.assertEqual(self.instance_value(data["xform"], "first_name"), "Jules")
        self.assertEqual(self.instance_value(data["xform"], "age_months"), "30")

    def test_unknown_form(self):
        steps = [{"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "11"}}]

        data = self.prepare(steps, "muac_screening", status.HTTP_400_BAD_REQUEST)

        self.assertHasError(data, "form", "No form 'muac_screening' (or it has no version)")

    def test_first_step_is_not_a_registration(self):
        data = self.prepare([], "anthropometry", status.HTTP_400_BAD_REQUEST)

        self.assertHasError(data, "definition")
        self.assertIn("'anthropometry' isn't the reference form of an entity type", " | ".join(data["definition"]))

    def search_on_first_name(self, prevent_add=True):
        entity_type = self.belgium.entity_type
        entity_type.fields_duplicate_search = ["first_name", "not_a_question"]
        entity_type.prevent_add_if_duplicate_found = prevent_add
        entity_type.save()

    def test_registration_asks_the_search_first(self):
        self.search_on_first_name()

        data = self.prepare([], "child_registration")

        self.assertResponseCompliantToSwagger(data, "ScenarioStepPrepareResponse")
        # the questions of the form only, as the app
        self.assertEqual(
            data["search"], {"questions": [{"name": "first_name", "label": "First name"}], "prevent_add": True}
        )

    def test_search_prefills_the_registration(self):
        self.search_on_first_name(prevent_add=False)

        data = self.prepare([], "child_registration", search={"first_name": " Amina "})

        self.assertEqual(data["search"]["prevent_add"], False)
        self.assertEqual(data["prefilled"], {"first_name": "Amina"})
        self.assertEqual(self.instance_value(data["xform"], "first_name"), "Amina")
        # not the entity's information yet: not registered
        self.assertEqual(data["profile"], {})

    def test_no_search_configured(self):
        data = self.prepare([], "child_registration", search={"first_name": "Amina"})

        self.assertEqual(data["search"], {"questions": [], "prevent_add": False})
        self.assertEqual(data["prefilled"], {})

    def test_no_search_after_registering(self):
        self.search_on_first_name()
        steps = [{"form": "child_registration", "search": {"first_name": "Amina"}, "answers": {"age_months": "11"}}]

        data = self.prepare(steps, "anthropometry", search={"first_name": "Jules"})

        self.assertIsNone(data["search"])
        self.assertEqual(data["prefilled"], {"_first_name": "Amina", "_visits__int__": "0"})

    def test_offered_on_the_steps_day(self):
        # OTP admission offered from July 1st: the app evaluates the follow-ups when the entity is opened
        july_1st = int(datetime.datetime(2026, 7, 1, tzinfo=datetime.timezone.utc).timestamp() * 1000)
        followup = m.WorkflowFollowup.objects.create(
            workflow_version=self.belgium.version,
            order=3,
            condition={">=": [{"var": "current_date"}, july_1st]},
        )
        followup.forms.add(self.belgium.project.forms.get(form_id="otp_admission"))
        steps = [{"form": "child_registration", "answers": {"first_name": "Amina", "age_months": "11"}}]

        june = self.prepare(steps, None, at="2026-06-15T09:00:00Z")
        july = self.prepare(steps, None, at="2026-07-15T09:00:00Z")

        self.assertEqual(june["offered"], ["anthropometry"])
        self.assertEqual(july["offered"], ["anthropometry", "otp_admission"])
