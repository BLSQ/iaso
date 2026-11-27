from django.test import SimpleTestCase

from iaso.api.common.utils import comma_separated_names


class CommaSeparatedNamesTestCase(SimpleTestCase):
    def test_splits_and_strips_the_names(self):
        self.assertEqual(comma_separated_names("muac, instanceID ,age"), ["muac", "instanceID", "age"])

    def test_ignores_empty_names(self):
        self.assertEqual(comma_separated_names(",muac,, ,"), ["muac"])

    def test_no_value_gives_no_names(self):
        for value in (None, "", " "):
            with self.subTest(value=value):
                self.assertEqual(comma_separated_names(value), [])
