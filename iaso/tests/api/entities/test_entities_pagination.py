from datetime import timedelta

from django.utils.timezone import now

from iaso import models as m
from iaso.tests.api.entities.common_base_with_setup import EntityAPITestCase


class WebEntityCursorPaginationAPITestCase(EntityAPITestCase):
    """Test custom cursor pagination logic for the entity list api."""

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

        inst_null = m.Instance.objects.create(org_unit=None, form=self.form_1, json={"age": 25})

        base_time = now()

        self.entity_1 = m.Entity.objects.create(
            name="Zebra", entity_type=self.entity_type_2, attributes=inst_1, account=account
        )
        self.entity_1.created_at = base_time - timedelta(days=2)  # Oldest
        self.entity_1.save()

        self.entity_2 = m.Entity.objects.create(
            name="Monkey", entity_type=self.entity_type, attributes=inst_2, account=account
        )
        self.entity_2.created_at = base_time - timedelta(days=1)
        self.entity_2.save()

        self.entity_3 = m.Entity.objects.create(
            name="Giraffe", entity_type=self.entity_type_2, attributes=inst_3, account=account
        )
        self.entity_3.created_at = base_time
        self.entity_3.save()

        self.entity_4_null = m.Entity.objects.create(
            name="Alpaca", entity_type=self.entity_type, attributes=inst_null, account=account
        )
        self.entity_4_null.created_at = base_time + timedelta(days=1)  # Newest
        self.entity_4_null.save()

    def test_cursor_pagination_desc(self):
        self.client.force_authenticate(self.yoda)

        response = self.client.get("/api/entities/", data={"limit": 2, "cursor": "null"}, format="json")
        data = self.assertJSONResponse(response, 200)

        # Default order is -created_at
        self.assertEqual(len(data["result"]), 2)
        self.assertEqual(data["result"][0]["id"], self.entity_4_null.id)
        self.assertEqual(data["result"][1]["id"], self.entity_3.id)

        self.assertIsNotNone(data["next"])
        self.assertIsNone(data["previous"])

        next_cursor = data["next"]
        response_page_2 = self.client.get("/api/entities/", data={"cursor": next_cursor, "limit": 2}, format="json")
        data_page_2 = self.assertJSONResponse(response_page_2, 200)

        self.assertEqual(len(data_page_2["result"]), 2)
        self.assertEqual(data_page_2["result"][0]["id"], self.entity_2.id)
        self.assertEqual(data_page_2["result"][1]["id"], self.entity_1.id)

        self.assertIsNone(data_page_2["next"])
        self.assertIsNotNone(data_page_2["previous"])

        prev_cursor = data_page_2["previous"]
        response_page_1 = self.client.get("/api/entities/", data={"cursor": prev_cursor, "limit": 2}, format="json")
        data_page_1 = self.assertJSONResponse(response_page_1, 200)

        self.assertEqual(data_page_1["result"][0]["id"], self.entity_4_null.id)
        self.assertEqual(data_page_1["result"][1]["id"], self.entity_3.id)

    def test_cursor_pagination_asc_nullable(self):
        self.client.force_authenticate(self.yoda)

        # Sort ASC by org unit (nulls last)
        params = {"order": "attributes__org_unit__name", "limit": 2}

        response_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(response_p1, 200)

        self.assertEqual(len(data_p1["result"]), 2)
        self.assertEqual(data_p1["result"][0]["id"], self.entity_1.id)  # Burkina Faso
        self.assertEqual(data_p1["result"][1]["id"], self.entity_3.id)  # Karo

        response_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p1["next"]}, format="json")
        data_p2 = self.assertJSONResponse(response_p2, 200)
        self.assertEqual(len(data_p2["result"]), 2)
        self.assertEqual(data_p2["result"][0]["id"], self.entity_2.id)  # Yaba
        self.assertEqual(data_p2["result"][1]["id"], self.entity_4_null.id)  # NULL
        self.assertIsNone(data_p2["next"])

        response_back = self.client.get("/api/entities/", data=params | {"cursor": data_p2["previous"]}, format="json")
        data_back = self.assertJSONResponse(response_back, 200)
        self.assertEqual(len(data_back["result"]), 2)
        self.assertEqual(data_back["result"][0]["id"], self.entity_1.id)
        self.assertEqual(data_back["result"][1]["id"], self.entity_3.id)
        self.assertIsNone(data_back["previous"])

    def test_cursor_pagination_desc_nullable(self):
        self.client.force_authenticate(self.yoda)

        # Sort DESC by org unit name (nulls first)
        params = {"order": "-attributes__org_unit__name", "limit": 2}

        response = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data = self.assertJSONResponse(response, 200)

        self.assertEqual(data["result"][0]["id"], self.entity_4_null.id)  # NULL
        self.assertEqual(data["result"][1]["id"], self.entity_2.id)  # Yaba

        next_cursor = data["next"]
        response_2 = self.client.get("/api/entities/", data=params | {"cursor": next_cursor}, format="json")
        data_2 = self.assertJSONResponse(response_2, 200)

        self.assertEqual(data_2["result"][0]["id"], self.entity_3.id)  # Karo
        self.assertEqual(data_2["result"][1]["id"], self.entity_1.id)  # Burkina Faso

        # Reverse direction, ensure the IS NULL OR logic transitions correctly back to page 1
        prev_cursor = data_2["previous"]
        response_back = self.client.get("/api/entities/", data=params | {"cursor": prev_cursor}, format="json")
        data_back = self.assertJSONResponse(response_back, 200)

        self.assertEqual(data_back["result"][0]["id"], self.entity_4_null.id)
        self.assertEqual(data_back["result"][1]["id"], self.entity_2.id)

    def test_cursor_pagination_desc_nullable_json(self):
        """Test traversing with nullable JSON fields (desc, nulls first)."""
        self.client.force_authenticate(self.yoda)

        self.entity_1.attributes.json = {"first_name": "Alice"}
        self.entity_1.attributes.save()

        self.entity_2.attributes.json = {"first_name": "Zebra"}
        self.entity_2.attributes.save()

        self.entity_3.attributes.json = {"first_name": "Bob"}
        self.entity_3.attributes.save()

        # leave entity_4_null with no first_name key.

        params = {"order": "-attributes__json__first_name", "limit": 2}

        response_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(response_p1, 200)

        self.assertEqual(len(data_p1["result"]), 2)
        self.assertEqual(data_p1["result"][0]["id"], self.entity_4_null.id)  # NULL
        self.assertEqual(data_p1["result"][1]["id"], self.entity_2.id)  # Zebra
        self.assertIsNotNone(data_p1["next"])

        response_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p1["next"]}, format="json")
        data_p2 = self.assertJSONResponse(response_p2, 200)

        self.assertEqual(len(data_p2["result"]), 2)

        self.assertEqual(data_p2["result"][0]["id"], self.entity_3.id)  # Bob
        self.assertEqual(data_p2["result"][1]["id"], self.entity_1.id)  # Alice
        self.assertIsNone(data_p2["next"], "End of data reached, next should be null")
        self.assertIsNotNone(data_p2["previous"])

        response_back = self.client.get("/api/entities/", data=params | {"cursor": data_p2["previous"]}, format="json")
        data_back = self.assertJSONResponse(response_back, 200)

        self.assertEqual(len(data_back["result"]), 2)
        self.assertEqual(data_back["result"][0]["id"], self.entity_4_null.id)
        self.assertEqual(data_back["result"][1]["id"], self.entity_2.id)
        self.assertIsNone(data_back["previous"], "Start of data reached, previous should be null")

    def test_cursor_sea_of_nulls_desc(self):
        """Test traversing through a block of null fields using tie-breakers."""
        self.client.force_authenticate(self.yoda)

        # 5 entities without org units
        null_entities = []
        for i in range(5):
            inst = m.Instance.objects.create(
                org_unit=None, form=self.form_1, json={"age": 20 + i, "name": f"Null_Entity_{i}"}
            )
            ent = m.Entity.objects.create(
                entity_type=self.entity_type, attributes=inst, account=self.yoda.iaso_profile.account
            )
            null_entities.append(ent)

        # Order DESC (nulls first)
        params = {"order": "-attributes__org_unit__name", "limit": 3}

        res_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(res_p1, 200)

        self.assertEqual(len(data_p1["result"]), 3)

        # Verify all are null entities without crashing on 'None' names
        for item in data_p1["result"]:
            name = item.get("name")
            self.assertTrue(name is None or name == "Alpaca" or name.startswith("Null_Entity_"))

        res_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p1["next"]}, format="json")
        data_p2 = self.assertJSONResponse(res_p2, 200)

        self.assertEqual(len(data_p2["result"]), 3)

        res_back = self.client.get("/api/entities/", data=params | {"cursor": data_p2["previous"]}, format="json")
        data_back = self.assertJSONResponse(res_back, 200)

        self.assertEqual(len(data_back["result"]), 3)
        self.assertEqual([e["id"] for e in data_back["result"]], [e["id"] for e in data_p1["result"]])

    def test_cursor_sea_of_nulls_asc(self):
        """Test traversing through a block of null fields when sorting ASC (nulls last)."""
        self.client.force_authenticate(self.yoda)

        # 5 new entities with no org_unit
        for i in range(5):
            inst = m.Instance.objects.create(
                org_unit=None, form=self.form_1, json={"age": 20 + i, "name": f"Null_Entity_{i}"}
            )
            m.Entity.objects.create(
                entity_type=self.entity_type, attributes=inst, account=self.yoda.iaso_profile.account
            )

        # Total of 9 entities: 3 non-null from setup, 1 null from setup, 5 null from this test
        # Order ASC (nulls last).
        params = {"order": "attributes__org_unit__name", "limit": 4}

        res_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(res_p1, 200)

        self.assertEqual(len(data_p1["result"]), 4)
        self.assertIsNotNone(data_p1["next"])

        res_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p1["next"]}, format="json")
        data_p2 = self.assertJSONResponse(res_p2, 200)

        self.assertEqual(len(data_p2["result"]), 4)
        self.assertIsNotNone(data_p2["next"])

        res_p3 = self.client.get("/api/entities/", data=params | {"cursor": data_p2["next"]}, format="json")
        data_p3 = self.assertJSONResponse(res_p3, 200)

        self.assertEqual(len(data_p3["result"]), 1)
        self.assertIsNone(data_p3["next"])

        res_back_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p3["previous"]}, format="json")
        data_back_p2 = self.assertJSONResponse(res_back_p2, 200)

        self.assertEqual(len(data_back_p2["result"]), 4)

        self.assertEqual([e["id"] for e in data_back_p2["result"]], [e["id"] for e in data_p2["result"]])

    def test_cursor_sea_of_identical_fields(self):
        """Test traversing through a page of identical fields (id tie-breaker)."""
        self.client.force_authenticate(self.yoda)

        # Force all entities to have the same org_unit
        m.Instance.objects.update(org_unit=self.ou_country)

        params = {"order": "attributes__org_unit__name", "limit": 2}

        res_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(res_p1, 200)

        self.assertEqual(len(data_p1["result"]), 2)

        res_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p1["next"]}, format="json")
        data_p2 = self.assertJSONResponse(res_p2, 200)

        self.assertEqual(len(data_p2["result"]), 2)

        p1_ids = {e["id"] for e in data_p1["result"]}
        p2_ids = {e["id"] for e in data_p2["result"]}
        self.assertEqual(len(p1_ids.intersection(p2_ids)), 0, "Pages should not overlap.")

    def test_cursor_empty_queryset(self):
        self.client.force_authenticate(self.yoda)

        m.Entity.objects.all().delete()

        response = self.client.get("/api/entities/", data={"limit": 2, "cursor": "null"}, format="json")

        data = self.assertJSONResponse(response, 200)

        self.assertEqual(len(data["result"]), 0)
        self.assertIsNone(data["next"])
        self.assertIsNone(data["previous"])

    def test_cursor_json_missing_null_and_empty(self):
        """Test invalid and null json values on the entity attributes."""
        self.client.force_authenticate(self.yoda)

        self.entity_1.attributes.json = {"last_name": "Smith"}
        self.entity_1.attributes.save()

        self.entity_4_null.attributes.json = {"last_name": "Zimmer"}
        self.entity_4_null.attributes.save()

        self.entity_2.attributes.json = {"last_name": None}  # Explicit jsonb null
        self.entity_2.attributes.save()

        self.entity_3.attributes.json = {"age": 40}  # Missing 'last_name' key (SQL NULL equivalent)
        self.entity_3.attributes.save()

        inst_empty = m.Instance.objects.create(org_unit=self.ou_country, form=self.form_1, json={})
        m.Entity.objects.create(
            name="EmptyDict",
            entity_type=self.entity_type,
            attributes=inst_empty,
            account=self.yoda.iaso_profile.account,
        )

        inst_none = m.Instance.objects.create(org_unit=self.ou_country, form=self.form_1, json=None)
        m.Entity.objects.create(
            name="NoneJson", entity_type=self.entity_type, attributes=inst_none, account=self.yoda.iaso_profile.account
        )

        params = {"order": "-attributes__json__last_name", "limit": 3}

        response_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(response_p1, 200)
        self.assertEqual(len(data_p1["result"]), 3)
        self.assertIsNotNone(data_p1["next"])

        response_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p1["next"]}, format="json")
        data_p2 = self.assertJSONResponse(response_p2, 200)

        self.assertEqual(len(data_p2["result"]), 3)
        self.assertIsNone(data_p2["next"], "End of data reached, next should be null")
        self.assertIsNotNone(data_p2["previous"])

        response_back = self.client.get("/api/entities/", data=params | {"cursor": data_p2["previous"]}, format="json")
        data_back = self.assertJSONResponse(response_back, 200)
        self.assertEqual(len(data_back["result"]), 3)

        self.assertEqual([e["id"] for e in data_back["result"]], [e["id"] for e in data_p1["result"]])

    def test_cursor_mid_pagination_deletion(self):
        """Test pagination doesn't break if the cursor's reference item is deleted."""
        self.client.force_authenticate(self.yoda)

        params = {"order": "-created_at", "limit": 2}

        res_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(res_p1, 200)
        next_cursor = data_p1["next"]

        # Delete the last item on page 1 (which the 'next' cursor is referencing)
        last_item_id = data_p1["result"][1]["id"]
        m.Entity.objects.filter(id=last_item_id).delete()

        res_p2 = self.client.get("/api/entities/", data=params | {"cursor": next_cursor}, format="json")
        data_p2 = self.assertJSONResponse(res_p2, 200)

        self.assertEqual(len(data_p2["result"]), 2)

    def test_count_endpoint(self):
        self.client.force_authenticate(self.yoda)

        # Test the unfiltered count
        response = self.client.get("/api/entities/count/", format="json")
        data = self.assertJSONResponse(response, 200)

        self.assertEqual(data["count"], 4)

        # Test with filters
        response_filtered = self.client.get(
            "/api/entities/count/", data={"entity_type_ids": self.entity_type_2.id}, format="json"
        )
        data_filtered = self.assertJSONResponse(response_filtered, 200)

        self.assertEqual(data_filtered["count"], 2)

    def test_cursor_multiple_columns(self):
        """Test multiple field ordering with mixed ASC/DESC directions."""

        self.client.force_authenticate(self.yoda)

        m.Entity.objects.all().delete()

        base_time = now()
        account = self.yoda.iaso_profile.account

        # Entities in their expected order (name ASC, created_at DESC, implicit id ASC)

        e1 = m.Entity.objects.create(name="Apple", entity_type=self.entity_type, account=account)
        e1.created_at = base_time
        e1.save()

        e2 = m.Entity.objects.create(name="Apple", entity_type=self.entity_type, account=account)
        e2.created_at = base_time
        e2.save()

        e3 = m.Entity.objects.create(name="Apple", entity_type=self.entity_type, account=account)
        e3.created_at = base_time
        e3.save()

        e4 = m.Entity.objects.create(name="Banana", entity_type=self.entity_type, account=account)
        e4.created_at = base_time + timedelta(days=1)
        e4.save()

        params = {"order": "name,-created_at", "limit": 2}

        res_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(res_p1, 200)

        self.assertEqual(len(data_p1["result"]), 2)
        self.assertEqual(data_p1["result"][0]["id"], e1.id)
        self.assertEqual(data_p1["result"][1]["id"], e2.id)

        res_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p1["next"]}, format="json")
        data_p2 = self.assertJSONResponse(res_p2, 200)

        self.assertEqual(len(data_p2["result"]), 2)
        self.assertEqual(data_p2["result"][0]["id"], e3.id)
        self.assertEqual(data_p2["result"][1]["id"], e4.id)
        self.assertIsNone(data_p2["next"])

        res_back = self.client.get("/api/entities/", data=params | {"cursor": data_p2["previous"]}, format="json")
        data_back = self.assertJSONResponse(res_back, 200)

        self.assertEqual(len(data_back["result"]), 2)
        self.assertEqual(data_back["result"][0]["id"], e1.id)
        self.assertEqual(data_back["result"][1]["id"], e2.id)
        self.assertIsNone(data_back["previous"])

    def test_cursor_multiple_columns_nullable(self):
        self.client.force_authenticate(self.yoda)

        m.Entity.objects.all().delete()

        account = self.yoda.iaso_profile.account

        # Entities in their expected order (org unit name ASC (nulls last), name DESC, implicit id ASC)

        inst_valid = m.Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        e1 = m.Entity.objects.create(name="Alpha", entity_type=self.entity_type, attributes=inst_valid, account=account)

        inst_null_1 = m.Instance.objects.create(org_unit=None, form=self.form_1)
        e2 = m.Entity.objects.create(name="Zeta", entity_type=self.entity_type, attributes=inst_null_1, account=account)

        inst_null_2 = m.Instance.objects.create(org_unit=None, form=self.form_1)
        e3 = m.Entity.objects.create(name="Zeta", entity_type=self.entity_type, attributes=inst_null_2, account=account)

        inst_null_3 = m.Instance.objects.create(org_unit=None, form=self.form_1)
        e4 = m.Entity.objects.create(name="Zeta", entity_type=self.entity_type, attributes=inst_null_3, account=account)

        params = {"order": "attributes__org_unit__name,-name", "limit": 2}

        res_p1 = self.client.get("/api/entities/", data=params | {"cursor": "null"}, format="json")
        data_p1 = self.assertJSONResponse(res_p1, 200)

        self.assertEqual(len(data_p1["result"]), 2)
        self.assertEqual(data_p1["result"][0]["id"], e1.id)
        self.assertEqual(data_p1["result"][1]["id"], e2.id)

        res_p2 = self.client.get("/api/entities/", data=params | {"cursor": data_p1["next"]}, format="json")
        data_p2 = self.assertJSONResponse(res_p2, 200)

        self.assertEqual(len(data_p2["result"]), 2)
        self.assertEqual(data_p2["result"][0]["id"], e3.id)
        self.assertEqual(data_p2["result"][1]["id"], e4.id)

        res_back = self.client.get("/api/entities/", data=params | {"cursor": data_p2["previous"]}, format="json")
        data_back = self.assertJSONResponse(res_back, 200)

        self.assertEqual(len(data_back["result"]), 2)
        self.assertEqual(data_back["result"][0]["id"], e1.id)
        self.assertEqual(data_back["result"][1]["id"], e2.id)
