from django.test import SimpleTestCase

from iaso.utils.legend import ORDINAL_MAX_ITEMS, get_ordinal_range


class GetOrdinalRangeTestCase(SimpleTestCase):
    def test_get_ordinal_range_returns_one_distinct_colour_per_item_up_to_max(self):
        for count in range(2, ORDINAL_MAX_ITEMS + 1):
            with self.subTest(count=count):
                colours = get_ordinal_range(count)
                self.assertEqual(len(colours), count)
                self.assertEqual(len(set(colours)), count)
