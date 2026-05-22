import uuid

from rest_framework import status

from iaso import models as m
from iaso.tests.api.entities.common_base_with_setup import EntityAPITestCase


class MobileEntityAPITestCase(EntityAPITestCase):
    BASE_URL = "/api/mobile/entities/"

    def test_list_entities_with_filtered_out_entities_with_soft_deleted_instances(self):
        uuid_valid_instance = uuid.uuid4()
        valid_instance = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid_valid_instance,
        )
        entity_with_valid_instance = m.Entity.objects.create(
            name="valid",
            entity_type=self.entity_type,
            attributes=valid_instance,
            account=self.account,
        )
        valid_instance.entity = entity_with_valid_instance
        valid_instance.save()

        uuid_deleted_instance = uuid.uuid4()
        deleted_instance = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            deleted=True,
            uuid=uuid_deleted_instance,
        )
        entity_with_deleted_instance = m.Entity.objects.create(
            name="deleted",
            entity_type=self.entity_type,
            attributes=deleted_instance,
            account=self.account,
        )
        deleted_instance.entity = entity_with_deleted_instance
        deleted_instance.save()

        self.client.force_authenticate(self.yoda)
        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(response_json["count"], 1)  # Only the entity with the valid instance should be returned

        entity = response_json["results"][0]
        self.assertEqual(entity["defining_instance_id"], str(uuid_valid_instance))

    def test_list_entities_no_duplicates_in_response(self):
        """Test that the same entity is not present twice in the API response"""
        # Create entity with single instance
        uuid_instance = uuid.uuid4()
        instance = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid_instance,
        )
        entity = m.Entity.objects.create(
            name="test_entity",
            entity_type=self.entity_type,
            attributes=instance,
            account=self.account,
        )
        instance.entity = entity
        instance.save()

        # Create a second instance for the same entity
        uuid_instance_2 = uuid.uuid4()
        instance_2 = self.create_form_instance(
            project=self.project,
            org_unit=self.ou_country,
            form=self.form_1,
            uuid=uuid_instance_2,
        )
        instance_2.entity = entity
        instance_2.save()
        self.yoda.iaso_profile.org_units.add(self.ou_country)
        self.client.force_authenticate(self.yoda)
        response = self.client.get(self.BASE_URL, {"app_id": self.project.app_id})
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)

        # Verify only one entity is returned despite having multiple instances
        self.assertEqual(response_json["count"], 1)

        # Extract all entity IDs from response
        entity_ids = [entity["id"] for entity in response_json["results"]]

        # Verify no duplicate entity IDs
        self.assertEqual(len(entity_ids), len(set(entity_ids)), "Found duplicate entities in response")
