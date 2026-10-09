import datetime
import json
import os

from pydantic import ValidationError

from iaso.scenarios.entities import EntityScenarioRunner
from iaso.scenarios.forms import FormScenarioRunner
from iaso.scenarios.schema import EntityScenario, FormScenario, json_schema, load_scenario
from iaso.tests.scenarios.fixtures import EXAMPLES, NOW, ScenarioExamplesTestCase


class ExamplesTestCase(ScenarioExamplesTestCase):
    """The example files: they all pass, and they are valid scenario files."""

    def test_examples(self):
        """Every examples/scenario-*.json passes, of either kind: a new example is a new file."""
        examples = sorted(name for name in os.listdir(EXAMPLES) if name.startswith("scenario-"))
        self.assertTrue(examples)
        runners = {EntityScenario: EntityScenarioRunner(self.version, now=NOW), FormScenario: FormScenarioRunner()}
        for name in examples:
            with self.subTest(example=name), open(os.path.join(EXAMPLES, name)) as example:
                scenario = load_scenario(example.read())
                result = runners[type(scenario)].run(scenario)
                self.assertTrue(result.passed, "\n".join(result.failures))
                self.assertEqual(len(result.steps), len(scenario.steps))

    def test_step_clock(self):
        with open(os.path.join(EXAMPLES, "scenario-oedema_leads_to_otp.json")) as example:
            scenario = load_scenario(example.read())

        self.assertEqual(scenario.steps[1].at, datetime.datetime(2026, 10, 22, 8, 30, tzinfo=datetime.timezone.utc))

    def test_json_schema_is_up_to_date(self):
        # examples/scenario.schema.json is what editors use ("$schema"): regenerate it when the model changes, with
        # json.dump(iaso.scenarios.schema.json_schema(), file, indent=2)
        with open(os.path.join(EXAMPLES, "scenario.schema.json")) as schema_file:
            self.assertEqual(json.load(schema_file), json_schema())

    def test_answers_are_text(self):
        # in YAML, `oedema: yes` would have been the boolean True and never equal the choice "yes"
        steps = [{"answers": {"first_name": "Luke", "age_months": 11}}]
        scenario = {"kind": "form", "form": "child_registration", "name": "numbers", "steps": steps}
        with self.assertRaises(ValidationError):
            load_scenario(json.dumps(scenario))
        steps[0]["answers"]["age_months"] = True
        with self.assertRaises(ValidationError):
            load_scenario(json.dumps(scenario))

    def test_unknown_key_is_refused(self):
        with self.assertRaises(ValidationError):
            load_scenario(
                json.dumps({"kind": "entity", "name": "typo", "steps": [{"form": "child_registration", "answer": {}}]})
            )

    def test_kind_is_required(self):
        with self.assertRaises(ValidationError):
            load_scenario(json.dumps({"name": "no kind", "steps": []}))
