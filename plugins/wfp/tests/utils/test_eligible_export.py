from datetime import date

from django.test import SimpleTestCase

from plugins.wfp.utils.eligible_export import PBWG, U5, _sheet_name, current_period


class CurrentPeriodTestCase(SimpleTestCase):
    def test_from_the_26th_of_the_previous_month_to_the_25th(self):
        # in the middle of the month
        expected = (date(2026, 10, 26), date(2026, 11, 25))
        actual = current_period(date(2026, 11, 13))
        self.assertEqual(actual, expected)

        # end of January: the period of the calendar month, started in December of the previous year
        expected = (date(2025, 12, 26), date(2026, 1, 25))
        actual = current_period(date(2026, 1, 31))
        self.assertEqual(actual, expected)


class SheetNameTestCase(SimpleTestCase):
    def test_programme_postfixed_with_the_entity_type_and_the_physiology_status(self):
        taken = set()
        self.assertEqual(_sheet_name("BSFP", "Child Under 5", U5, "", taken), "BSFP Child Under 5")
        self.assertEqual(_sheet_name("BSFP", "PBWG", PBWG, "pregnant", taken), "BSFP PBWG Pregnant")
        self.assertEqual(_sheet_name("BSFP", "PBWG", PBWG, "", taken), "BSFP PBWG Unknown status")

    def test_names_are_short_and_unique(self):
        taken = set()
        long_type = "Pregnant and breastfeeding women and girls"
        first = _sheet_name("TSFP", long_type, PBWG, "pregnant", taken)
        second = _sheet_name("TSFP", long_type, PBWG, "breastfeeding", taken)
        self.assertEqual(first, "TSFP Pregnant and breastfeeding")
        self.assertEqual(second, "TSFP Pregnant and breastfeedi 2")
        self.assertTrue(all(len(name) <= 31 for name in (first, second)))
