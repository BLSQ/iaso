from django.test import TestCase

from iaso import models as m
from iaso.api.form_predefined_filters.serializers import FormPredefinedFilterSerializer


class FormPredefinedFilterSerializersTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.form = form = m.Form.objects.create(name="Form", legend_threshold=10)
        cls.form_predefined_filter = m.FormPredefinedFilter.objects.create(
            form=form, name="filter", short_name="short", json_logic="{}"
        )

    def test_should_serialize_a_form(self):
        serializer = FormPredefinedFilterSerializer(self.form_predefined_filter)

        expected_data = {
            "id": self.form_predefined_filter.id,
            "form_id": self.form.id,
            "name": "filter",
            "short_name": "short",
            "json_logic": "{}",
            "created_at": self.form_predefined_filter.created_at.timestamp(),
            "updated_at": self.form_predefined_filter.updated_at.timestamp(),
        }

        with self.assertNumQueries(0):
            self.assertEqual(serializer.data, expected_data)
