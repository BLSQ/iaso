from django.test import TestCase
from plugins.polio.preparedness.spread_cache import CachedSpread
from plugins.polio.preparedness.parser import get_preparedness
import json


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

    def test_reproduce_bad_district_naming(self):
        self.maxDiff = None
        PREPAREDNESS_SHEET = "plugins/polio/tests/fixtures/preparedness_sheet.json"
        PREPAREDNESS_EXPECTED_STATS = "plugins/polio/tests/fixtures/preparedness_expected_stats.json"

        stats = get_preparedness(CachedSpread(self.load_fixture(PREPAREDNESS_SHEET)))
        self.assertEqual(stats, self.load_fixture(PREPAREDNESS_EXPECTED_STATS))
