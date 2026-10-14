from django.test import SimpleTestCase

from iaso.api.org_unit_search import _split_ids


class SplitIdsTestCase(SimpleTestCase):
    def test_comma_separated_string(self):
        self.assertEqual(_split_ids("1,2"), ["1", "2"])

    def test_single_id_string(self):
        self.assertEqual(_split_ids("1"), ["1"])

    def test_integer(self):
        self.assertEqual(_split_ids(1), [1])

    def test_list(self):
        self.assertEqual(_split_ids([1, 2]), [1, 2])
