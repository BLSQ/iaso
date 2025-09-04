import csv
import datetime
import io
import json
import uuid

import pytz
import time_machine

from django.core.files import File

from iaso import models as m
from iaso.api.common import EXPORTS_DATETIME_FORMAT
from iaso.models import Entity, EntityType, FormVersion, Instance, Project
from iaso.models.deduplication import ValidationStatus
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

        self.assertEqual(response.status_code, 200)

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

        self.assertEqual(response.status_code, 200)
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

        self.assertEqual(response.status_code, 400)

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

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 2)

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

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 3)

        response = self.client.get(f"/api/entities/?entity_type_id={self.entity_type.pk}", format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 3)

        response = self.client.get(f"/api/entities/{entity.pk}/")

        self.assertEqual(response.status_code, 200)

    def test_list_entities_search_filter(self):
        """
        Test the 'search' filter of /api/entities

        This parameter allows to filter either by name, UUID or attributes (of the reference form)
        """
        self.client.force_authenticate(self.yoda)

        instance = Instance.objects.create(
            org_unit=self.ou_country,
            form=self.form_1,
            json={"name": "c", "age": 30, "gender": "F"},
        )

        payload = {
            "name": "New Client",
            "entity_type": self.entity_type.pk,
            "attributes": instance.uuid,
            "account": self.yoda.iaso_profile.account.pk,
        }

        self.client.post("/api/entities/", data=payload, format="json")

        newly_added_entity = Entity.objects.last()

        # Case 1: search by entity name
        response = self.client.get("/api/entities/?search=Client", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], newly_added_entity.id)

        # Case 2: search by entity name - make sure it's case-insensitive
        response = self.client.get("/api/entities/?search=cLiEnT", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], newly_added_entity.id)

        # Case 3: search by entity UUID
        response = self.client.get(f"/api/entities/?search={newly_added_entity.uuid}", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(the_result["id"], newly_added_entity.id)

        # Case 4: search by JSON attribute
        response = self.client.get("/api/entities/?search=age", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(the_result["id"], newly_added_entity.id)

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
        self.assertEqual(response.status_code, 200)
        result = response.json()["result"]
        self.assertEqual(len(result), 3)
        self.assertEqual(result[0]["id"], entities[0].id)
        self.assertTrue(result[0]["has_duplicates"])

    @time_machine.travel(datetime.datetime(2021, 7, 18, 14, 57, 0, 1), tick=False)
    def test_list_entities_single_entity_type(self):
        """Test the 'entityTypeIds' parameter of /api/entities with a single entity type id.

        This should result in extra columns from the type being returned for each entity."""
        self.client.force_authenticate(self.yoda)

        # We expect the intersection of the form's possible_fields
        # and the entity type's field_list_view to show up as columns
        # in the export. Other propreties should be ignored.

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
        self.assertEqual(response.status_code, 200)
        result = response.json()["result"]
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], entity.id)
        self.assertEqual(result[0]["first_name"], "Jean")
        self.assertEqual(result[0]["last_name"], "Dupont")
        self.assertEqual(result[0]["middle_name"], "M.")

        # Test the extra columns in the CSV export
        response = self.client.get(f"/api/entities/?entity_type_ids={entity_type_2.pk}&csv=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.csv")

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
            "",
            "Jean",
            "M.",
            "Dupont",
        ]
        self.assertEqual(row_to_test, expected_row)

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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(response.json()["result"][0]["id"], entity1.id)

        # Test multiple UUIDs search with comma separation
        uuids = f"{entity1.uuid},{entity2.uuid}"
        response = self.client.get(f"/api/entities/?search=uuids:{uuids}", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(entity1.id, result_ids)
        self.assertIn(entity2.id, result_ids)

        # Test with spaces around commas
        uuids_with_spaces = f"{entity1.uuid} , {entity3.uuid}"
        response = self.client.get(f"/api/entities/?search=uuids:{uuids_with_spaces}", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(entity1.id, result_ids)
        self.assertIn(entity3.id, result_ids)

        # Test with non-existent UUID mixed in
        fake_uuid = "8872aafb-651f-4b0f-89af-35f0a06d9b44"
        uuids_with_fake = f"{entity1.uuid},{fake_uuid}"
        response = self.client.get(f"/api/entities/?search=uuids:{uuids_with_fake}", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(response.json()["result"][0]["id"], entity1.id)

        # Test invalid UUIDs
        invalid_uuids = "8872wwfb-651f 4b0f-89af 35f0a06d9b44"
        response = self.client.get(f"/api/entities/?search=uuids:{invalid_uuids}", format="json")
        self.assertEqual(response.status_code, 400)
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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        self.assertEqual(response.json()["result"][0]["id"], entity1.id)

        # Test multiple IDs search with comma separation
        ids = f"{entity1.id},{entity2.id}"
        response = self.client.get(f"/api/entities/?search=ids:{ids}", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(entity1.id, result_ids)
        self.assertIn(entity2.id, result_ids)

        # Test with spaces around commas
        ids_with_spaces = f"{entity1.id} , {entity3.id}"
        response = self.client.get(f"/api/entities/?search=ids:{ids_with_spaces}", format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertIn(entity1.id, result_ids)
        self.assertIn(entity3.id, result_ids)

        # Test with non-existent ID mixed in
        fake_id = 99999
        ids_with_fake = f"{entity1.id},{fake_id}"
        response = self.client.get(f"/api/entities/?search=ids:{ids_with_fake}", format="json")
        self.assertEqual(response.status_code, 200)
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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        results = response.json()["result"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], entity1.id)

        # Search on date range
        response = self.client.get(f"/api/entities/?dateFrom={date1_str}&dateTo={date2_str}")
        self.assertEqual(response.status_code, 200)
        results = response.json()["result"]
        self.assertEqual(len(results), 2)
        self.assertEqual([r["id"] for r in results], [entity1.id, entity2.id])

        # Search on only from date
        response = self.client.get(f"/api/entities/?dateFrom={date2_str}")
        self.assertEqual(response.status_code, 200)
        results = response.json()["result"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], entity2.id)
        response = self.client.get(f"/api/entities/?dateFrom={date3_str}")
        self.assertEqual(response.status_code, 200)
        results = response.json()["result"]
        self.assertEqual(len(results), 0)

        # Search on only to date
        response = self.client.get(f"/api/entities/?dateTo={date1_str}")
        self.assertEqual(response.status_code, 200)
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
            json={"gender": "M"},
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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], ent1.id)

        # gender m AND SOME residence Bujumbura
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "some", "M", "Bujumbura")},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 0)

        # gender f OR SOME residence Kinshasa
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("or", "some", "F", "Kinshasa")},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 2)
        result_ids = [r["id"] for r in response.json()["result"]]
        self.assertEqual(sorted(result_ids), sorted([ent1.id, ent2.id]))

        # gender m AND SOME residence Kinshasa
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "some", "M", "Kinshasa")},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)
        the_result = response.json()["result"][0]
        self.assertEqual(the_result["id"], ent2.id)

        # gender M AND ALL residence Kinshasa
        response = self.client.get(
            "/api/entities/",
            {"fields_search": self._generate_json_filter("and", "all", "M", "Kinshasa")},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 0)

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

        self.assertEqual(response.status_code, 200)
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

        self.assertEqual(response.status_code, 404)

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

        self.assertEqual(response.status_code, 200)

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
        self.client.delete(f"/api/entities/{Entity.objects.last().pk}/", format="json")

        response = self.client.get("/api/entities/", format="json")
        self.assertEqual(response.status_code, 200)
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

        self.assertEqual(response.status_code, 404)

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

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["result"]), 1)

    @time_machine.travel(datetime.datetime(2021, 7, 18, 14, 57, 0, 1), tick=False)
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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.csv")

        # export all entities type as xlsx
        response = self.client.get("/api/entities/?xlsx=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.xlsx")

        # export specific entity type as xlsx
        response = self.client.get(f"/api/entities/?entity_type_ids={self.entity_type.pk}&xlsx=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.xlsx")

        # export specific entity type as csv
        response = self.client.get(f"/api/entities/?entity_type_ids={self.entity_type.pk}&csv=true/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Disposition"), "attachment; filename=entities-2021-07-18-14-57.csv")

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
            "",
        ]
        self.assertEqual(row_to_test, expected_row)

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
        self.assertEqual(response.status_code, 200)

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

        self.assertEqual(response.status_code, 200)
        self.assertEqual(data.get("id"), str(entity.uuid))
        self.assertEqual(data.get("defining_instance_id"), str(instance.uuid))

        response = self.client.get(f"/api/mobile/entities/{entity.uuid}/?app_id={self.project.app_id}")

        self.assertEqual(response.status_code, 200)
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
        self.assertEqual(response.status_code, 200)
        self.assertEqual(0, response.data["count"])

        # The list should be restricted to the other project.
        entity_in_other_project = Entity.objects.filter(
            entity_type__reference_form__projects__app_id=other_project.app_id
        )
        self.assertEqual(2, entity_in_other_project.count())
        response = self.client.get(f"/api/mobile/entities/?app_id={other_project.app_id}")
        self.assertEqual(response.status_code, 200)
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

        self.assertEqual(response.status_code, 200)
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

        self.assertEqual(response.status_code, 200)
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
            permissions=["iaso_entities"],
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

        self.assertEqual(response.status_code, 200)
        json_result = response.json()["result"]
        self.assertEqual(len(json_result), 1)
        self.assertEqual(json_result[0]["org_unit"]["name"], village_1.name)

    def test_delete_entity(self):
        """
        DELETE /api/entities/pk/

        This should do a soft-delete of the entity, along with instances and
        potential EntityDuplicate pairs
        """
        self.client.force_authenticate(self.yoda)
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
        self.assertEqual(response.status_code, 200)

        ent.refresh_from_db()
        self.assertIsNotNone(ent.deleted_at)
        for inst in [ent_ref_instance, inst1, inst2]:
            inst.refresh_from_db()
            self.assertTrue(inst.deleted)
        self.assertEqual(m.EntityDuplicate.objects.count(), 1)  # only pending removed
