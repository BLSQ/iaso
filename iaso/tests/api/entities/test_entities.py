import csv
import datetime
import io
import json
import uuid

from copy import copy
from datetime import timedelta

import pytz
import time_machine

from django.core.files import File
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework import status

from hat.audit.models import ENTITY_API, INSTANCE_API, Modification, log_modification
from iaso import models as m
from iaso.api.common import EXPORTS_DATETIME_FORMAT
from iaso.models import Entity, EntityType, FormVersion, Instance, Project
from iaso.models.deduplication import ValidationStatus
from iaso.modules import MODULE_EXTERNAL_STORAGE
from iaso.permissions.core_permissions import (
    CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
    CORE_ENTITIES_PERMISSION,
    CORE_ENTITIES_WRITE_PERMISSION,
    CORE_STORAGE_PERMISSION,
)
from iaso.tests.api.entities.common_base_with_setup import EntityAPITestCase


class WebEntityAPITestCase(EntityAPITestCase):
    def test_create_single_entity(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)

        payload = {
            "name": "New Client",
            "entity_type": self.entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entities/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_multiples_entity(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4())

        second_instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4())

        payload = (
            {
                "name": "New Client",
                "entity_type": self.entity_type.pk,
                "attributes": instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
            {
                "name": "New Client 2",
                "entity_type": self.entity_type.pk,
                "attributes": second_instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
        )

        response = self.client.post("/api/entities/bulk_create/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 2)

    def test_create_entity_same_attributes(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4())

        payload = (
            {
                "name": "New Client",
                "entity_type": self.entity_type.pk,
                "attributes": instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
            {
                "name": "New Client 2",
                "entity_type": self.entity_type.pk,
                "attributes": instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
        )

        response = self.client.post("/api/entities/bulk_create/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_entity(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4())

        second_instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4())

        payload = (
            {
                "name": "New Client",
                "entity_type": self.entity_type.pk,
                "attributes": instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
            {
                "name": "New Client 2",
                "entity_type": self.entity_type.pk,
                "attributes": second_instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
        )

        self.client.post("/api/entities/bulk_create/", data=payload, format="json")

        response = self.client.get("/api/entities/", format="json")

        res_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_json, expected_length=2, results_key="result")

    def test_retrieve_entity_without_attributes(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4())

        second_instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4())

        payload = (
            {
                "name": "New Client",
                "entity_type": self.entity_type.pk,
                "attributes": instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
            {
                "name": "New Client 2",
                "entity_type": self.entity_type.pk,
                "attributes": second_instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
        )

        self.client.post("/api/entities/bulk_create/", data=payload, format="json")

        entity = Entity.objects.create(
            name="New Client 3",
            entity_type=self.entity_type,
            account=self.yoda.iaso_profile.account,
        )

        entity.refresh_from_db()

        response = self.client.get("/api/entities/", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 3)

        response = self.client.get(f"/api/entities/?entity_type_id={self.entity_type.pk}", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 3)

        response = self.client.get(f"/api/entities/{entity.pk}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_entity_without_permission_hides_nfc_cards(self):
        restricted_user = self.create_user_with_profile(
            username="restricted",
            account=self.account,
            # This user doesn't have the CORE_STORAGE_PERMISSION which is required to see nfc_cards
            permissions=[CORE_ENTITIES_PERMISSION],
        )
        self.client.force_authenticate(restricted_user)

        entity = Entity.objects.create(
            name="Top Secret Client",
            entity_type=self.entity_type,
            account=self.account,
        )

        response = self.client.get(f"/api/entities/{entity.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()
        self.assertNotIn("nfc_cards", response_data)

    def test_retrieve_entity_without_module_hides_nfc_cards(self):
        f"""nfc_cards should be hidden when the account lacks the {MODULE_EXTERNAL_STORAGE},
        even if the user has the storage permission."""

        account_without_module = m.Account.objects.create(name="Account no module", modules=[])
        sw_version = m.SourceVersion.objects.create(data_source=self.sw_source, number=99)
        account_without_module.default_version = sw_version
        account_without_module.save()

        user_with_perm_no_module = self.create_user_with_profile(
            username="has_perm_no_module",
            account=account_without_module,
            permissions=[CORE_ENTITIES_PERMISSION, CORE_STORAGE_PERMISSION],
        )
        self.client.force_authenticate(user_with_perm_no_module)

        entity_type = m.EntityType.objects.create(
            name="Type no module", reference_form=self.form_1, account=account_without_module
        )
        entity = Entity.objects.create(
            name="No Module Entity",
            entity_type=entity_type,
            account=account_without_module,
        )

        response = self.client.get(f"/api/entities/{entity.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()
        self.assertNotIn("nfc_cards", response_data)

    def test_retrieve_entity_with_permission_and_module_shows_nfc_cards(self):
        f"""nfc_cards should be present when the user has the storage permission
        and the account has the {MODULE_EXTERNAL_STORAGE}."""

        account_with_module = m.Account.objects.create(name="Account with module", modules=["EXTERNAL_STORAGE"])
        sw_version = m.SourceVersion.objects.create(data_source=self.sw_source, number=100)
        account_with_module.default_version = sw_version
        account_with_module.save()

        user_with_both = self.create_user_with_profile(
            username="has_perm_and_module",
            account=account_with_module,
            permissions=[CORE_ENTITIES_PERMISSION, CORE_STORAGE_PERMISSION],
        )
        self.client.force_authenticate(user_with_both)

        entity_type = m.EntityType.objects.create(
            name="Type with module", reference_form=self.form_1, account=account_with_module
        )
        entity = Entity.objects.create(
            name="Full Access Entity",
            entity_type=entity_type,
            account=account_with_module,
        )

        response = self.client.get(f"/api/entities/{entity.pk}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response_data = response.json()
        self.assertIn("nfc_cards", response_data)

    def test_list_entities_search_filter(self):
        """
        Test the 'search' filter of /api/entities

        This parameter allows to filter either by name, UUID, attributes (of the reference form),
        as well as explicit ids: and uuids: prefixes.
        """
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid.uuid4(),
            json={"name": "c", "age": 30, "gender": "F"},
        )

        entity_1 = Entity.objects.create(
            name="New Client",
            entity_type=self.entity_type,
            account=self.yoda.iaso_profile.account,
            attributes=instance,
        )

        second_instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid.uuid4(),
            json={"name": "c", "age": 30, "gender": "F"},
        )

        entity_2 = Entity.objects.create(
            name="Client Old",
            entity_type=self.entity_type,
            account=self.yoda.iaso_profile.account,
            attributes=second_instance,
        )

        # search by entity name - make sure it's case-insensitive and ignores white space
        response = self.client.get("/api/entities/", data={"search": " cLiEnT "}, format="json")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data["result"]), 2)

        # Search by entity UUID
        response = self.client.get("/api/entities/", data={"search": entity_1.uuid}, format="json")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data["result"]), 1)
        self.assertEqual(data["result"][0]["id"], entity_1.id)

        # Search by JSON attribute
        response = self.client.get("/api/entities/", data={"search": "30"}, format="json")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        # Both entities share the same instance attributes in this setup
        self.assertEqual(len(data["result"]), 2)

        # Multi-word search. "client new" should match "New Client"
        response = self.client.get("/api/entities/", data={"search": "client new"}, format="json")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data["result"]), 1)
        self.assertEqual(data["result"][0]["id"], entity_1.id)

        # 'ids:' prefix search
        response = self.client.get("/api/entities/", data={"search": f"ids:{entity_2.id}"}, format="json")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data["result"]), 1)
        self.assertEqual(data["result"][0]["id"], entity_2.id)

        # 'uuids:' prefix search
        response = self.client.get("/api/entities/", data={"search": f"uuids:{entity_2.uuid}"}, format="json")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(data["result"]), 1)
        self.assertEqual(data["result"][0]["id"], entity_2.id)

    def test_list_entities_annotate_duplicates(self):
        """
        Test that the list of entities at /api/entities includes duplicate annotations.

        This shouldn't result in n+1 queries.
        """
        self.client.force_authenticate(self.yoda)

        instances = Instance.objects.bulk_create(Instance(org_unit=self.ou_country, form=self.form_1) for _ in range(3))
        entities = Entity.objects.bulk_create(
            Entity(
                entity_type=self.entity_type,
                attributes=instance,
                account=self.yoda.iaso_profile.account,
            )
            for instance in instances
        )

        m.EntityDuplicate.objects.create(
            entity1=entities[0], entity2=entities[1], validation_status=ValidationStatus.PENDING
        )
        with self.assertNumQueries(9):
            response = self.client.get("/api/entities/", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.json()["result"]
        self.assertEqual(len(result), 3)
        target_result = next(item for item in result if item["id"] == entities[0].id)
        self.assertTrue(target_result["has_duplicates"])

    def test_list_entities_annotate_last_saved_at(self):
        """Test `last_saved_instance` is annotated via a cheap correlated subquery, without n+1 queries"""

        subquery_annotation = (
            """(SELECT COALESCE(U0."source_created_at", U0."created_at") AS "saved_at" """
            """FROM "iaso_instance" U0 WHERE U0."entity_id" = ("iaso_entity"."id") ORDER BY 1 DESC LIMIT 1)"""
        )

        self.client.force_authenticate(self.yoda)
        source_created_at = datetime.datetime(2025, 2, 3, tzinfo=datetime.timezone.utc)

        for i in range(3):
            entity = Entity.objects.create(entity_type=self.entity_type, account=self.yoda.iaso_profile.account)
            Instance.objects.create(
                entity=entity,
                form=self.form_1,
                source_created_at=source_created_at + timedelta(days=i),
            )

        # The subquery annotation (no join fan-out, no GROUP BY) is used regardless of ordering.
        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get("/api/entities/", data={"order": "id"}, format="json")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        result = data["result"]
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["last_saved_instance"], "2025-02-03T00:00:00Z")

        self.assertEqual(len(ctx.captured_queries), 7)
        self.assertIn(subquery_annotation, "".join(q["sql"] for q in ctx.captured_queries))

        with CaptureQueriesContext(connection) as ctx:
            response = self.client.get("/api/entities/", data={"order": "-last_saved_instance"}, format="json")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        result = data["result"]
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["last_saved_instance"], "2025-02-05T00:00:00Z")

        self.assertEqual(len(ctx.captured_queries), 5)
        self.assertIn(subquery_annotation, "".join(q["sql"] for q in ctx.captured_queries))

    @time_machine.travel(datetime.datetime(2021, 7, 18, 14, 57, 0, 1, tzinfo=datetime.timezone.utc), tick=False)
    def test_list_entities_single_entity_type(self):
        """Test the 'entityTypeIds' parameter of /api/entities with a single entity type id.

        This should result in extra columns from the type being returned for each entity."""
        self.client.force_authenticate(self.yoda)

        # We expect the intersection of the form's possible_fields
        # and the entity type's field_list_view to show up as columns
        # in the export. Other properties should be ignored.

        possible_fields = [
            {"name": "first_name", "type": "text", "label": "First Name"},
            {"name": "middle_name", "type": "text", "label": "Middle Name"},
            {"name": "last_name", "type": "text", "label": "Last Name"},
            {"name": "foobar", "type": "text", "label": "Not supposed to be here"},
        ]

        form_2 = m.Form.objects.create(
            name="Another study",
            period_type=m.MONTH,
            single_per_period=True,
            form_id="form_2",
            possible_fields=possible_fields,
        )

        form_2.projects.add(self.project)
        entity_type_2 = m.EntityType.objects.create(
            name="Type 2",
            reference_form=form_2,
            account=self.account,
            fields_list_view=["first_name", "middle_name", "last_name", "mayonnaise"],
        )

        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=form_2,
            json={
                "first_name": "Jean",
                "middle_name": "M.",
                "last_name": "Dupont",
                "mayonnaise": "yes",
                "foobar": "snafu",
            },
        )
        entity = Entity.objects.create(
            entity_type=entity_type_2,
            attributes=instance,
            account=self.yoda.iaso_profile.account,
        )

        response = self.client.get(f"/api/entities/?entity_type_ids={entity_type_2.pk}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.json()["result"]
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], entity.id)
        self.assertEqual(result[0]["first_name"], "Jean")
        self.assertEqual(result[0]["last_name"], "Dupont")
        self.assertEqual(result[0]["middle_name"], "M.")

        # Test the extra columns in the CSV export
        response = self.client.get(f"/api/entities/?entity_type_ids={entity_type_2.pk}&csv=true/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Disposition"), 'attachment; filename="entities-2021-07-18-14-57.csv"')

        # utf-8-sig automatically strips the \ufeff BOM
        response_csv = response.getvalue().decode("utf-8-sig")
        data = list(csv.reader(io.StringIO(response_csv), delimiter=","))

        expected_headers = [
            "ID",
            "UUID",
            "Entity Type",
            "Creation Date",
            "HC",
            "HC ID",
            "Last Update",
            # dynamic columns:
            "First Name",
            "Middle Name",
            "Last Name",
        ]
        self.assertEqual(data[0], expected_headers)

        row_to_test = data[-1]
        expected_row = [
            str(entity.id),
            str(entity.uuid),
            entity.entity_type.name,
            entity.created_at.strftime(EXPORTS_DATETIME_FORMAT),
            instance.org_unit.name,
            str(instance.org_unit.id),
            "2021-07-18 14:57:00",
            "Jean",
            "M.",
            "Dupont",
        ]
        self.assertEqual(row_to_test, expected_row)

    def test_list_entities_filter_by_groups_no_duplicates_when_org_unit_in_multiple_groups(self):
        """`groups` filters via `Group.org_units`, a genuine m2m: an org unit belonging to more than
        one of the requested groups must not duplicate the Entity row in the response or the count
        (guards the field_name=... -> Exists(...) rewrite in EntityFilterSet.filter_groups)."""
        self.client.force_authenticate(self.yoda)

        group_1 = m.Group.objects.create(name="Group 1", source_version=self.sw_version)
        group_2 = m.Group.objects.create(name="Group 2", source_version=self.sw_version)
        group_1.org_units.add(self.ou_country)
        group_2.org_units.add(self.ou_country)

        instance = self.create_form_instance(
            project=self.project, org_unit=self.ou_country, form=self.form_1, uuid=uuid.uuid4()
        )
        entity = m.Entity.objects.create(
            name="entity_in_two_groups",
            entity_type=self.entity_type,
            attributes=instance,
            account=self.account,
        )
        instance.entity = entity
        instance.save()

        groups_param = f"{group_1.pk},{group_2.pk}"

        response = self.client.get("/api/entities/", {"groups": groups_param})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        entity_ids = [e["id"] for e in response_json["result"]]
        self.assertEqual(entity_ids, [entity.id], f"expected a single entity, got {entity_ids}")

        count_response = self.client.get("/api/entities/count/", {"groups": groups_param})
        count_json = self.assertJSONResponse(count_response, status.HTTP_200_OK)
        self.assertEqual(count_json["count"], 1)

    def test_list_entities_columns_with_blank_label_fields(self):
        """start/end/calculate often have blank labels; columns must still be returned."""
        self.client.force_authenticate(self.yoda)

        possible_fields = [
            {"name": "first_name", "type": "text", "label": "First Name"},
            {"name": "start", "type": "start", "label": ""},
            {"name": "end", "type": "end", "label": ""},
            {"name": "score", "type": "calculate", "label": ""},
        ]
        form = m.Form.objects.create(
            name="Meta fields form",
            form_id="meta_fields_form",
            possible_fields=possible_fields,
        )
        form.projects.add(self.project)
        entity_type = m.EntityType.objects.create(
            name="Type with meta fields",
            reference_form=form,
            account=self.account,
            fields_list_view=["first_name", "start", "end", "score"],
        )
        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=form,
            json={
                "first_name": "Ada",
                "start": "2026-08-07T10:00:00.000+02:00",
                "end": "2026-08-07T10:05:00.000+02:00",
                "score": "42",
            },
        )
        entity = Entity.objects.create(
            entity_type=entity_type,
            attributes=instance,
            account=self.yoda.iaso_profile.account,
        )

        response = self.client.get(f"/api/entities/?entity_type_ids={entity_type.pk}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(len(payload["result"]), 1)
        self.assertEqual(payload["result"][0]["id"], entity.id)
        self.assertEqual(payload["result"][0]["start"], "2026-08-07T10:00:00.000+02:00")
        self.assertEqual(payload["result"][0]["score"], "42")

        columns_by_name = {column["name"]: column for column in payload["columns"]}
        self.assertEqual(set(columns_by_name), {"first_name", "start", "end", "score"})
        self.assertEqual(columns_by_name["start"]["label"], "start")
        self.assertEqual(columns_by_name["end"]["label"], "end")
        self.assertEqual(columns_by_name["score"]["label"], "score")

    def test_list_entities_search_uuid_filter(self):
        """
        Test the 'uuids:' search filter of /api/entities with comma-separated UUIDs
        """
        self.client.force_authenticate(self.yoda)

        # Create multiple entities with different UUIDs
        instance1 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"name": "Entity 1", "age": 25},
        )
        entity1 = Entity.objects.create(
            name="Entity 1",
            entity_type=self.entity_type,
            attributes=instance1,
            account=self.yoda.iaso_profile.account,
        )

        instance2 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"name": "Entity 2", "age": 30},
        )
        entity2 = Entity.objects.create(
            name="Entity 2",
            entity_type=self.entity_type,
            attributes=instance2,
            account=self.yoda.iaso_profile.account,
        )

        instance3 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"name": "Entity 3", "age": 35},
        )
        entity3 = Entity.objects.create(
            name="Entity 3",
            entity_type=self.entity_type,
            attributes=instance3,
            account=self.yoda.iaso_profile.account,
        )

        # Test single UUID search
        response = self.client.get(f"/api/entities/?search=uuids:{entity1.uuid}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(response.json()["result"][0]["id"], entity1.id)

        # Test multiple UUIDs search with comma separation
        uuids = f"{entity1.uuid},{entity2.uuid}"
        response = self.client.get(f"/api/entities/?search=uuids:{uuids}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(entity1.id, result_ids)
        self.assertIn(entity2.id, result_ids)

        # Test with spaces around commas
        uuids_with_spaces = f"{entity1.uuid} , {entity3.uuid}"
        response = self.client.get(f"/api/entities/?search=uuids:{uuids_with_spaces}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(entity1.id, result_ids)
        self.assertIn(entity3.id, result_ids)

        # Test with non-existent UUID mixed in
        fake_uuid = "8872aafb-651f-4b0f-89af-35f0a06d9b44"
        uuids_with_fake = f"{entity1.uuid},{fake_uuid}"
        response = self.client.get(f"/api/entities/?search=uuids:{uuids_with_fake}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(response.json()["result"][0]["id"], entity1.id)

        # Test invalid UUIDs
        invalid_uuids = "8872wwfb-651f 4b0f-89af 35f0a06d9b44"
        response = self.client.get(f"/api/entities/?search=uuids:{invalid_uuids}", format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json(), ["Failed parsing uuids in search 'uuids:8872wwfb-651f 4b0f-89af 35f0a06d9b44'"]
        )

    def test_list_entities_search_ids_filter(self):
        """
        Test the 'ids:' search filter of /api/entities with comma-separated IDs
        """
        self.client.force_authenticate(self.yoda)

        # Create multiple entities
        instance1 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"name": "Entity 1", "age": 25},
        )
        entity1 = Entity.objects.create(
            name="Entity 1",
            entity_type=self.entity_type,
            attributes=instance1,
            account=self.yoda.iaso_profile.account,
        )

        instance2 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"name": "Entity 2", "age": 30},
        )
        entity2 = Entity.objects.create(
            name="Entity 2",
            entity_type=self.entity_type,
            attributes=instance2,
            account=self.yoda.iaso_profile.account,
        )

        instance3 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"name": "Entity 3", "age": 35},
        )
        entity3 = Entity.objects.create(
            name="Entity 3",
            entity_type=self.entity_type,
            attributes=instance3,
            account=self.yoda.iaso_profile.account,
        )

        # Test single ID search
        response = self.client.get(f"/api/entities/?search=ids:{entity1.id}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(response.json()["result"][0]["id"], entity1.id)

        # Test multiple IDs search with comma separation
        ids = f"{entity1.id},{entity2.id}"
        response = self.client.get(f"/api/entities/?search=ids:{ids}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(entity1.id, result_ids)
        self.assertIn(entity2.id, result_ids)

        # Test with spaces around commas
        ids_with_spaces = f"{entity1.id} , {entity3.id}"
        response = self.client.get(f"/api/entities/?search=ids:{ids_with_spaces}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(entity1.id, result_ids)
        self.assertIn(entity3.id, result_ids)

        # Test with non-existent ID mixed in
        fake_id = 99999
        ids_with_fake = f"{entity1.id},{fake_id}"
        response = self.client.get(f"/api/entities/?search=ids:{ids_with_fake}", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(response.json()["result"][0]["id"], entity1.id)

    def test_list_entities_filter_by_date(self):
        """
        Test the date filters of /api/entities

        The parameters `date_from` and `date_to` allow filtering on the date of creation*
        on any of the forms linked to the entity.
        *The creation on the device with fallback to the DB created_at.
        """
        self.client.force_authenticate(self.yoda)

        date1 = datetime.datetime(2024, 9, 12, 0, 0, 5, tzinfo=pytz.UTC)
        date2 = datetime.datetime(2024, 9, 13, 0, 0, 5, tzinfo=pytz.UTC)
        date3 = datetime.datetime(2024, 9, 14, 0, 0, 5, tzinfo=pytz.UTC)
        date1_str = date1.strftime("%Y-%m-%d")
        date2_str = date2.strftime("%Y-%m-%d")
        date3_str = date3.strftime("%Y-%m-%d")

        entity_type = EntityType.objects.create(name="ET", reference_form=self.form_1)

        # Create 2 entities: one on date1, one on date2
        instance1 = Instance.objects.create(form=self.form_1, source_created_at=date1)
        entity1 = Entity.objects.create(entity_type=entity_type, attributes=instance1, account=self.account)
        instance1.entity = entity1
        instance1.save()

        instance2 = Instance.objects.create(form=self.form_1, source_created_at=date2)
        entity2 = Entity.objects.create(entity_type=entity_type, attributes=instance2, account=self.account)
        instance2.entity = entity2
        instance2.save()

        # Search on specific date
        response = self.client.get(f"/api/entities/?dateFrom={date1_str}&dateTo={date1_str}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)
        results = response.json()["result"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], entity1.id)

        # Search on date range
        response = self.client.get(f"/api/entities/?dateFrom={date1_str}&dateTo={date2_str}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()["result"]
        self.assertEqual(len(results), 2)
        self.assertEqual(set(r["id"] for r in results), set((entity1.id, entity2.id)))

        # Search on only from date
        response = self.client.get(f"/api/entities/?dateFrom={date2_str}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()["result"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], entity2.id)
        response = self.client.get(f"/api/entities/?dateFrom={date3_str}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()["result"]
        self.assertEqual(len(results), 0)

        # Search on only to date
        response = self.client.get(f"/api/entities/?dateTo={date1_str}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.json()["result"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], entity1.id)

    def test_list_entities_search_in_instances(self):
        """
        Test the 'fields_search' filter of /api/entities

        This parameter allows to filter entities based on the presence of a
        form instance with certain attributes.
        """
        self.client.force_authenticate(self.yoda)
        self.form_2 = m.Form.objects.create(name="Form 2", form_id="form_2")

        # Entity 1 - Female from Bujumbura
        ent1_instance1 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"gender": "F", "age__int__": "28"},
        )
        ent1 = Entity.objects.create(
            name="Ent 1",
            entity_type=self.entity_type,
            attributes=ent1_instance1,
            account=self.account,
        )
        ent1_instance1.entity = ent1
        ent1_instance1.save()
        Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_2,
            json={"residence": "Bujumbura"},
            entity=ent1,
        )

        # Entity 2 - Male from Kinshasa
        ent2_instance1 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"gender": "M", "age__int__": "56"},
        )
        ent2 = Entity.objects.create(
            name="Ent 1",
            entity_type=self.entity_type,
            attributes=ent2_instance1,
            account=self.account,
        )
        ent2_instance1.entity = ent2
        ent2_instance1.save()
        Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_2,
            json={"residence": "Kinshasa"},
            entity=ent2,
        )
        Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_2,
            json={"residence": "Accra"},
            entity=ent2,
        )

        # gender f AND SOME residence Bujumbura
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "some", "F", "Bujumbura")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], ent1.id)

        # gender m AND SOME residence Bujumbura
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "some", "M", "Bujumbura")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 0)

        # gender f OR SOME residence Kinshasa
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("or", "some", "F", "Kinshasa")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertEqual(sorted(result_ids), sorted([ent1.id, ent2.id]))

        # gender m AND SOME residence Kinshasa
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "some", "M", "Kinshasa")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], ent2.id)

        # gender M AND ALL residence Kinshasa
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "all", "M", "Kinshasa")},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 0)

        # age is 56
        response = self.client.get(
            "/api/entities/",
            {
                "fields_search": json.dumps(
                    {
                        "some": [
                            {"var": self.form_1.form_id},
                            {"==": [{"var": "age__int__"}, 56]},
                        ]
                    }
                )
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], ent2.id)

    def test_list_entities_fields_search_like_and_empty_operators(self):
        """Query-builder like / not_like / is_empty / is_not_empty inside fields_search."""
        self.client.force_authenticate(self.yoda)

        matching_instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"responsable_fosa": "Jean Beau"},
        )
        matching = Entity.objects.create(
            name="Matching",
            entity_type=self.entity_type,
            attributes=matching_instance,
            account=self.account,
        )
        matching_instance.entity = matching
        matching_instance.save()

        empty_instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"responsable_fosa": ""},
        )
        empty = Entity.objects.create(
            name="Empty",
            entity_type=self.entity_type,
            attributes=empty_instance,
            account=self.account,
        )
        empty_instance.entity = empty
        empty_instance.save()

        other_instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"responsable_fosa": "Alice"},
        )
        other = Entity.objects.create(
            name="Other",
            entity_type=self.entity_type,
            attributes=other_instance,
            account=self.account,
        )
        other_instance.entity = other
        other_instance.save()

        like_filter = json.dumps(
            {"some": [{"var": self.form_1.form_id}, {"in": ["Beau", {"var": "responsable_fosa"}]}]}
        )
        response = self.client.get("/api/entities/", {"fields_search": like_filter})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(matching.id, result_ids)
        self.assertNotIn(empty.id, result_ids)
        self.assertNotIn(other.id, result_ids)

        not_like_filter = json.dumps(
            {"some": [{"var": self.form_1.form_id}, {"!": {"in": ["Beau", {"var": "responsable_fosa"}]}}]}
        )
        response = self.client.get("/api/entities/", {"fields_search": not_like_filter})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(other.id, result_ids)
        self.assertNotIn(matching.id, result_ids)

        empty_filter = json.dumps({"some": [{"var": self.form_1.form_id}, {"!": {"var": "responsable_fosa"}}]})
        response = self.client.get("/api/entities/", {"fields_search": empty_filter})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(empty.id, result_ids)
        self.assertNotIn(matching.id, result_ids)
        self.assertNotIn(other.id, result_ids)

        not_empty_filter = json.dumps({"some": [{"var": self.form_1.form_id}, {"!!": {"var": "responsable_fosa"}}]})
        response = self.client.get("/api/entities/", {"fields_search": not_empty_filter})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(matching.id, result_ids)
        self.assertIn(other.id, result_ids)
        self.assertNotIn(empty.id, result_ids)

    def _generate_json_filter(self, operator, some_or_all, gender, residence):
        return json.dumps(
            {
                operator: [
                    {
                        some_or_all: [
                            {"var": self.form_1.form_id},
                            {"==": [{"var": "gender"}, gender]},
                        ]
                    },
                    {
                        some_or_all: [
                            {"var": self.form_2.form_id},
                            {"==": [{"var": "residence"}, residence]},
                        ]
                    },
                ]
            }
        )

    def test_list_entities_fields_search_soft_deleted_instances(self):
        self.client.force_authenticate(self.yoda)
        self.form_2 = m.Form.objects.create(name="Form 2", form_id="form_2")

        ent1_instance1 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"gender": "F"},
        )
        ent1 = Entity.objects.create(
            name="Ent 1",
            entity_type=self.entity_type,
            attributes=ent1_instance1,
            account=self.account,
        )
        ent1_instance1.entity = ent1
        ent1_instance1.save()

        inst2 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_2,
            json={"residence": "Bujumbura"},
            entity=ent1,
        )

        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "some", "F", "Bujumbura")},
        )
        res = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(res["result"]), 1)

        # Soft-delete non-attributes instance
        inst2.deleted = True
        inst2.save()

        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "some", "F", "Bujumbura")},
        )
        res = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(res["result"]), 0)

        # Restore non-attributes instance, and soft-delete attributes instance
        inst2.deleted = False
        inst2.save()
        ent1_instance1.deleted = True
        ent1_instance1.save()

        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "some", "F", "Bujumbura")},
        )
        res = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(res["result"]), 0)

    def test_list_entities_filter_by_date_soft_deleted_instances(self):
        self.client.force_authenticate(self.yoda)

        source_date_attr = datetime.datetime(2024, 9, 12, 0, 0, 5, tzinfo=pytz.UTC)
        source_date_attr_str = source_date_attr.strftime("%Y-%m-%d")

        source_date = datetime.datetime(2024, 10, 15, 0, 0, 5, tzinfo=pytz.UTC)
        source_date_str = source_date.strftime("%Y-%m-%d")

        entity_type = EntityType.objects.create(name="ET", reference_form=self.form_1)

        # initialize both an attribute and non-attribute Instance
        inst_attr = Instance.objects.create(form=self.form_1, source_created_at=source_date_attr)
        entity = Entity.objects.create(entity_type=entity_type, attributes=inst_attr, account=self.account)
        inst_attr.entity = entity
        inst_attr.save()

        inst = Instance.objects.create(form=self.form_1, source_created_at=source_date, entity=entity)

        # test regular instance
        response = self.client.get(f"/api/entities/?dateFrom={source_date_str}&dateTo={source_date_str}")
        resp = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(resp["result"]), 1)

        inst.deleted = True
        inst.save()

        response = self.client.get(f"/api/entities/?dateFrom={source_date_str}&dateTo={source_date_str}")
        res = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(res["result"]), 0)

        # test attribute instance
        response = self.client.get(f"/api/entities/?dateFrom={source_date_attr_str}&dateTo={source_date_attr_str}")
        resp = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(resp["result"]), 1)

        inst_attr.deleted = True
        inst_attr.save()

        response = self.client.get(f"/api/entities/?dateFrom={source_date_attr_str}&dateTo={source_date_attr_str}")
        res = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(len(res["result"]), 0)

    def test_list_entities_prefetch_soft_deleted_instances(self):
        self.client.force_authenticate(self.yoda)

        entity_type = EntityType.objects.create(name="ET2", reference_form=self.form_1)

        # Entity with 1 active instance and 1 soft-deleted instance
        instance_active = Instance.objects.create(form=self.form_1)
        entity = Entity.objects.create(entity_type=entity_type, attributes=instance_active, account=self.account)
        instance_active.entity = entity
        instance_active.save()

        Instance.objects.create(form=self.form_1, entity=entity, deleted=True)

        response = self.client.get(f"/api/entities/{entity.id}/", format="json")
        resp = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(len(resp["instances"]), 1)
        self.assertEqual(resp["instances"][0], instance_active.id)

    def test_get_entity_by_id(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
        )

        payload = {
            "name": "New Client",
            "entity_type": self.entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/", data=payload, format="json")

        response = self.client.get(f"/api/entities/{Entity.objects.last().pk}/", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()["id"], Entity.objects.last().pk)

    def test_handle_wrong_attributes(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": "New Client",
            "entity_type": self.entity_type.pk,
            "attributes": 2324,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entities/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_entity(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid.uuid4(),
        )

        payload_post = {
            "name": "New Client",
            "entity_type": self.entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/", data=payload_post, format="json")

        payload = {
            "name": "New Client-2",
            "entity_type": self.entity_type.pk,
            "attributes": instance.pk,
        }

        response = self.client.patch(f"/api/entities/{Entity.objects.last().pk}/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_only_non_deleted_entity(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid.uuid4(),
        )

        second_instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid.uuid4(),
        )

        payload = (
            {
                "name": "New Client",
                "entity_type": self.entity_type.pk,
                "attributes": instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
            {
                "name": "New Client 2",
                "entity_type": self.entity_type.pk,
                "attributes": second_instance.uuid,
                "account": self.yoda.iaso_profile.account.pk,
            },
        )

        self.client.post("/api/entities/bulk_create/", data=payload, format="json")
        self.client.force_authenticate(self.entity_writer)
        self.client.delete(f"/api/entities/{Entity.objects.last().pk}/", format="json")

        response = self.client.get("/api/entities/", format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)

    def test_cant_create_entity_without_attributes(self):
        self.client.force_authenticate(self.yoda)

        payload = {
            "name": "New Client",
            "entity_type": self.entity_type.pk,
            "attributes": None,
            "account": self.yoda.iaso_profile.account.pk,
        }

        response = self.client.post("/api/entities/", data=payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_entity_only_same_account(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        second_instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)

        Entity.objects.create(
            name="New Client",
            entity_type=self.entity_type,
            attributes=instance,
            account=self.yop_solo.iaso_profile.account,
        )
        Entity.objects.create(
            name="New Client",
            entity_type=self.entity_type,
            attributes=second_instance,
            account=self.yoda.iaso_profile.account,
        )

        response = self.client.get("/api/entities/", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()["result"]), 1)

    @time_machine.travel(datetime.datetime(2021, 7, 18, 14, 57, 0, 1, tzinfo=datetime.timezone.utc), tick=False)
    def test_export_entities(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        entity = Entity.objects.create(
            entity_type=self.entity_type,
            attributes=instance,
            account=self.yoda.iaso_profile.account,
        )

        # export all entities type as csv
        response = self.client.get("/api/entities/?csv=true/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Disposition"), 'attachment; filename="entities-2021-07-18-14-57.csv"')

        # export all entities type as xlsx
        response = self.client.get("/api/entities/?xlsx=true/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Disposition"), 'attachment; filename="entities-2021-07-18-14-57.xlsx"')

        # export specific entity type as xlsx
        response = self.client.get(f"/api/entities/?entity_type_ids={self.entity_type.pk}&xlsx=true/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Disposition"), 'attachment; filename="entities-2021-07-18-14-57.xlsx"')

        # export specific entity type as csv
        response = self.client.get(f"/api/entities/?entity_type_ids={self.entity_type.pk}&csv=true/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Disposition"), 'attachment; filename="entities-2021-07-18-14-57.csv"')

        # Check the contents of the last CSV file
        response_csv = response.getvalue().decode("utf-8")
        response_string = "".join(s for s in response_csv)
        data = list(csv.reader(io.StringIO(response_string), delimiter=","))
        row_to_test = data[len(data) - 1]

        expected_row = [
            str(entity.id),
            str(entity.uuid),
            entity.entity_type.name,
            entity.created_at.strftime(EXPORTS_DATETIME_FORMAT),
            instance.org_unit.name,
            str(instance.org_unit.id),
            "2021-07-18 14:57:00",
        ]
        self.assertEqual(row_to_test, expected_row)

    @time_machine.travel(datetime.datetime(2021, 7, 18, 14, 57, 0, 1, tzinfo=datetime.timezone.utc), tick=False)
    def test_entities_empty_export(self):
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/entities/?csv=true/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Disposition"), 'attachment; filename="entities-2021-07-18-14-57.csv"')

        response_csv = response.getvalue().decode("utf-8")
        response_string = "".join(s for s in response_csv)

        self.assertEqual(response_string, "\ufeff")

        response = self.client.get("/api/entities/?xlsx=true/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.get("Content-Disposition"), 'attachment; filename="entities-2021-07-18-14-57.xlsx"')

        response_xlsx = response.getvalue()
        self.assertEqual(response_xlsx, b"")

    def test_handle_export_entity_type_empty_field_list(self):
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        entity = Entity.objects.create(
            entity_type=self.entity_type,
            account=self.yop_solo.iaso_profile.account,
        )
        entity.attributes = instance
        entity.save()

        response = self.client.get("/api/entities/?xlsx=true/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_entity_mobile(self):
        self.client.force_authenticate(self.yoda)

        self.yoda.iaso_profile.org_units.set([self.ou_country])

        self.form_1.form_id = "A_FORM_ID"
        self.form_1.json = {"_version": "A_FORM_ID"}
        self.form_1.save()

        FormVersion.objects.create(form=self.form_1, version_id="A_FORM_ID")

        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g3",
        )

        self.form_1.instances.set([instance])
        self.form_1.save()

        entity = Entity.objects.create(
            name="New Client",
            entity_type=self.entity_type,
            attributes=instance,
            account=self.yoda.iaso_profile.account,
        )
        instance.entity = entity
        instance.save()

        response = self.client.get(f"/api/mobile/entities/?app_id={self.project.app_id}")

        data = response.json().get("results")[0]

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data.get("id"), str(entity.uuid))
        self.assertEqual(data.get("defining_instance_id"), str(instance.uuid))

        response = self.client.get(f"/api/mobile/entities/{entity.uuid}/?app_id={self.project.app_id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(data.get("id"), str(entity.uuid))

    def test_list_entities_mobile_with_multi_projects(self):
        """
        Ensure entities are filtered by projects.
        """
        other_project = m.Project.objects.create(
            name="Distribution of mosquito nets",
            app_id="mos.quito",
            account=self.account,
        )
        form = m.Form.objects.create(name="Identification", period_type=m.MONTH, single_per_period=True)
        form.projects.add(other_project)

        instance_1 = Instance.objects.create(org_unit=self.ou_country, form=form)
        instance_2 = Instance.objects.create(org_unit=self.ou_country, form=form)
        entity_type_civilian = EntityType.objects.create(
            name="Civilian",
            reference_form=form,
            account=self.account,
        )
        Entity.objects.create(entity_type=entity_type_civilian, account=self.account, attributes=instance_1)
        Entity.objects.create(entity_type=entity_type_civilian, account=self.account, attributes=instance_2)

        self.client.force_authenticate(self.yoda)

        # The list should be restricted to the first project.
        entity_in_first_project = Entity.objects.filter(
            entity_type__reference_form__projects__app_id=self.project.app_id
        )
        self.assertEqual(0, entity_in_first_project.count())
        response = self.client.get(f"/api/mobile/entities/?app_id={self.project.app_id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(0, response.data["count"])

        # The list should be restricted to the other project.
        entity_in_other_project = Entity.objects.filter(
            entity_type__reference_form__projects__app_id=other_project.app_id
        )
        self.assertEqual(2, entity_in_other_project.count())
        response = self.client.get(f"/api/mobile/entities/?app_id={other_project.app_id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(2, response.data["count"])
        for item in response.data["results"]:
            self.assertEqual(item["entity_type_id"], str(entity_type_civilian.pk))

    def test_entity_mobile_user(self):
        self.client.force_authenticate(self.yoda)

        self.form_1.form_id = "A_FORM_ID"
        self.form_1.json = {"_version": "A_FORM_ID"}
        self.form_1.projects.add(self.project)
        self.form_1.save()

        FormVersion.objects.create(form=self.form_1, version_id="A_FORM_ID")

        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g3",
        )
        instance.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "A_FORM_ID",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance.save()

        instance2 = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g6",
        )
        instance2.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance2.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "A_FORM_ID",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance2.save()

        instance_unvalidated_ou = Instance.objects.create(
            org_unit=self.ou_country_unvalidated,
            form=self.form_1,
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g4",
        )
        instance_unvalidated_ou.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance_unvalidated_ou.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "A_FORM_ID",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance_unvalidated_ou.save()

        instance_entity_no_attributes = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            project=self.project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g5",
        )
        instance_entity_no_attributes.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance_entity_no_attributes.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "A_FORM_ID",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance_entity_no_attributes.save()

        self.form_1.instances.set([instance, instance_unvalidated_ou, instance_entity_no_attributes])
        self.form_1.save()

        entity = Entity.objects.create(
            name="New Client",
            entity_type=self.entity_type,
            attributes=instance,
            account=self.yoda.iaso_profile.account,
        )

        entity_unvalidated = Entity.objects.create(
            name="New Client",
            entity_type=self.entity_type,
            attributes=instance_unvalidated_ou,
            account=self.yoda.iaso_profile.account,
        )

        entity_no_attributes = Entity.objects.create(
            name="New Client_2",
            entity_type=self.entity_type,
            account=self.yop_solo.iaso_profile.account,
        )

        instance2.entity = entity
        instance2.save()

        # shouldn't appear
        instance_unvalidated_ou.entity = entity_unvalidated
        instance_unvalidated_ou.save()

        # shouldn't appear
        instance_entity_no_attributes.entity = entity_no_attributes
        instance_entity_no_attributes.save()

        response = self.client.get(f"/api/mobile/entities/?app_id={self.project.app_id}")

        response_json = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_json.get("count"), 2)
        self.assertEqual(
            response_json.get("results")[0].get("entity_type_id"),
            str(self.entity_type.id),
        )
        self.assertEqual(len(response_json.get("results")[0].get("instances")), 1)
        self.assertEqual(
            response_json.get("results")[1].get("entity_type_id"),
            str(self.entity_type.id),
        )
        self.assertEqual(len(response_json.get("results")[1].get("instances")), 0)

    def test_access_respect_appid_mobile(self):
        self.client.force_authenticate(self.yoda)

        app_id = "APP_ID"

        project = Project.objects.create(name="Project 1", app_id=app_id, account=self.account)
        project.account = self.account
        project.save()

        self.form_1.projects.add(project)

        # we should return only the entities whose instaces/attributes are linked to this project.

        instance_app_id = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            project=project,
            uuid="9335359a-9f80-422d-997a-68ae7e39d9g3",
        )
        instance_app_id.file = File(open("iaso/tests/fixtures/test_entity_data2.xml", "rb"))
        instance_app_id.json = {
            "name": "Prince of Euphor",
            "father_name": "Professor Procyon",
            "age_type": 0,
            "birth_date": "1978-07-03",
            "gender": "male",
            "hc": "hc_C",
            "_version": "2022090602",
            "instanceID": "uuid:4901dff4-30af-49e2-afd1-42970bb8f03e",
        }
        instance_app_id.save()

        entity_app_id = Entity.objects.create(
            name="New Client",
            entity_type=self.entity_type,
            attributes=instance_app_id,
            account=self.yoda.iaso_profile.account,
        )

        instance_app_id.entity = entity_app_id
        instance_app_id.save()

        FormVersion.objects.create(version_id="2022090602", form_id=instance_app_id.form.id)

        self.form_1.instances.add(instance_app_id)
        self.form_1.save()

        response = self.client.get(f"/api/mobile/entities/?app_id={app_id}")

        response_json = response.json()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response_json["count"], 1)
        self.assertEqual(response_json["results"][0]["entity_type_id"], str(self.entity_type.id))

        response_entity_instance = response_json["results"][0]["instances"]

        self.assertEqual(response_entity_instance[0]["id"], instance_app_id.uuid)
        self.assertEqual(response_entity_instance[0]["json"], instance_app_id.json)

    def test_retrieve_entities_user_geo_restrictions(self):
        version = self.account.default_version
        province_type = m.OrgUnitType.objects.create(name="Province", short_name="province", depth=1)
        district_type = m.OrgUnitType.objects.create(name="District", short_name="district", depth=2)
        village_type = m.OrgUnitType.objects.create(name="Village", short_name="village", depth=3)
        province = m.OrgUnit.objects.create(name="Province", org_unit_type=province_type, version=version)
        district_1 = m.OrgUnit.objects.create(
            name="District 1",
            org_unit_type=district_type,
            version=version,
            parent=province,
        )
        village_1 = m.OrgUnit.objects.create(
            name="Village 1",
            org_unit_type=village_type,
            version=version,
            parent=district_1,
        )
        district_2 = m.OrgUnit.objects.create(
            name="District 2",
            org_unit_type=district_type,
            version=version,
            parent=province,
        )
        village_2 = m.OrgUnit.objects.create(
            name="Village 2",
            org_unit_type=village_type,
            version=version,
            parent=district_2,
        )

        user_manager = self.create_user_with_profile(
            username="userManager",
            account=self.account,
            permissions=[CORE_ENTITIES_PERMISSION],
        )
        user_manager.iaso_profile.org_units.set([district_1])
        user_manager.save()
        user_manager.refresh_from_db()
        self.client.force_authenticate(user_manager)

        # Village 1 (district 1): instance + entity
        instance_1 = Instance.objects.create(org_unit=village_1, form=self.form_1)
        entity = Entity.objects.create(entity_type=self.entity_type, attributes=instance_1, account=self.account)
        instance_1.entity = entity
        instance_1.save()

        # Village 2 (district 2): instance + entity
        instance_2 = Instance.objects.create(org_unit=village_2, form=self.form_1)
        entity_2 = Entity.objects.create(entity_type=self.entity_type, attributes=instance_2, account=self.account)
        instance_2.entity = entity_2
        instance_2.save()

        response = self.client.get("/api/entities/", format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        json_result = response.json()["result"]
        self.assertEqual(len(json_result), 1)
        self.assertEqual(json_result[0]["org_unit"]["name"], village_1.name)

    def test_delete_entity(self):
        """
        DELETE /api/entities/pk/

        This should do a soft-delete of the entity, along with instances and
        potential EntityDuplicate pairs
        """
        self.client.force_authenticate(self.entity_writer)
        self.form_2 = m.Form.objects.create(name="Form 2", form_id="form_2")

        # Create Entity with ref instance
        ent_ref_instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        ent = Entity.objects.create(
            entity_type=self.entity_type,
            attributes=ent_ref_instance,
            account=self.account,
        )
        ent_ref_instance.entity = ent
        ent_ref_instance.save()

        # Add two more instances to the entity
        inst1 = Instance.objects.create(org_unit=self.ou_country, form=self.form_2, entity=ent)
        inst2 = Instance.objects.create(org_unit=self.ou_country, form=self.form_2, entity=ent)

        # Create duplicate pairs for the entity: a PENDING and a VALIDATED one
        m.EntityDuplicate.objects.create(
            entity1=ent,
            entity2=Entity.objects.create(entity_type=self.entity_type, account=self.account),
            validation_status=ValidationStatus.PENDING,
        )
        m.EntityDuplicate.objects.create(
            entity1=ent,
            entity2=Entity.objects.create(entity_type=self.entity_type, account=self.account),
            validation_status=ValidationStatus.VALIDATED,
        )
        self.assertEqual(m.EntityDuplicate.objects.count(), 2)

        response = self.client.delete(f"/api/entities/{ent.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        ent.refresh_from_db()
        self.assertIsNotNone(ent.deleted_at)
        for inst in [ent_ref_instance, inst1, inst2]:
            inst.refresh_from_db()
            self.assertTrue(inst.deleted)
        self.assertEqual(m.EntityDuplicate.objects.count(), 1)  # only pending removed
        # The entity and its 3 submissions are logged
        self.assertEqual(Modification.objects.filter(source=ENTITY_API, user=self.entity_writer).count(), 4)

    def test_delete_entity_of_other_account_returns_404(self):
        """
        DELETE /api/entities/pk/ on an entity of another account must not
        touch the entity nor its instances.
        """
        other_account_writer = self.create_user_with_profile(
            username="other_account_writer",
            account=self.yop_solo.iaso_profile.account,
            permissions=[CORE_ENTITIES_PERMISSION, CORE_ENTITIES_WRITE_PERMISSION],
        )
        self.client.force_authenticate(other_account_writer)

        ent_ref_instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        ent = Entity.objects.create(
            entity_type=self.entity_type,
            attributes=ent_ref_instance,
            account=self.account,
        )
        ent_ref_instance.entity = ent
        ent_ref_instance.save()
        inst = Instance.objects.create(org_unit=self.ou_country, form=self.form_1, entity=ent)

        response = self.client.delete(f"/api/entities/{ent.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        ent.refresh_from_db()
        self.assertIsNone(ent.deleted_at)
        for instance in [ent_ref_instance, inst]:
            instance.refresh_from_db()
            self.assertFalse(instance.deleted)

    def test_delete_unknown_entity_returns_404(self):
        self.client.force_authenticate(self.entity_writer)

        response = self.client.delete("/api/entities/999999999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def _create_entity_with_instances(self, nb_extra_instances=1):
        ref_instance = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        entity = Entity.objects.create(entity_type=self.entity_type, attributes=ref_instance, account=self.account)
        ref_instance.entity = entity
        ref_instance.save()
        extra_instances = [
            Instance.objects.create(org_unit=self.ou_country, form=self.form_1, entity=entity)
            for _ in range(nb_extra_instances)
        ]
        return entity, [ref_instance, *extra_instances]

    def test_delete_entity_without_write_permission_is_forbidden(self):
        entity, instances = self._create_entity_with_instances()
        self.client.force_authenticate(self.yoda)

        response = self.client.delete(f"/api/entities/{entity.id}/")
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        entity.refresh_from_db()
        self.assertIsNone(entity.deleted_at)
        for instance in instances:
            instance.refresh_from_db()
            self.assertFalse(instance.deleted)

    def test_delete_already_deleted_entity_returns_400(self):
        entity, _ = self._create_entity_with_instances()
        self.client.force_authenticate(self.entity_writer)
        self.assertJSONResponse(self.client.delete(f"/api/entities/{entity.id}/"), status.HTTP_200_OK)
        entity.refresh_from_db()
        deleted_at = entity.deleted_at

        response = self.client.delete(f"/api/entities/{entity.id}/")
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        entity.refresh_from_db()
        self.assertEqual(entity.deleted_at, deleted_at)

    def test_list_and_count_deleted_entities(self):
        active, _ = self._create_entity_with_instances()
        deleted, _ = self._create_entity_with_instances()
        self.client.force_authenticate(self.entity_writer)
        self.assertJSONResponse(self.client.delete(f"/api/entities/{deleted.id}/"), status.HTTP_200_OK)

        # Hidden by default, in the list and in the cursor-pagination count
        data = self.assertJSONResponse(self.client.get("/api/entities/"), status.HTTP_200_OK)
        self.assertEqual([e["id"] for e in data["result"]], [active.id])
        self.assertIsNone(data["result"][0]["deleted_at"])
        self.assertEqual(
            self.assertJSONResponse(self.client.get("/api/entities/count/"), status.HTTP_200_OK)["count"], 1
        )

        data = self.assertJSONResponse(
            self.client.get("/api/entities/", {"deletion_status": "deleted"}), status.HTTP_200_OK
        )
        self.assertEqual([e["id"] for e in data["result"]], [deleted.id])
        self.assertIsNotNone(data["result"][0]["deleted_at"])
        self.assertEqual(
            self.assertJSONResponse(
                self.client.get("/api/entities/count/", {"deletion_status": "deleted"}), status.HTTP_200_OK
            )["count"],
            1,
        )

        data = self.assertJSONResponse(
            self.client.get("/api/entities/", {"deletion_status": "all"}), status.HTTP_200_OK
        )
        self.assertEqual({e["id"] for e in data["result"]}, {active.id, deleted.id})

    def test_retrieve_deleted_entity_but_not_update_it(self):
        entity, _ = self._create_entity_with_instances()
        self.client.force_authenticate(self.entity_writer)
        self.assertJSONResponse(self.client.delete(f"/api/entities/{entity.id}/"), status.HTTP_200_OK)

        response = self.client.get(f"/api/entities/{entity.id}/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertIsNotNone(data["deleted_at"])

        response = self.client.patch(f"/api/entities/{entity.id}/", data={"name": "new"}, format="json")
        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

    def _delete_submission_on_its_own(self, instance):
        """Delete a submission as the submissions API does: soft delete, with an audit log entry."""
        original = copy(instance)
        instance.soft_delete()
        log_modification(original, instance, INSTANCE_API, user=self.entity_writer)
        return instance

    def test_restore_entity(self):
        """
        POST /api/entities/pk/restore/

        Restores the entity and the submissions deleted with it, not the ones deleted before.
        """
        entity, instances = self._create_entity_with_instances(nb_extra_instances=2)
        deleted_before = self._delete_submission_on_its_own(
            Instance.objects.create(org_unit=self.ou_country, form=self.form_1, entity=entity)
        )
        self.client.force_authenticate(self.entity_writer)
        self.assertJSONResponse(self.client.delete(f"/api/entities/{entity.id}/"), status.HTTP_200_OK)

        response = self.client.post(f"/api/entities/{entity.id}/restore/")
        data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertIsNone(data["deleted_at"])

        entity.refresh_from_db()
        self.assertIsNone(entity.deleted_at)
        for instance in instances:
            instance.refresh_from_db()
            self.assertFalse(instance.deleted)
        deleted_before.refresh_from_db()
        self.assertTrue(deleted_before.deleted)

        # 4 changes logged on deletion (entity + 3 instances), 4 on restore
        self.assertEqual(Modification.objects.filter(source=ENTITY_API, user=self.entity_writer).count(), 8)
        data = self.assertJSONResponse(self.client.get("/api/entities/"), status.HTTP_200_OK)
        self.assertEqual([e["id"] for e in data["result"]], [entity.id])

    def test_restore_entity_only_looks_at_audit_entries_of_submissions(self):
        """Restoring an entity ignores audit entries of other objects with the same id as a submission"""
        deleted_before = self._delete_submission_on_its_own(
            Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        )
        self.assertFalse(Entity.objects_include_deleted.filter(pk=deleted_before.pk).exists())
        reference = Instance.objects.create(org_unit=self.ou_country, form=self.form_1)
        entity = Entity.objects.create(
            pk=deleted_before.pk, entity_type=self.entity_type, attributes=reference, account=self.account
        )
        Instance.objects.filter(pk__in=[reference.pk, deleted_before.pk]).update(entity=entity)

        self.client.force_authenticate(self.entity_writer)
        self.assertJSONResponse(self.client.delete(f"/api/entities/{entity.id}/"), status.HTTP_200_OK)
        # The entity's deletion entry has the same object id as the submission deleted before
        self.assertTrue(Modification.objects.filter(object_id=str(entity.pk), source=ENTITY_API).exists())

        self.assertJSONResponse(self.client.post(f"/api/entities/{entity.id}/restore/"), status.HTTP_200_OK)

        reference.refresh_from_db()
        self.assertFalse(reference.deleted)
        deleted_before.refresh_from_db()
        self.assertTrue(deleted_before.deleted)

    def test_restore_entity_with_submission_uploaded_after_deletion(self):
        """
        When a device that syncs after the deletion uploads a new submission for the entity: it's saved as
        deleted, without an audit log entry, and should come back when the entity is restored.
        """
        visit_form = m.Form.objects.create(name="Visit", form_id="visit_form", period_type=m.MONTH)
        visit_form.projects.add(self.project)
        entity, instances = self._create_entity_with_instances()
        self.client.force_authenticate(self.entity_writer)
        self.assertJSONResponse(self.client.delete(f"/api/entities/{entity.id}/"), status.HTTP_200_OK)

        uploaded_uuid = str(uuid.uuid4())
        self.client.force_authenticate(None)
        response = self.client.post(
            f"/api/instances/?app_id={self.project.app_id}",
            data=[
                {
                    "id": uploaded_uuid,
                    "created_at": 1765258153704,
                    "updated_at": 1765258153704,
                    "orgUnitId": self.ou_country.id,
                    "formId": visit_form.id,
                    "file": "visit.xml",
                    "entityUuid": str(entity.uuid),
                    "entityTypeId": self.entity_type.id,
                    "name": "Visit after deletion",
                }
            ],
            format="json",
        )
        self.assertJSONResponse(response, status.HTTP_200_OK)
        uploaded = Instance.objects.get(uuid=uploaded_uuid)
        self.assertEqual(uploaded.entity_id, entity.id)
        self.assertTrue(uploaded.deleted)
        self.assertFalse(Modification.objects.filter(object_id=str(uploaded.pk)).exists())

        self.client.force_authenticate(self.entity_writer)
        response = self.client.post(f"/api/entities/{entity.id}/restore/")
        self.assertJSONResponse(response, status.HTTP_200_OK)

        for instance in [*instances, uploaded]:
            instance.refresh_from_db()
            self.assertFalse(instance.deleted)
        self.assertTrue(Modification.objects.filter(object_id=str(uploaded.pk), source=ENTITY_API).exists())

    def test_restore_entity_requires_entities_write_permission(self):
        entity, _ = self._create_entity_with_instances()
        entity.soft_delete_with_instances_and_pending_duplicates(audit_source=ENTITY_API, user=None)
        # Even on an account where the duplicates screen discards entities
        flag, _ = m.AccountFeatureFlag.objects.get_or_create(
            code="ENTITY_DUPLICATES_SOFT_DELETE", defaults={"name": "Entity duplicates soft deletion"}
        )
        self.account.feature_flags.add(flag)
        duplicates_writer = self.create_user_with_profile(
            username="duplicates_writer",
            account=self.account,
            permissions=[CORE_ENTITIES_PERMISSION, CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION],
        )
        for user in [self.yoda, duplicates_writer]:
            self.client.force_authenticate(user)
            response = self.client.post(f"/api/entities/{entity.id}/restore/")
            self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)
        entity.refresh_from_db()
        self.assertIsNotNone(entity.deleted_at)

    def test_restore_entity_errors(self):
        self.client.force_authenticate(self.entity_writer)
        active, _ = self._create_entity_with_instances()
        response = self.client.post(f"/api/entities/{active.id}/restore/")
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)

        merged, _ = self._create_entity_with_instances()
        merged.merged_to = active
        merged.save()
        merged.delete()
        response = self.client.post(f"/api/entities/{merged.id}/restore/")
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
        merged.refresh_from_db()
        self.assertIsNotNone(merged.deleted_at)

        response = self.client.post("/api/entities/999999999/restore/")
        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

        # Other account
        self.client.force_authenticate(
            self.create_user_with_profile(
                username="other_account_writer",
                account=self.yop_solo.iaso_profile.account,
                permissions=[CORE_ENTITIES_PERMISSION, CORE_ENTITIES_WRITE_PERMISSION],
            )
        )
        deleted, _ = self._create_entity_with_instances()
        deleted.delete()
        response = self.client.post(f"/api/entities/{deleted.id}/restore/")
        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)
