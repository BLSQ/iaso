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
