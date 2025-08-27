from unittest.mock import Mock

from django.test import TestCase
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.api.forms import FormSerializer


class FormsSerializerTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        org_unit_type = m.OrgUnitType.objects.create(name="Org Unit Type", short_name="Out")
        form = m.Form.objects.create(name="Form", legend_threshold=10)

        form.org_unit_types.add(org_unit_type)
        form.save()

        org_unit_type.reference_forms.add(form)
        org_unit_type.save()

        cls.org_unit_type = org_unit_type
        cls.form = form

    def test_should_serialize_a_form(self):
        request = APIRequestFactory().get("/")
        request.query_params = {}
        serializer = FormSerializer(self.form, context={"request": request})

        expected_data = {
            "id": self.form.id,
            "name": "Form",
            "form_id": None,
            "device_field": None,
            "location_field": None,
            "org_unit_types": [
                {
                    "id": self.org_unit_type.id,
                    "name": "Org Unit Type",
                    "short_name": "Out",
                    "created_at": self.org_unit_type.created_at.timestamp(),
                    "updated_at": self.org_unit_type.updated_at.timestamp(),
                    "depth": None,
                    "sub_unit_types": [],
                }
            ],
            "org_unit_type_ids": [self.org_unit_type.id],
            "projects": [],
            "project_ids": [],
            "period_type": None,
            "single_per_period": False,
            "periods_before_allowed": 0,
            "periods_after_allowed": 0,
            "latest_form_version": None,
            "created_at": self.form.created_at.timestamp(),
            "updated_at": self.form.updated_at.timestamp(),
            "deleted_at": None,
            "derived": False,
            "label_keys": None,
            "reference_form_of_org_unit_types": [
                {
                    "id": self.org_unit_type.id,
                    "name": "Org Unit Type",
                    "short_name": "Out",
                    "created_at": self.org_unit_type.created_at.timestamp(),
                    "updated_at": self.org_unit_type.updated_at.timestamp(),
                    "depth": None,
                    "sub_unit_types": [],
                }
            ],
            "legend_threshold": self.form.legend_threshold,
            "change_request_mode": self.form.change_request_mode,
        }

        with self.assertNumQueries(8):
            self.assertEqual(serializer.data, expected_data)

    def test_get_possible_fields_with_latest_version_filters_by_supported_types(self):
        """
        Test that `get_possible_fields_with_latest_version()` only returns fields with supported types.
        """
        mock_form = Mock()
        mock_form.possible_fields = [
            {"name": "field1", "type": "text"},  # supported
            {"name": "field2", "type": "number"},  # supported
            {"name": "field3", "type": "photo"},  # not supported
            {"name": "field4", "type": "select"},  # not supported
            {"name": "field5", "type": "integer"},  # supported
            {"name": "field6", "type": None},  # supported
        ]
        mock_form.latest_version = None  # No latest version to keep the test simple.

        result = FormSerializer.get_possible_fields_with_latest_version(mock_form)

        expected_fields = [
            {"name": "field1", "type": "text"},
            {"name": "field2", "type": "number"},
            {"name": "field5", "type": "integer"},
            {"name": "field6", "type": None},
        ]
        self.assertEqual(result, expected_fields)
