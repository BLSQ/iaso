from iaso.test import TestCase
from django.test import tag

import iaso.periods as periods


class PeriodsModelTestCase(TestCase):
    def test_detect_month(self):
        self.assertEquals(periods.detect("201901"), "MONTH")

    def test_detect_year(self):
        self.assertEquals(periods.detect("2019"), "YEAR")

    def test_detect_quarter(self):
        self.assertEquals(periods.detect("2019Q4"), "QUARTER")

    def test_detect_six_month(self):
        self.assertEquals(periods.detect("2019S1"), "SIX_MONTH")
