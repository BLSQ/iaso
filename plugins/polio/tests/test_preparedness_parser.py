import json

from django.test import TestCase

from plugins.polio.preparedness.parser import get_preparedness, is_worksheet_exluded
from plugins.polio.preparedness.spread_cache import CachedSheet, CachedSpread


class PreparednessParserTests(TestCase):
    # the json file was obtained via then cleaned to remove url/ids with the following snippet
    #
    # import json
    # from plugins.polio.preparedness.parser import open_sheet_by_url
    # from plugins.polio.preparedness.spread_cache import CachedSpread
    # spreadsheet_url = "https://docs.google.com/spreadsheets/d/...."
    # spread = open_sheet_by_url(spreadsheet_url)
    # json.dumps(cached_spread.c)

    def load_fixture(self, filename):
        with open(filename, "rb") as text:
            return json.load(text)

    def make_worksheet(self, title, hidden=False):
        return CachedSheet({"title": title, "values": [], "formulas": [], "properties": {"hidden": hidden}})

    def test_excludes_worksheets_starting_with_copy(self):
        for title in ["copy", "copy of national", "Copy", "Copy of National", "COPY"]:
            with self.subTest(title=title):
                self.assertTrue(is_worksheet_exluded(self.make_worksheet(title), None))

    def test_does_not_exclude_regular_worksheets(self):
        for title in ["National", "Region 1", "District data"]:
            with self.subTest(title=title):
                self.assertFalse(is_worksheet_exluded(self.make_worksheet(title), None))

    def test_reproduce_bad_district_naming(self):
        self.maxDiff = None
        PREPAREDNESS_SHEET = "plugins/polio/tests/fixtures/preparedness_sheet.json"
        PREPAREDNESS_EXPECTED_STATS = "plugins/polio/tests/fixtures/preparedness_expected_stats.json"

        stats = get_preparedness(CachedSpread(self.load_fixture(PREPAREDNESS_SHEET)))
        self.assertEqual(stats, self.load_fixture(PREPAREDNESS_EXPECTED_STATS))
