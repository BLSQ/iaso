from rest_framework.test import APIRequestFactory
from django.test import TestCase

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
        }

        with self.assertNumQueries(8):
            self.assertEqual(serializer.data, expected_data)
