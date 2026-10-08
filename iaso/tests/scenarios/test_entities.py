from iaso.models.workflow import WorkflowFollowup
from iaso.scenarios.entities import EntityScenarioRunner
from iaso.scenarios.schema import EntityScenario
from iaso.tests.scenarios.fixtures import NOW, ScenarioExamplesTestCase


class EntityScenarioRunnerTestCase(ScenarioExamplesTestCase):
    def run_scenario(self, steps):
        return EntityScenarioRunner(self.version, now=NOW).run(
            EntityScenario.model_validate({"name": "test", "steps": steps})
        )

    def registration(self, **expect):
        return {
            "form": "child_registration",
            "answers": {"first_name": "Luke", "age_months": "11"},
            "expect": expect,
        }

    def test_oedema_leads_to_otp(self):
        result = self.run_scenario(
            [
                self.registration(next_forms=["anthropometry"]),
                {
                    "form": "anthropometry",
                    "description": "Back 2 weeks later with swelling on both feet",
                    "answers": {"muac": "12.0", "oedema": "yes"},
                    "expect": {
                        "submission": {"muac": "12.0", "visit_number": "1"},
                        "next_forms": ["anthropometry", "otp_admission"],
                        "attributes": {"oedema_status": "yes", "last_muac": "12.0", "visits__int__": "1"},
                    },
                },
            ]
        )

        self.assertTrue(result.passed, result.failures)
        anthropometry = result.steps[1]
        self.assertEqual(anthropometry.prefilled, {"_first_name": "Luke", "_visits__int__": "0"})
        # visit_number is computed by the form: coalesce(${_visits__int__}, 0) + 1, from the prefilled profile value
        self.assertEqual(
            [(change.source, change.target, change.before, change.after) for change in anthropometry.changes],
            [
                ("muac", "last_muac", None, "12.0"),
                ("oedema", "oedema_status", None, "yes"),
                ("visit_number", "visits__int__", "0", "1"),
            ],
        )
        # known gap (form_engine): loading recomputes the calculates, the prefilled _first_name gets its calculation
        # (''), on the device it would stay "Luke"
        self.assertIsNone(anthropometry.submission["_first_name"])
        oedema_followup = anthropometry.next.followups[1].result
        self.assertEqual(oedema_followup.read, {"oedema_status": "yes", "age_months": 11})

    def test_failed_expectation_explains(self):
        result = self.run_scenario(
            [
                self.registration(),
                {
                    "form": "anthropometry",
                    "answers": {"muac": "12.0", "oedema": "no"},
                    "expect": {
                        "next_forms": ["anthropometry", "otp_admission"],
                        "attributes": {"oedema_status": "yes"},
                    },
                },
            ]
        )

        self.assertFalse(result.passed)
        self.assertEqual(result.steps[1].status, "failed")
        failures = "\n".join(result.failures)
        self.assertIn(
            "Forms offered next should be ['anthropometry', 'otp_admission'], were ['anthropometry']", failures
        )
        self.assertIn('{"oedema_status": "no", "age_months": 11}', failures)
        self.assertIn("'oedema_status' should be 'yes', was 'no' (copied from 'oedema')", failures)

    def test_form_not_offered_stops_the_scenario(self):
        result = self.run_scenario(
            [
                self.registration(),
                {"form": "otp_admission", "answers": {"admitted": "yes"}},
                {"form": "anthropometry", "answers": {"muac": "12.0"}},
            ]
        )

        self.assertEqual([step.status for step in result.steps], ["ok", "not_offered"])
        self.assertIn("'otp_admission' isn't offered, the app offers ['anthropometry']", result.failures[0])

    def test_constraint_refuses_an_age_over_120_months(self):
        result = self.run_scenario(
            [
                {
                    "form": "child_registration",
                    "answers": {"first_name": "Luke", "age_months": "130"},
                    "expect": {"refused": [{"question": "age_months", "code": "CONSTRAINT"}]},
                },
            ]
        )

        self.assertTrue(result.passed, result.failures)
        self.assertEqual(
            [(p.path, p.code, p.answer) for p in result.steps[0].problems], [("age_months", "CONSTRAINT", "130")]
        )
        self.assertEqual(result.steps[0].profile, {})  # nothing saved

    def test_unexpected_refusal_stops_the_scenario(self):
        result = self.run_scenario(
            [
                self.registration(),
                {"form": "anthropometry", "answers": {"muac": "-1"}},
                {"form": "anthropometry", "answers": {"muac": "12.0"}},
            ]
        )

        self.assertEqual([step.status for step in result.steps], ["ok", "refused"])
        self.assertIn("muac: CONSTRAINT - Answer is violating a constraint (answer: '-1.0')", result.failures[0])

    def test_expected_refusal_that_does_not_happen(self):
        result = self.run_scenario(
            [
                {
                    "form": "child_registration",
                    "answers": {"first_name": "Luke", "age_months": "119"},
                    "expect": {"refused": [{"question": "age_months", "code": "CONSTRAINT"}]},
                },
            ]
        )

        self.assertEqual(result.steps[0].status, "failed")
        self.assertIn("The form should refuse ['age_months: CONSTRAINT'], it accepts the answers", result.failures[0])

    def test_required_question_and_calculates(self):
        result = self.run_scenario(
            [
                {"form": "child_registration", "answers": {"first_name": "Luke", "visits__int__": "3"}},
            ]
        )

        self.assertEqual(result.steps[0].status, "refused")
        self.assertEqual(
            sorted((p.path, p.code) for p in result.steps[0].problems),
            [("age_months", "REQUIRED"), ("visits__int__", "NOT_A_QUESTION")],
        )

    def test_unknown_question(self):
        result = self.run_scenario(
            [
                {"form": "child_registration", "answers": {"first_name": "Luke", "agemonths": "11"}},
            ]
        )

        self.assertEqual(result.steps[0].status, "refused")
        self.assertIn("agemonths: UNKNOWN_QUESTION", result.failures[0])

    def test_condition_the_app_cannot_evaluate(self):
        broken = WorkflowFollowup.objects.create(workflow_version=self.version, order=3)  # condition defaults to {}

        result = self.run_scenario([self.registration()])

        self.assertEqual(result.steps[0].status, "error")
        self.assertIn(f"Followup {broken.id} (order 3)", result.failures[0])
        self.assertIn("objects must have exactly 1 key defined", result.failures[0])
