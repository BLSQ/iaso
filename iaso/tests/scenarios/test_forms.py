from iaso.scenarios.forms import FormScenarioRunner
from iaso.scenarios.schema import FormScenario
from iaso.tests.scenarios.fixtures import ScenarioExamplesTestCase


class FormScenarioRunnerTestCase(ScenarioExamplesTestCase):
    def run_scenario(self, form, steps, **scenario):
        return FormScenarioRunner().run(
            FormScenario.model_validate({"name": "test", "form": form, "steps": steps, **scenario})
        )

    def test_steps_are_independent(self):
        # a refusal doesn't stop the scenario: each step fills the form anew
        result = self.run_scenario(
            "child_registration",
            [
                {"answers": {"first_name": "Luke", "age_months": "130"}},
                {"answers": {"first_name": "Luke", "age_months": "11"}, "expect": {"submission": {"age_months": "11"}}},
            ],
        )

        self.assertFalse(result.passed)
        self.assertEqual([step.status for step in result.steps], ["refused", "ok"])
        self.assertIn("age_months: CONSTRAINT - Answer is violating a constraint (answer: '130')", result.failures[0])

    def test_calculate(self):
        result = self.run_scenario(
            "anthropometry",
            [{"answers": {"muac": "12.5"}, "expect": {"submission": {"muac": "12.5", "visit_number": "2"}}}],
        )

        self.assertFalse(result.passed)
        self.assertEqual(result.failures, ["Step 1: 'visit_number' should be '2' in the form, was '1'"])

    def test_context_fills_the_questions_of_the_same_name(self):
        # as the app does with the org unit (current_ou_id...); a name the form doesn't have is ignored
        result = self.run_scenario(
            "anthropometry",
            [{"answers": {"muac": "12"}, "context": {"_visits__int__": "4", "unknown": "x"}}],
        )

        self.assertTrue(result.passed, result.failures)
        self.assertEqual(result.steps[0].prefilled, {"_visits__int__": "4"})
        # known gap (form_engine): loading the form recomputes its calculates, _visits__int__ is back to its
        # calculation (0) - on the device it would stay 4 and visit_number be 5; `odk_cli new` will fix it
        self.assertEqual(result.steps[0].submission["visit_number"], "1")

    def test_unknown_form(self):
        result = self.run_scenario("nothing", [{"answers": {}}])

        self.assertEqual(result.steps[0].status, "error")
        self.assertIn("No form 'nothing'", result.failures[0])
