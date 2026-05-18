from datetime import timedelta

from django.utils.timezone import now

from iaso import models as m
from iaso.tests.api.entities.common_base_with_setup import EntityAPITestCase


class WebEntityOrderingAPITestCase(EntityAPITestCase):
    """Test custom ordering filter logic for the entity list api."""

    def setUp(self):
        super().setUp()

        account = self.yoda.iaso_profile.account
        self.entity_type_2 = m.EntityType.objects.create(name="Type 2", account=account)

        burkina_faso = self.ou_country
        yaba = m.OrgUnit.objects.create(name="Yaba", validation_status=m.OrgUnit.VALIDATION_VALID)
        karo = m.OrgUnit.objects.create(name="karo", validation_status=m.OrgUnit.VALIDATION_VALID)

        inst_1 = m.Instance.objects.create(org_unit=burkina_faso, form=self.form_1, json={"age": 30})
        inst_2 = m.Instance.objects.create(org_unit=yaba, form=self.form_1, json={"age": 20})
        inst_3 = m.Instance.objects.create(org_unit=karo, form=self.form_1, json={"age": 40})

        base_time = now()

        self.entity_1 = m.Entity.objects.create(
            name="Zebra", entity_type=self.entity_type_2, attributes=inst_1, account=account
        )
        self.entity_1.created_at = base_time - timedelta(days=2)  # Oldest
        self.entity_1.save()

        self.entity_2 = m.Entity.objects.create(
            name="Monkey", entity_type=self.entity_type, attributes=inst_2, account=account
        )
        self.entity_2.created_at = base_time - timedelta(days=1)  # Middle
        self.entity_2.save()

        self.entity_3 = m.Entity.objects.create(
            name="Giraffe", entity_type=self.entity_type_2, attributes=inst_3, account=account
        )
        self.entity_3.created_at = base_time  # Newest
        self.entity_3.save()

        self.client.force_authenticate(self.yoda)

    def test_ordering_default(self):
        response = self.client.get("/api/entities/", format="json")
        self.assertEqual(response.status_code, 200)

        result = response.json()["result"]

        # -created_at should be the default
        self.assertEqual(result[0]["id"], self.entity_3.id)
        self.assertEqual(result[1]["id"], self.entity_2.id)
        self.assertEqual(result[2]["id"], self.entity_1.id)

    def test_ordering_by_standard_model_field(self):
        # Test ascending
        response = self.client.get("/api/entities/?order=name", format="json")
        result = response.json()["result"]
        self.assertEqual(result[0]["id"], self.entity_3.id)  # Giraffe
        self.assertEqual(result[2]["id"], self.entity_1.id)  # Zebra

        # Test descending
        response = self.client.get("/api/entities/?order=-name", format="json")
        result = response.json()["result"]
        self.assertEqual(result[0]["id"], self.entity_1.id)  # Zebra
        self.assertEqual(result[2]["id"], self.entity_3.id)  # Giraffe

    def test_ordering_by_dynamic_json_attribute(self):
        # Order by a key from the entity attributes json
        response = self.client.get("/api/entities/?order=age", format="json")
        result = response.json()["result"]

        # Ages are 20 (entity 2), 30 (entity 1), 40 (entity 3)
        self.assertEqual(result[0]["id"], self.entity_2.id)
        self.assertEqual(result[1]["id"], self.entity_1.id)
        self.assertEqual(result[2]["id"], self.entity_3.id)

    def test_ordering_by_attributes_span(self):
        """Test ordering spanning relations (attributes__org_unit__name)."""
        response = self.client.get("/api/entities/?order=attributes__org_unit__name,-created_at", format="json")
        result = response.json()["result"]

        self.assertEqual(result[0]["id"], self.entity_1.id)  # Burkina Faso
        self.assertEqual(result[1]["id"], self.entity_3.id)  # karo
        self.assertEqual(result[2]["id"], self.entity_2.id)  # Yaba
