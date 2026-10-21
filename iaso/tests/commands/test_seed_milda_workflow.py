from django.core import management

from iaso import models as m
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.scenarios.runs import run_scenarios
from iaso.test import TestCase


REMISE = "Remise MILDA au centre de santé"


class SeedMildaWorkflowTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.belgium = m.Account.objects.create(name="Belgium")

    def seed(self):
        management.call_command("seed_milda_workflow", account=self.belgium.id, verbosity=0)

    def test_seeds_the_campaign(self):
        self.seed()

        project = m.Project.objects.get(account=self.belgium)
        self.assertEqual((project.name, project.app_id), ("Campagne MILDA 2026", f"milda.{self.belgium.id}"))
        self.assertCountEqual(
            project.forms.values_list("name", "form_id"),
            [
                ("Enregistrement ménage MILDA", "milda_2026_enregistrement"),
                (REMISE, "milda_2026_remise_cs"),
            ],
        )
        entity_type = m.EntityType.objects.get(account=self.belgium)
        self.assertEqual(
            (entity_type.name, entity_type.reference_form.form_id, entity_type.fields_list_view),
            ("Ménage MILDA", "milda_2026_enregistrement", ["nom_chef", "cs_name"]),
        )
        version = m.WorkflowVersion.objects.get(workflow__entity_type=entity_type)
        self.assertEqual((version.status, version.auto_first_step), (WorkflowVersionsStatus.PUBLISHED, False))
        [follow_up] = version.follow_ups.all()
        self.assertEqual(
            (follow_up.condition, [form.name for form in follow_up.forms.all()]),
            ({">": [{"var": "milda_restantes__int__"}, 0]}, [REMISE]),
        )
        [change] = version.changes.all()
        self.assertEqual(
            change.mapping,
            {
                "milda_restantes_apres__int__": "milda_restantes__int__",
                "milda_distribuees_total__int__": "milda_distribuees__int__",
            },
        )

    def test_the_registration_has_the_org_unit_picker_and_the_scanned_milda(self):
        self.seed()

        registration = m.Form.objects.get(projects__account=self.belgium, form_id="milda_2026_enregistrement")
        xform = registration.latest_version.file.read().decode("utf-8")
        self.assertIn(
            "intent=\"ex:org.bluesquare.iaso.action.pick_ou(map='id:cs_id;name:cs_name;path:cs_path')\"", xform
        )
        self.assertIn('nodeset="/data/milda/milda_code" type="barcode"', xform)

    def test_seeds_scenarios_that_pass(self):
        self.seed()
        self.seed()

        scenarios = list(m.Scenario.objects.filter(account=self.belgium).order_by("name"))
        self.assertEqual(
            [(outcome.scenario.name, outcome.status, outcome.failures) for outcome in run_scenarios(scenarios)],
            [
                ("Aucune MILDA disponible lors du passage", m.ScenarioStatus.PASSED, []),
                ("Plus de couchages que de personnes", m.ScenarioStatus.PASSED, []),
                ("Toutes les MILDA distribuées sur place", m.ScenarioStatus.PASSED, []),
                ("Une MILDA à remettre au centre de santé", m.ScenarioStatus.PASSED, []),
            ],
        )

    def test_is_idempotent_and_leaves_the_cps_alone(self):
        management.call_command("seed_cps_workflow", account=self.belgium.id, verbosity=0)
        self.seed()
        self.seed()

        self.assertCountEqual(
            m.EntityType.objects.filter(account=self.belgium).values_list("name", flat=True),
            ["Enfant CPS 2026", "Ménage MILDA"],
        )
        self.assertEqual(m.Workflow.objects.filter(entity_type__account=self.belgium).count(), 2)
        self.assertEqual(m.Form.objects.filter(projects__account=self.belgium).count(), 7)
        self.assertEqual(m.Scenario.objects.filter(account=self.belgium).count(), 4 + 4)
