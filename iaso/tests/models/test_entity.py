from iaso import models as m
from iaso.test import TestCase


class EntityTypeModelTestCase(TestCase):
    """
    Test EntityType model.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project("source", "account", "project")

    def test_entity_type_no_reference_form(self):
        """
        Checks that the as_dict method does not crash when there is no reference form - IA-4054
        """
        name = "EntityType"
        entity_type = m.EntityType.objects.create(
            name=name,
            code="Code",
            account=self.account,
        )
        entity_dict = entity_type.as_dict()
        self.assertIsNotNone(entity_dict["created_at"])
        self.assertIsNotNone(entity_dict["updated_at"])
        self.assertIsNotNone(entity_dict["account"])
        self.assertIsNone(entity_dict["reference_form"])
        self.assertEqual(entity_dict["name"], name)
