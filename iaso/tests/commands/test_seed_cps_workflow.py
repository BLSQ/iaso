from django.core import management
from django.core.management.base import CommandError

from iaso import models as m
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.scenarios.runs import run_scenarios
from iaso.test import TestCase


CYCLES = ["Cycle 1 CPS 2026", "Cycle 2 CPS 2026", "Cycle 3 CPS 2026", "Cycle 4 CPS 2026"]


def workflow_state(account: m.Account) -> dict:
    """The seeded workflow of the account, as one comparable dict."""
    version = m.WorkflowVersion.objects.get(workflow__entity_type__account=account)
    return {
        "entity_type": version.workflow.entity_type.name,
        "entity_type_is_active": version.workflow.entity_type.is_active,
        "duplicate_search": (
            version.workflow.entity_type.fields_duplicate_search,
            version.workflow.entity_type.prevent_add_if_duplicate_found,
        ),
        "reference_form": version.workflow.entity_type.reference_form.name,
        "status": version.status,
        "auto_first_step": version.auto_first_step,
        "follow_ups": [
            (follow_up.order, [form.name for form in follow_up.forms.all()])
            for follow_up in version.follow_ups.order_by("order")
        ],
        "changes": {change.form.name: change.mapping for change in version.changes.order_by("form__name")},
    }


class SeedCpsWorkflowTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.belgium = m.Account.objects.create(name="Belgium")
        cls.france = m.Account.objects.create(name="France")

    def seed(self, account: m.Account):
        management.call_command("seed_cps_workflow", account=account.id, verbosity=0)

    def test_seeds_forms_entity_type_and_workflow(self):
        self.seed(self.belgium)

        project = m.Project.objects.get(account=self.belgium)
        self.assertEqual(project.app_id, f"cps.{self.belgium.id}")
        self.assertCountEqual(
            project.forms.values_list("name", "form_id"),
            [
                ("Enregistrement CPS 2026", "registre_de_denombrement_et_administration_cps_2026"),
                ("Cycle 1 CPS 2026", "cps_2026_cycle1"),
                ("Cycle 2 CPS 2026", "cps_2026_cycle2"),
                ("Cycle 3 CPS 2026", "cps_2026_cycle3"),
                ("Cycle 4 CPS 2026", "cps_2026_cycle4"),
            ],
        )
        self.assertEqual(m.FormVersion.objects.filter(form__projects=project).count(), 5)
        self.assertEqual(
            workflow_state(self.belgium),
            {
                "entity_type": "Enfant CPS 2026",
                "entity_type_is_active": True,
                "duplicate_search": (["qr_code"], True),
                "reference_form": "Enregistrement CPS 2026",
                "status": WorkflowVersionsStatus.PUBLISHED,
                "auto_first_step": True,
                "follow_ups": [(order, [form]) for order, form in enumerate(CYCLES)],
                "changes": {
                    form: {
                        "cycle_rempli": f"cycle_{number}_rempli",
                        "reset_evind": "evind_notification_remplie",
                        "reset_medsafety": "evind_med_safety_id",
                    }
                    for number, form in enumerate(CYCLES, 1)
                },
            },
        )

    def test_registration_form_has_no_logo(self):
        self.seed(self.belgium)

        registration = m.Form.objects.get(projects__account=self.belgium, name="Enregistrement CPS 2026")
        self.assertNotIn("pnlp", registration.latest_version.file.read().decode("utf-8"))
        # the profile fields the workflow conditions and changes use
        field_names = [field["name"] for field in registration.possible_fields]
        for number in range(1, 5):
            self.assertIn(f"cycle_{number}_rempli", field_names)

    def test_is_idempotent(self):
        self.seed(self.belgium)
        state = workflow_state(self.belgium)

        self.seed(self.belgium)

        self.assertEqual(m.Project.objects.filter(account=self.belgium).count(), 1)
        self.assertEqual(m.Form.objects.filter(projects__account=self.belgium).count(), 5)
        self.assertEqual(m.FormVersion.objects.filter(form__projects__account=self.belgium).count(), 5)
        self.assertEqual(m.Workflow.objects.filter(entity_type__account=self.belgium).count(), 1)
        self.assertEqual(workflow_state(self.belgium), state)

    def test_each_account_gets_its_own_workflow(self):
        self.seed(self.belgium)
        belgium_workflow = m.Workflow.objects.get(entity_type__account=self.belgium)

        self.seed(self.france)

        france_workflow = m.Workflow.objects.get(entity_type__account=self.france)
        self.assertNotEqual(france_workflow.uuid, belgium_workflow.uuid)
        belgium_workflow.refresh_from_db()
        self.assertEqual(belgium_workflow.entity_type.account, self.belgium)
        self.assertEqual(
            set(
                m.Form.objects.filter(workflowfollowup__workflow_version__workflow=france_workflow).values_list(
                    "projects__account", flat=True
                )
            ),
            {self.france.id},
        )

    def test_reuses_the_entity_types_existing_workflow(self):
        self.seed(self.belgium)
        workflow = m.Workflow.objects.get(entity_type__account=self.belgium)
        workflow.uuid = "11111111-1111-1111-1111-111111111111"
        workflow.save()

        self.seed(self.belgium)

        self.assertEqual(m.Workflow.objects.get(entity_type__account=self.belgium).id, workflow.id)

    def test_seeds_scenarios_that_pass(self):
        self.seed(self.belgium)
        self.seed(self.belgium)

        scenarios = list(m.Scenario.objects.filter(account=self.belgium).order_by("name"))
        self.assertEqual(
            [(scenario.name, scenario.entity_type.name) for scenario in scenarios],
            [
                ("Not found at cycle 2, found back at cycle 3", "Enfant CPS 2026"),
                ("Registered after the campaign", "Enfant CPS 2026"),
                ("Registered during cycle 3", "Enfant CPS 2026"),
                ("Scanned card, full campaign (cycles 1 to 4)", "Enfant CPS 2026"),
            ],
        )
        outcomes = run_scenarios(scenarios)
        self.assertEqual(
            [(outcome.scenario.name, outcome.status, outcome.failures) for outcome in outcomes],
            [
                ("Not found at cycle 2, found back at cycle 3", m.ScenarioStatus.PASSED, []),
                ("Registered after the campaign", m.ScenarioStatus.PASSED, []),
                ("Registered during cycle 3", m.ScenarioStatus.PASSED, []),
                ("Scanned card, full campaign (cycles 1 to 4)", m.ScenarioStatus.PASSED, []),
            ],
        )

    def test_unknown_account(self):
        with self.assertRaisesMessage(CommandError, "No account 0"):
            management.call_command("seed_cps_workflow", account=0, verbosity=0)
