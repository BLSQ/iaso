from django.test import TestCase

from plugins.wfp.common import ETL, extract_assistance
from plugins.wfp.management.commands.bangladesh.assistance import extract_bangladesh_assistance
from plugins.wfp.models import Journey


RATION_AND_CASH = {"ration_given": "lns", "ration_quantity": "3", "assistance_given": "cash", "_cash_total": "100"}


class BangladeshAssistanceTestCase(TestCase):
    """A Bangladesh assistance step gives a ration, another assistance (e.g. cash), or both."""

    RATION_QUANTITY_FIELDS = ("ration_quantity", "_lns_packets", "_wsbp_packets", "_rusf_packets", "manual_quantity")
    CASH_QUANTITY_FIELDS = ("_cash_total", "_cash_amount", "cash_amount")

    def assertFirstFilledFieldIsUsed(self, fields, base_data, expected):
        for index, field in enumerate(fields):
            with self.subTest(field=field):
                # Earlier fields are empty, later ones are filled: only the first filled field is used.
                data = dict(base_data)
                data.update(dict.fromkeys(fields[:index], ""))
                data.update(dict.fromkeys(fields[index + 1 :], "99"))
                data[field] = "50"
                self.assertEqual(extract_bangladesh_assistance(data), expected)

    def test_ration_given(self):
        self.assertFirstFilledFieldIsUsed(
            self.RATION_QUANTITY_FIELDS,
            {"ration_given": "lns"},
            [{"type": "lns", "quantity": "50"}],
        )

    def test_assistance_given(self):
        self.assertFirstFilledFieldIsUsed(
            (*self.CASH_QUANTITY_FIELDS, "ration_quantity"),
            {"ration_given": "", "assistance_given": "cash"},
            [{"type": "cash", "quantity": "50"}],
        )

    def test_ration_and_assistance_in_the_same_step(self):
        self.assertEqual(
            extract_bangladesh_assistance(RATION_AND_CASH),
            [{"type": "lns", "quantity": "3"}, {"type": "cash", "quantity": "100"}],
        )
        self.assertFirstFilledFieldIsUsed(
            self.CASH_QUANTITY_FIELDS,
            {"ration_given": "lns", "ration_quantity": "3", "assistance_given": "cash"},
            [{"type": "lns", "quantity": "3"}, {"type": "cash", "quantity": "50"}],
        )

    def test_ration_quantity_is_not_reused_for_the_assistance(self):
        data = {"ration_given": "lns", "ration_quantity": "3", "assistance_given": "cash"}
        self.assertEqual(
            extract_bangladesh_assistance(data),
            [{"type": "lns", "quantity": "3"}, {"type": "cash", "quantity": 0}],
        )

    def test_missing_quantity_defaults_to_zero(self):
        self.assertEqual(extract_bangladesh_assistance({"ration_given": "lns"}), [{"type": "lns", "quantity": 0}])
        self.assertEqual(extract_bangladesh_assistance({"assistance_given": "cash"}), [{"type": "cash", "quantity": 0}])

    def test_nothing_given(self):
        self.assertEqual(extract_bangladesh_assistance({}), [])
        self.assertEqual(extract_bangladesh_assistance({"ration_given": "", "assistance_given": ""}), [])


class BangladeshAssistanceScopeTestCase(TestCase):
    """The Bangladesh assistance fields are only read for Bangladesh entity types."""

    def test_extract_assistance_only_reads_them_for_bangladesh(self):
        self.assertEqual(extract_assistance(RATION_AND_CASH), [])
        self.assertEqual(
            extract_assistance(RATION_AND_CASH, is_bangladesh=True),
            [{"type": "lns", "quantity": "3"}, {"type": "cash", "quantity": "100"}],
        )

    def _steps(self, entity_type):
        submissions = [
            {"id": 1, "form__form_id": "Anthropometric visit child", "json": {}, "source_created_at": None},
            {"id": 2, "form__form_id": "nsep_child_visit_assistance", "json": RATION_AND_CASH},
        ]
        _visit, steps = ETL(entity_type)._process_visit(submissions, Journey(), 1)
        return [(step.assistance_type, step.quantity_given, step.instance_id) for step in steps]

    def test_bangladesh_visit_gets_ration_and_assistance_steps(self):
        for entity_type in ("bangladesh_under5", "bangladesh_pbwg"):
            with self.subTest(entity_type=entity_type):
                self.assertEqual(self._steps(entity_type), [("lns", 3.0, 2), ("cash", 100.0, 2)])

    def test_other_countries_visits_are_not_affected(self):
        for entity_type in ("ssd_under5", "ssd_pbwg", "ethiopia_under5", "nigeria_under5", "nigeria_pbwg"):
            with self.subTest(entity_type=entity_type):
                self.assertEqual(self._steps(entity_type), [])
