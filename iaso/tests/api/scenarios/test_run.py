from django.test import override_settings
from rest_framework import status

from iaso import models as m
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.tests.api.scenarios.base import RUN_URL, ScenarioAPITestCase
from iaso.tests.scenarios.fixtures import create_form


class ScenarioRunTestCase(ScenarioAPITestCase):
    def run_scenarios(self, *scenarios, expected_status=status.HTTP_200_OK, **params):
        body = {"scenario_ids": [scenario.id for scenario in scenarios], **params}
        return self.assertJSONResponse(self.client.post(RUN_URL, body, format="json"), expected_status)

    def assertRefused(self, data, field, message):
        self.assertHasError(data, field)
        self.assertIn(message, " | ".join(data[field]))

    def test_run(self):
        entities_before, instances_before = m.Entity.objects.count(), m.Instance.objects.count()

        data = self.run_scenarios(self.failing, self.passing, self.form_scenario)

        self.assertResponseCompliantToSwagger(data, "ScenarioRunResponse")
        failing, passing, form_scenario = data["results"]
        self.assertEqual(
            [(result["id"], result["status"], result["failed_step"]) for result in data["results"]],
            [
                (self.failing.id, "failed", 2),
                (self.passing.id, "passed", None),
                (self.form_scenario.id, "passed", None),
            ],
        )
        self.assertEqual(passing["workflow_version_id"], self.belgium.version.id)
        self.assertIsNone(form_scenario["workflow_version_id"])
        # nothing saved but the results
        self.assertEqual((m.Entity.objects.count(), m.Instance.objects.count()), (entities_before, instances_before))

        # the forms filled and offered, with their labels: the page shows labels, not names
        self.assertEqual(sorted(failing["forms"]), ["anthropometry", "child_registration", "otp_admission"])
        self.assertEqual(failing["forms"]["anthropometry"]["name"], "Anthropometry")
        self.assertEqual(failing["forms"]["anthropometry"]["labels"]["muac"], "MUAC (cm)")
        self.assertNotIn("visit_number", failing["forms"]["anthropometry"]["labels"])  # a calculate has no label
        self.assertEqual(list(form_scenario["forms"]), ["child_registration"])

        # the failing step, explained
        step = failing["steps"][1]
        self.assertEqual(step["at"], "2026-10-22T08:30:00Z")
        self.assertEqual((step["index"], step["form"], step["status"]), (2, "anthropometry", "failed"))
        self.assertIn("'oedema_status' should be 'yes', was 'no' (copied from 'oedema')", step["failures"])
        self.assertEqual(step["answers"], {"muac": "12.0", "oedema": "no"})
        self.assertEqual(step["prefilled"], {"_first_name": "Amina", "_visits__int__": "0"})
        self.assertEqual(step["submission"]["oedema"], "no")
        self.assertIn({"source": "oedema", "target": "oedema_status", "before": None, "after": "no"}, step["changes"])
        self.assertEqual(step["profile"]["oedema_status"], "no")
        self.assertEqual(step["next"]["forms"], ["anthropometry"])
        oedema_followup = step["next"]["followups"][1]
        self.assertEqual(
            (oedema_followup["read"], oedema_followup["value"], oedema_followup["error"], oedema_followup["forms"]),
            ({"oedema_status": "no", "age_months": 11}, False, None, ["otp_admission"]),
        )
        # a failed check doesn't stop the scenario; a form the app wouldn't offer does
        self.assertEqual([step["status"] for step in failing["steps"]], ["ok", "failed", "not_offered"])
        # form scenario steps: the scenario's form, no entity parts
        self.assertEqual(form_scenario["steps"][0]["form"], "child_registration")
        self.assertNotIn("profile", form_scenario["steps"][0])
        self.assertIsNone(form_scenario["steps"][0]["at"])

    def test_last_run_is_kept(self):
        data = self.run_scenarios(self.failing, self.form_scenario)

        self.failing.refresh_from_db()
        self.form_scenario.refresh_from_db()
        self.assertEqual(self.failing.last_run_status, m.ScenarioStatus.FAILED)
        self.assertEqual(self.failing.last_run_workflow_version, self.belgium.version)
        self.assertIsNotNone(self.failing.last_run_at)
        self.assertEqual(self.failing.last_run_result, data["results"][0])
        self.assertEqual(
            (self.form_scenario.last_run_status, self.form_scenario.last_run_workflow_version),
            (m.ScenarioStatus.PASSED, None),
        )
        # untouched: not run
        self.passing.refresh_from_db()
        self.assertIsNone(self.passing.last_run_at)

    def test_draft_version(self):
        # a draft without followups: nothing is offered after registration
        draft = m.WorkflowVersion.objects.create(workflow=self.belgium.version.workflow, name="Draft")

        data = self.run_scenarios(self.passing, workflow_version_id=draft.id)

        result = data["results"][0]
        self.assertEqual((result["status"], result["workflow_version_id"]), ("failed", draft.id))
        self.assertIn("Forms offered next should be ['anthropometry'], were []", result["failures"][0])

    def test_no_published_version(self):
        self.belgium.version.status = WorkflowVersionsStatus.DRAFT
        self.belgium.version.save()

        result = self.run_scenarios(self.passing)["results"][0]

        self.assertEqual(
            (result["status"], result["failures"]), ("error", ["'Child' has no published workflow version"])
        )

    def test_definition_to_update(self):
        self.passing.definition["format"] = "iaso-scenarios/0"
        self.passing.save()

        result = self.run_scenarios(self.passing)["results"][0]

        self.assertEqual((result["status"], result["steps"]), ("error", []))
        self.assertIn("This scenario file needs updating", result["failures"][0])

    def test_form_id_used_twice_since_import(self):
        other_project = m.Project.objects.create(name="Other", app_id="other", account=self.belgium.account)
        other_project.forms.add(create_form("anthropometry"))

        result = self.run_scenarios(self.passing)["results"][0]

        self.assertEqual((result["status"], result["failed_step"]), ("error", 2))
        self.assertIn("Several forms of the account have the form_id 'anthropometry'", result["failures"][0])

    @override_settings(ODK_CLI_PATH="/nonexistent/odk_cli")
    def test_form_engine_missing(self):
        result = self.run_scenarios(self.passing)["results"][0]

        self.assertEqual((result["status"], result["failed_step"]), ("error", 1))
        self.assertIn("odk_cli isn't installed", result["failures"][0])

    def test_order_asked_and_duplicates(self):
        body = {"scenario_ids": [self.form_scenario.id, self.passing.id, self.form_scenario.id]}

        data = self.assertJSONResponse(self.client.post(RUN_URL, body, format="json"), status.HTTP_200_OK)

        self.assertEqual([result["id"] for result in data["results"]], [self.form_scenario.id, self.passing.id])

    def test_scenario_of_another_account_or_deleted(self):
        for scenario in (self.france_scenario, self.deleted):
            with self.subTest(scenario=scenario.name):
                data = self.run_scenarios(self.passing, scenario, expected_status=status.HTTP_400_BAD_REQUEST)

                self.assertRefused(data, "scenario_ids", f"Unknown scenarios: {scenario.id}")
        self.passing.refresh_from_db()
        self.assertIsNone(self.passing.last_run_at)

    def test_no_scenario(self):
        data = self.run_scenarios(expected_status=status.HTTP_400_BAD_REQUEST)

        self.assertHasError(data, "scenario_ids")

    def test_workflow_version_of_another_account(self):
        data = self.run_scenarios(
            self.passing, workflow_version_id=self.france.version.id, expected_status=status.HTTP_400_BAD_REQUEST
        )

        self.assertRefused(data, "workflow_version_id", "Invalid pk")

    def test_workflow_version_of_another_entity_type(self):
        household = m.EntityType.objects.create(
            name="Household",
            account=self.belgium.account,
            reference_form=self.belgium.project.forms.get(form_id="otp_admission"),
        )
        household_version = m.WorkflowVersion.objects.create(workflow=m.Workflow.objects.create(entity_type=household))

        data = self.run_scenarios(
            self.passing,
            self.form_scenario,
            workflow_version_id=household_version.id,
            expected_status=status.HTTP_400_BAD_REQUEST,
        )

        self.assertRefused(
            data, "workflow_version_id", "Not a workflow version of the entity type of: Oedema leads to OTP"
        )

    @override_settings(SCENARIOS_SYNC_MAX_STEPS=5)
    def test_too_many_steps(self):
        # 3 + 3 steps
        data = self.run_scenarios(self.passing, self.failing, expected_status=status.HTTP_400_BAD_REQUEST)

        self.assertRefused(data, "scenario_ids", "6 steps, at most 5: run fewer scenarios")

    @override_settings(SCENARIOS_SYNC_MAX_STEPS=6)
    def test_as_many_steps_as_allowed(self):
        self.run_scenarios(self.passing, self.failing)

    def test_without_permission(self):
        self.client.force_authenticate(self.user_without_permission)

        self.run_scenarios(self.passing, expected_status=status.HTTP_403_FORBIDDEN)
