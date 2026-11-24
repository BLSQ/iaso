"""PII filtering in the entities serializers. See `base.py` for the matrix and the expected visibility."""

from iaso.api.entities.serializers import EntityListSerializer, EntitySerializer
from iaso.tests.api.entities.pii.base import ANSWERS_A, EntityPiiTestCase


class EntityPiiSerializersTestCase(EntityPiiTestCase):
    def test_entity_attributes(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                data = EntitySerializer(scenario.entity_a, context={"request": self.make_request(user)}).data
                self.assert_answers(data["attributes"]["file_content"], scenario, has_perm)

    def test_entity_list_name(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                context = {"request": self.make_request(user), "entity_type_columns": []}
                data = EntityListSerializer(scenario.entity_a, context=context).data
                expected = ANSWERS_A["name"] if self.is_visible("name", scenario, has_perm) else None
                self.assertEqual(data["name"], expected)

    def test_without_request_hide_pii(self):
        """Without a request there is no user to check the permission of: marked forms are filtered."""
        for key, scenario in self.scenarios.items():
            with self.subTest(form=key):
                filtered = self.is_filtered(scenario, has_perm=False)
                list_data = EntityListSerializer(scenario.entity_a, context={"entity_type_columns": []}).data
                self.assertEqual(list_data["name"], None if filtered else ANSWERS_A["name"])

                attributes = EntitySerializer(scenario.entity_a, context={}).data["attributes"]
                self.assertEqual("phone" in attributes["file_content"], not filtered)
