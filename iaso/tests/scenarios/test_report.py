import os

from iaso.scenarios.entities import EntityScenarioRunner
from iaso.scenarios.forms import FormScenarioRunner
from iaso.scenarios.report import markdown_report
from iaso.scenarios.schema import EntityScenario, FormScenario, load_scenario
from iaso.tests.scenarios.fixtures import EXAMPLES, NOW, ScenarioExamplesTestCase


FAILING = os.path.join(EXAMPLES, "failing")


class ReportTestCase(ScenarioExamplesTestCase):
    """The markdown report on the examples and on examples/failing/ (scenarios failing on purpose, to see what a
    failure looks like). SCENARIO_REPORT=<path> writes it to a file:

        docker compose run --rm -e SCENARIO_REPORT=/opt/app/media/scenario-report.md iaso \\
            python manage.py test iaso.tests.scenarios.test_report --keepdb
    """

    def run_directory(self, directory):
        runners = {EntityScenario: EntityScenarioRunner(self.version, now=NOW), FormScenario: FormScenarioRunner()}
        results = []
        for name in sorted(os.listdir(directory)):
            if name.startswith("scenario-"):
                with open(os.path.join(directory, name)) as example:
                    scenario = load_scenario(example.read())
                results.append(runners[type(scenario)].run(scenario))
        return results

    def test_report(self):
        failing = self.run_directory(FAILING)
        self.assertTrue(failing)
        self.assertFalse(any(result.passed for result in failing))

        report = markdown_report(failing + self.run_directory(EXAMPLES), now=NOW)

        self.assertIn("6 scenarios · 3 passed · **3 failed**", report)
        # an expectation on the forms offered: each followup with its condition and the values it read
        self.assertIn("Forms offered next should be ['anthropometry', 'otp_admission'], were ['anthropometry']", report)
        self.assertIn(
            '`{"and": [{"==": [{"var": "oedema_status"}, "yes"]}, {"<": [{"var": "age_months"}, 60]}]}`', report
        )
        self.assertIn("`oedema_status` = `no`, `age_months` = `11`", report)
        # an expectation on the profile, with where the value comes from
        self.assertIn("'oedema_status' should be 'yes', was 'no' (copied from 'oedema')", report)
        # a form not offered, the next steps not run
        self.assertIn("'otp_admission' isn't offered, the app offers ['anthropometry']", report)
        self.assertIn("**Forms offered at this point**", report)
        self.assertIn("`oedema_status` = *empty*, `age_months` = `30`", report)
        self.assertIn("### Step 3 · `anthropometry` — not run", report)
        # form logic: a calculate, a refusal, a refusal that doesn't happen
        self.assertIn("'visit_number' should be '2' in the form, was '1'", report)
        self.assertIn("| `muac` | CONSTRAINT | Answer is violating a constraint | `0.0` |", report)
        self.assertIn("The form should refuse ['muac: CONSTRAINT'], it accepts the answers", report)

        path = os.environ.get("SCENARIO_REPORT")
        if path:
            with open(path, "w") as report_file:
                report_file.write(report)
