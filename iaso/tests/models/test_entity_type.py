from django.test import TestCase

from iaso.models import EntityType, Form


class EntityTypeListFieldsTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.form = Form.objects.create(
            name="Patient Reference Form",
            possible_fields=[
                {"name": "first_name", "type": "text", "label": "Prénom"},
                {"name": "last_name", "type": "text", "label": "Nom de famille"},
                {"name": "age", "type": "integer", "label": "Âge"},
            ],
        )

        cls.entity_type = EntityType.objects.create(
            name="Patient", reference_form=cls.form, fields_list_view=["first_name", "last_name"]
        )

    def test_returns_empty_if_no_reference_form(self):
        self.entity_type.reference_form = None
        self.entity_type.save()

        result = self.entity_type.get_list_view_fields()
        self.assertEqual(result, [])

    def test_returns_empty_if_no_possible_fields(self):
        empty_form = Form.objects.create(name="Empty Form", possible_fields=[])
        self.entity_type.reference_form = empty_form
        self.entity_type.save()

        result = self.entity_type.get_list_view_fields()
        self.assertEqual(result, [])

    def test_returns_empty_if_no_fields_list_view(self):
        self.entity_type.fields_list_view = []
        self.entity_type.save()

        result = self.entity_type.get_list_view_fields()
        self.assertEqual(result, [])

    def test_returns_matched_fields_happy_path(self):
        result = self.entity_type.get_list_view_fields()

        self.assertEqual(len(result), 2)
        self.assertIn({"name": "first_name", "type": "text", "label": "Prénom"}, result)
        self.assertIn({"name": "last_name", "type": "text", "label": "Nom de famille"}, result)
        names_in_result = [field["name"] for field in result]
        self.assertNotIn("age", names_in_result)

    def test_ignores_fields_not_in_possible_fields(self):
        self.entity_type.fields_list_view = ["first_name", "does_not_exist"]
        self.entity_type.save()

        result = self.entity_type.get_list_view_fields()

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["name"], "first_name")
