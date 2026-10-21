import datetime
import json

from django.core import management

from iaso import models as m
from iaso.models import StepStatus
from iaso.scenarios.entities import EntityScenarioRunner
from iaso.scenarios.forms import FormSource
from iaso.scenarios.runs import prepare_step
from iaso.scenarios.schema import EntityScenario
from iaso.test import TestCase
from iaso.tests.scenarios.fixtures import NOW, ScenarioExamplesTestCase


def run_scenario(version, account, steps, now=NOW):
    return EntityScenarioRunner(version, FormSource(account), now=now).run(
        # from JSON, as a scenario file: the steps' clock is ISO 8601 text
        EntityScenario.model_validate_json(json.dumps({"name": "test", "steps": steps}))
    )


class SearchBeforeRegisteringTestCase(ScenarioExamplesTestCase):
    """The app's search before registering (`fields_duplicate_search`), on the child's first name."""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        # the one the runner reads, through the version
        cls.entity_type = cls.version.workflow.entity_type
        cls.entity_type.fields_duplicate_search = ["first_name"]
        cls.entity_type.prevent_add_if_duplicate_found = True
        cls.entity_type.save()

    def registration(self, search, **step):
        return {"form": "child_registration", "search": search, "answers": {"age_months": "11"}, **step}

    def run_scenario(self, steps):
        return run_scenario(self.version, self.setup.account, steps)

    def test_search_prefills_the_registration(self):
        result = self.run_scenario([self.registration({"first_name": "  Amina "})])

        self.assertTrue(result.passed, result.failures)
        [registration] = result.steps
        # trimmed, as the app keeps a typed value
        self.assertEqual(registration.prefilled, {"first_name": "Amina"})
        self.assertEqual(registration.profile["first_name"], "Amina")

    def test_prevent_add_needs_every_search_field(self):
        result = self.run_scenario([self.registration({"first_name": " "})])

        [registration] = result.steps
        self.assertEqual(registration.status, StepStatus.NOT_OFFERED)
        self.assertEqual(
            registration.failures,
            [
                (
                    "The app doesn't let you register before every search field is filled "
                    "(prevent_add_if_duplicate_found), missing: ['first_name']"
                )
            ],
        )

    def test_without_prevent_add_an_empty_search_registers(self):
        self.entity_type.prevent_add_if_duplicate_found = False
        self.entity_type.save()

        result = self.run_scenario([self.registration({}, answers={"first_name": "Amina", "age_months": "11"})])

        self.assertTrue(result.passed, result.failures)
        self.assertEqual(result.steps[0].prefilled, {})

    def test_search_on_a_question_the_app_does_not_ask(self):
        result = self.run_scenario([self.registration({"first_name": "Amina", "age_months": "11"})])

        [registration] = result.steps
        self.assertEqual(registration.status, StepStatus.NOT_OFFERED)
        self.assertEqual(
            registration.failures,
            ["The app doesn't search on ['age_months'] before registering, only on ['first_name']"],
        )

    def test_search_fields_not_in_the_form_are_ignored(self):
        # the app skips them; none left: it opens the form directly
        self.entity_type.fields_duplicate_search = ["not_a_question"]
        self.entity_type.save()

        result = self.run_scenario([self.registration({}, answers={"first_name": "Amina", "age_months": "11"})])

        self.assertTrue(result.passed, result.failures)

    def test_no_search_after_registering(self):
        result = self.run_scenario(
            [
                self.registration({"first_name": "Amina"}),
                {"form": "anthropometry", "search": {"first_name": "Amina"}, "answers": {"muac": "12.0"}},
            ]
        )

        self.assertEqual(result.steps[1].status, StepStatus.ERROR)
        self.assertEqual(
            result.steps[1].failures,
            ["A search only comes before registering: the entity is registered already"],
        )


class CpsCardScanTestCase(TestCase):
    """The CPS workflow (seed_cps_workflow): the card's QR code is scanned before registering; the registration's
    `qr_code` question, read-only and required, only gets it from the search."""

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Belgium")
        management.call_command("seed_cps_workflow", account=cls.account.id, verbosity=0)
        cls.version = m.WorkflowVersion.objects.get(workflow__entity_type__account=cls.account)

    def registration(self, search, **step):
        return {
            "form": "registre_de_denombrement_et_administration_cps_2026",
            "search": search,
            "answers": {
                "code_menage": "12",
                "nom_prenoms_parent_gardien": "JULES MARTIN",
                "nom_prenoms_enfant": "AMINA MARTIN",
                "age": "12_59_mois",
                "sexe": "Feminin",
                "resident_nonresident": "Resident(e)",
            },
            **step,
        }

    def test_scanned_card_registers_the_child(self):
        result = run_scenario(
            self.version,
            self.account,
            [
                self.registration(
                    {"qr_code": "CARD-0001"},
                    at="2026-06-15T09:00:00+00:00",
                    expect={"next_forms": ["cps_2026_cycle1"]},
                ),
                {
                    "form": "cps_2026_cycle1",
                    "at": "2026-06-15T09:30:00+00:00",
                    # the default (today()) isn't applied by the form engine: answered
                    "answers": {"date": "2026-06-15", "prise_dose1": "Oui0"},
                    "expect": {"attributes": {"qr_code": "CARD-0001", "cycle_1_rempli": "cycle_rempli"}},
                },
            ],
        )

        self.assertTrue(result.passed, result.failures)
        registration, cycle_1 = result.steps
        self.assertEqual(registration.submission["qr_code"], "CARD-0001")
        # cycle 1 done: nothing more offered before cycle 2
        self.assertEqual(cycle_1.next.form_ids, [])

    def cycle_2_after_cycle_1(self, cycle_2_at):
        return run_scenario(
            self.version,
            self.account,
            [
                self.registration({"qr_code": "CARD-0001"}, at="2026-06-15T09:00:00+00:00"),
                {
                    "form": "cps_2026_cycle1",
                    "at": "2026-06-15T09:30:00+00:00",
                    "answers": {"date": "2026-06-15", "prise_dose1": "Oui0"},
                },
                {
                    "form": "cps_2026_cycle2",
                    "at": cycle_2_at,
                    # no date: the form's default, today(), is the step's day
                    "answers": {
                        "age_actuel_enfant": "12_59_mois",
                        "prise_dose1": "Oui0",
                        "verification_carnet_enfant": "Carnet_absent",
                    },
                },
            ],
        )

    def test_a_later_visit_is_offered_what_its_day_offers(self):
        # nothing offered after cycle 1 in June; opened again in July, the app evaluates the follow-ups on that day
        result = self.cycle_2_after_cycle_1("2026-07-15T09:00:00+00:00")

        self.assertTrue(result.passed, result.failures)
        cycle_2 = result.steps[2]
        self.assertEqual(result.steps[1].next.form_ids, [])
        self.assertEqual(cycle_2.offered_before.form_ids, ["cps_2026_cycle2"])
        self.assertEqual(cycle_2.profile["cycle_2_rempli"], "cycle_rempli")
        self.assertEqual(cycle_2.submission["date_cy2"], "2026-07-15")

    def test_a_visit_before_the_window_is_not_offered_it(self):
        result = self.cycle_2_after_cycle_1("2026-06-20T09:00:00+00:00")

        cycle_2 = result.steps[2]
        self.assertEqual(cycle_2.status, StepStatus.NOT_OFFERED)
        self.assertEqual(cycle_2.offered_before.form_ids, [])

    def test_the_forms_today_is_the_steps_day(self):
        # the registration computes the cycle the child starts at from today(): the step's day, not the run's
        for at, today, cycle in [
            ("2026-06-15T09:00:00+00:00", "15/06/2026", "Cycle 01"),
            ("2026-08-20T09:00:00+00:00", "20/08/2026", "Cycle 03"),
        ]:
            with self.subTest(at):
                result = run_scenario(self.version, self.account, [self.registration({"qr_code": "CARD-0001"}, at=at)])

                profile = result.steps[0].profile
                self.assertEqual((profile["today"], profile["cycle_debut_via_date"]), (today, cycle))

    def test_the_editor_shows_the_form_on_the_steps_day(self):
        scenario = m.Scenario(
            account=self.account,
            kind=m.ScenarioKind.ENTITY,
            entity_type=self.version.workflow.entity_type,
            definition={"kind": "entity", "name": "test", "steps": []},
        )

        step = prepare_step(scenario, None, {}, {}, at=datetime.datetime(2026, 6, 15, 9, tzinfo=datetime.timezone.utc))

        self.assertIn("format-date(date('2026-06-15'), '%d/%m/%Y')", step["xform"])
        self.assertNotIn("today()", step["xform"])

    def test_no_card_no_registration(self):
        result = run_scenario(self.version, self.account, [self.registration({})])

        self.assertEqual(result.steps[0].status, StepStatus.NOT_OFFERED)
        self.assertIn("missing: ['qr_code']", result.steps[0].failures[0])

    def test_clock_outside_the_cycles(self):
        # today's campaign is over (cycle 4 ended on 2026-10-09): nothing offered after the registration
        result = run_scenario(
            self.version,
            self.account,
            [self.registration({"qr_code": "CARD-0001"})],
            now=datetime.datetime(2026, 10, 12, tzinfo=datetime.timezone.utc),
        )

        self.assertEqual(result.steps[0].next.form_ids, [])
