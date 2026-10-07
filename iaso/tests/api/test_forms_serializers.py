from unittest.mock import Mock

from django.http import QueryDict
from django.test import TestCase
from rest_framework.test import APIRequestFactory

from iaso import models as m
from iaso.api.forms.possible_fields import POSSIBLE_FIELDS_USAGE_ENTITY_TYPE_CONFIG
from iaso.api.forms.serializers import FormSerializer


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
        request.query_params = QueryDict(mutable=True)
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
            "org_unit_groups": [],
            "org_unit_group_ids": [],
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
            "validation_workflow": None,
        }

        with self.assertNumQueries(10):
            self.assertEqual(serializer.data, expected_data)

    def test_possible_fields_with_latest_version_uses_query_param_usage(self):
        mock_form = Mock()
        mock_form.possible_fields = [
            {"name": "name", "type": "text"},
            {"name": "beneficiary_id", "type": "barcode"},
            {"name": "photo", "type": "image"},
        ]
        mock_form.latest_version = None

        request = APIRequestFactory().get(f"/?possible_fields_usage={POSSIBLE_FIELDS_USAGE_ENTITY_TYPE_CONFIG}")
        request.query_params = QueryDict(
            f"possible_fields_usage={POSSIBLE_FIELDS_USAGE_ENTITY_TYPE_CONFIG}", mutable=True
        )
        serializer = FormSerializer(context={"request": request})

        result = serializer.get_possible_fields_with_latest_version(mock_form)

        self.assertEqual(
            [field["name"] for field in result],
            ["name", "beneficiary_id"],
        )
