from django.core.exceptions import ValidationError

from iaso import models as m
from iaso.test import TestCase


class DataSourceModelTestCase(TestCase):
    """
    Test DataSource model.
    """

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(
            name="DataSource 1",
            description="Description 1",
        )

    def test_full_clean_should_raise_for_invalid_choice(self):
        self.data_source.tree_config_status_fields = ["FOO"]
        with self.assertRaises(ValidationError) as error:
            self.data_source.full_clean()
        self.assertIn("Value 'FOO' is not a valid choice.", error.exception.messages[0])

    def test_clean_should_remove_duplicates(self):
        self.data_source.tree_config_status_fields = [m.OrgUnit.VALIDATION_NEW, m.OrgUnit.VALIDATION_NEW]
        self.data_source.clean()
        self.assertEqual(self.data_source.tree_config_status_fields, [m.OrgUnit.VALIDATION_NEW])
