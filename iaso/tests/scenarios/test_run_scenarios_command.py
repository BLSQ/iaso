import os
import tempfile

from io import StringIO

from django.core.management import CommandError, call_command

from iaso import models as m
from iaso.tests.scenarios.fixtures import (
    FAILING,
    FORM,
    PASSING,
    ScenarioExamplesTestCase,
    create_nutrition_setup,
    create_scenario,
)


class RunScenariosCommandTestCase(ScenarioExamplesTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.passing = create_scenario(cls.setup, PASSING)
        cls.form_scenario = create_scenario(cls.setup, FORM)
        cls.france = create_nutrition_setup("France")
        cls.france_failing = create_scenario(cls.france, FAILING)

    def run_command(self, **options):
        out = StringIO()
        call_command("run_scenarios", stdout=out, **options)
        return out.getvalue()

    def test_passing(self):
        output = self.run_command(account=self.setup.account.id, verbosity=1)

        # Belgium's only
        self.assertEqual(
            output.splitlines(),
            [
                f"passed  Oedema leads to OTP (#{self.passing.id})",
                f"passed  Child registration form (#{self.form_scenario.id})",
                "2 scenarios, 2 passed",
            ],
        )
        # read-only
        self.passing.refresh_from_db()
        self.assertIsNone(self.passing.last_run_at)

    def test_failing(self):
        out = StringIO()

        with self.assertRaisesMessage(CommandError, "1 scenario(s) didn't pass"):
            call_command("run_scenarios", account=self.france.account.id, verbosity=2, stdout=out)

        self.assertIn(f"failed  Oedema forgotten: OTP isn't offered (#{self.france_failing.id})", out.getvalue())
        self.assertIn("Step 2: 'oedema_status' should be 'yes', was 'no' (copied from 'oedema')", out.getvalue())

    def test_workflow_version(self):
        draft = m.WorkflowVersion.objects.create(workflow=self.version.workflow, name="Draft")

        with self.assertRaisesMessage(CommandError, "1 scenario(s) didn't pass"):
            # the entity scenarios of the version's entity type only: not the form scenario
            self.run_command(account=self.setup.account.id, workflow_version=draft.id, verbosity=0)

    def test_workflow_version_of_another_account(self):
        with self.assertRaisesMessage(CommandError, f"No workflow version {self.france.version.id} in this account"):
            self.run_command(account=self.setup.account.id, workflow_version=self.france.version.id, verbosity=0)

    def test_report(self):
        with tempfile.TemporaryDirectory() as directory:
            path = os.path.join(directory, "report.md")

            self.run_command(account=self.setup.account.id, report=path, verbosity=0)

            with open(path) as report_file:
                self.assertIn("2 scenarios · 2 passed · **0 failed**", report_file.read())
