from django.test import override_settings
from lxml import etree

from iaso import models as m
from iaso.models import ScenarioStatus, StepStatus
from iaso.scenarios import form_engine
from iaso.scenarios.forms import FormScenarioRunner, FormSource, _label
from iaso.scenarios.schema import FormScenario
from iaso.tests.scenarios.fixtures import ScenarioExamplesTestCase, create_form, create_nutrition_setup


class FormScenarioRunnerTestCase(ScenarioExamplesTestCase):
    def run_scenario(self, form, steps, **scenario):
        return FormScenarioRunner(self.form_source()).run(
            FormScenario.model_validate({"name": "test", "form": form, "steps": steps, **scenario})
        )

    def test_steps_are_independent(self):
        # a refusal doesn't stop the scenario: each step fills the form anew
        result = self.run_scenario(
            "child_registration",
            [
                {"answers": {"first_name": "Amina", "age_months": "130"}},
                {
                    "answers": {"first_name": "Amina", "age_months": "11"},
                    "expect": {"submission": {"age_months": "11"}},
                },
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
        # prefilled after the form is loaded, as on the device: _visits__int__ stays 4, visit_number follows
        self.assertEqual(result.steps[0].submission["_visits__int__"], "4")
        self.assertEqual(result.steps[0].submission["visit_number"], "5")

    def test_unknown_form(self):
        result = self.run_scenario("nothing", [{"answers": {}}])

        self.assertEqual(result.steps[0].status, "error")
        self.assertIn("No form 'nothing'", result.failures[0])

    @override_settings(ODK_CLI_PATH="/nonexistent/odk_cli")
    def test_form_engine_missing(self):
        result = self.run_scenario("child_registration", [{"answers": {"first_name": "Amina", "age_months": "11"}}])

        self.assertEqual(result.steps[0].status, StepStatus.ERROR)
        self.assertEqual(result.status, ScenarioStatus.ERROR)
        self.assertIn("odk_cli isn't installed (/nonexistent/odk_cli)", result.failures[0])

    def test_status(self):
        passing = self.run_scenario("child_registration", [{"answers": {"first_name": "Amina", "age_months": "11"}}])
        failing = self.run_scenario(
            "child_registration",
            [
                {"answers": {"first_name": "Amina", "age_months": "11"}},
                {
                    "answers": {"first_name": "Amina", "age_months": "11"},
                    "expect": {"submission": {"age_months": "12"}},
                },
            ],
        )

        self.assertEqual((passing.status, passing.failed_step), (ScenarioStatus.PASSED, None))
        self.assertEqual((failing.status, failing.failed_step), (ScenarioStatus.FAILED, 2))


class FormSourceTestCase(ScenarioExamplesTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.france = create_nutrition_setup("France")

    def test_form_of_the_account(self):
        # both accounts have a form "anthropometry": each account sees its own
        belgium_form = self.project.forms.get(form_id="anthropometry")
        france_form = self.france.project.forms.get(form_id="anthropometry")

        self.assertEqual(FormSource(self.setup.account).version("anthropometry").form, belgium_form)
        self.assertEqual(FormSource(self.france.account).version("anthropometry").form, france_form)

    def test_form_shared_by_projects(self):
        # one form in two projects of the account: one form, not two
        other_project = m.Project.objects.create(name="Other", app_id="other", account=self.setup.account)
        form = self.project.forms.get(form_id="anthropometry")
        other_project.forms.add(form)

        self.assertEqual(FormSource(self.setup.account).version("anthropometry").form, form)

    def test_two_forms_with_the_same_form_id(self):
        other_project = m.Project.objects.create(name="Other", app_id="other", account=self.setup.account)
        other_form = create_form("anthropometry")
        other_project.forms.add(other_form)
        source = FormSource(self.setup.account)

        self.assertIsNone(source.version("anthropometry"))
        self.assertEqual(source.questions("anthropometry"), {})
        form = self.project.forms.get(form_id="anthropometry")
        self.assertEqual(
            source.not_found("anthropometry"),
            f"Several forms of the account have the form_id 'anthropometry': 'Anthropometry' (#{form.id}) and "
            f"'Anthropometry' (#{other_form.id})",
        )

    def test_form_of_no_project(self):
        # a form of the account's forms only through its projects
        m.Form.objects.create(form_id="muac_screening", name="MUAC screening")

        self.assertIsNone(FormSource(self.setup.account).version("muac_screening"))

    def test_deleted_form(self):
        self.project.forms.get(form_id="anthropometry").delete()

        self.assertIsNone(FormSource(self.setup.account).version("anthropometry"))

    def test_latest_version(self):
        form = self.project.forms.get(form_id="anthropometry")
        first = form.form_versions.get()
        latest = m.FormVersion.objects.create(form=form, version_id="2", file=first.file)

        self.assertEqual(FormSource(self.setup.account).version("anthropometry"), latest)

    def test_describe(self):
        source = FormSource(self.setup.account)

        self.assertEqual(
            source.describe("anthropometry"),
            {
                "name": "Anthropometry",
                "labels": {"child": "Child: ${_first_name}", "muac": "MUAC (cm)", "oedema": "Oedema"},
            },
        )
        self.assertEqual(source.describe("muac_screening"), {"name": "", "labels": {}})

    def test_label_of_a_multilingual_form(self):
        self.assertEqual(_label({"English (en)": "MUAC (cm)", "French (fr)": "PB (cm)"}), "MUAC (cm)")
        self.assertEqual(_label({"English (en)": ""}), "")
        self.assertEqual(_label(None), "")


class FormEngineDefaultsTestCase(ScenarioExamplesTestCase):
    def test_with_defaults(self):
        xform = FormSource(self.setup.account).xform("child_registration")

        filled = form_engine.with_defaults(xform, {"first_name": "Amina", "not_a_question": "x"})

        instance = form_engine.blank_instance(filled)
        values = {etree.QName(element.tag).localname: element.text for _, element in form_engine.leaves(instance)}
        self.assertEqual(values["first_name"], "Amina")
        self.assertIsNone(values["age_months"])
        self.assertNotIn("not_a_question", values)
