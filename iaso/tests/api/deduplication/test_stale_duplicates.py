from http import HTTPStatus
from uuid import uuid4

from iaso import models as m
from iaso.models.deduplication import ValidationStatus
from iaso.permissions.core_permissions import (
    CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
    CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
    CORE_ENTITIES_PERMISSION,
)
from iaso.test import APITestCase


# TODO: move these tests to other files when submitting the changes back to IASO


class DuplicatesFilteringAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Test Account")
        cls.account = account
        cls.project = m.Project.objects.create(name="Test Project", account=account, app_id="test.app")
        cls.user = cls.create_user_with_profile(
            username="test_user",
            account=account,
            permissions=[
                CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
                CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
                CORE_ENTITIES_PERMISSION,
            ],
        )

        cls.entity_type = m.EntityType.objects.create(name="Test Entity Type")
        cls.form = m.Form.objects.create(name="Test Form")
        cls.entity_type.reference_form = cls.form
        cls.entity_type.save()

        cls.form_version = m.FormVersion.objects.create(form=cls.form, version_id="2020010101")

        cls.entities = []
        for i in range(4):
            instance = m.Instance.objects.create(
                form=cls.form,
                form_version=cls.form_version,
                project=cls.project,
                json={"name": f"Entity {i}"},
            )
            entity = m.Entity.objects.create(
                name=f"Entity {i}",
                entity_type=cls.entity_type,
                account=account,
                attributes=instance,
                uuid=uuid4(),
            )
            instance.entity = entity
            instance.save()
            cls.entities.append(entity)

        cls.analyze = m.EntityDuplicateAnalyzis.objects.create(
            algorithm="levenshtein",
            metadata={"fields": ["name"], "entity_type_id": cls.entity_type.pk},
        )

        # Normal duplicate pair (0, 1)
        cls.dup_normal = m.EntityDuplicate.objects.create(
            entity1=cls.entities[0],
            entity2=cls.entities[1],
            similarity_score=90,
            validation_status=ValidationStatus.PENDING,
            analyze=cls.analyze,
        )

        # Duplicate pair (2, 3) where Entity 3 will be soft-deleted
        cls.dup_stale = m.EntityDuplicate.objects.create(
            entity1=cls.entities[2],
            entity2=cls.entities[3],
            similarity_score=80,
            validation_status=ValidationStatus.PENDING,
            analyze=cls.analyze,
        )

    def test_stale_duplicates_filtered_from_entity_duplicate_api(self):
        self.client.force_authenticate(self.user)

        self.entities[3].delete()  # soft-delete

        response = self.client.get("/api/entityduplicates/")
        data = self.assertJSONResponse(response, HTTPStatus.OK)

        results_ids = [d["id"] for d in data["results"]]
        self.assertIn(self.dup_normal.id, results_ids)
        self.assertNotIn(self.dup_stale.id, results_ids)

    def test_stale_duplicates_filtered_from_entity_api(self):
        self.client.force_authenticate(self.user)

        self.entities[3].delete()  # soft-delete

        response = self.client.get(f"/api/entities/{self.entities[2].pk}/")
        data = self.assertJSONResponse(response, HTTPStatus.OK)

        # duplicates should be empty because Entity 3 is deleted
        self.assertEqual(data["duplicates"], [])

        # check Entity 0, it should still have Entity 1 as duplicate
        response = self.client.get(f"/api/entities/{self.entities[0].pk}/")
        data = self.assertJSONResponse(response, HTTPStatus.OK)
        self.assertEqual(data["duplicates"], [self.entities[1].pk])

    def test_has_duplicates_flag_on_entity_list(self):
        self.client.force_authenticate(self.user)

        self.entities[3].delete()  # soft-delete

        response = self.client.get("/api/entities/")
        data = self.assertJSONResponse(response, HTTPStatus.OK)

        entity2_data = next(e for e in data["result"] if e["id"] == self.entities[2].pk)
        entity0_data = next(e for e in data["result"] if e["id"] == self.entities[0].pk)

        # Entity 2 should have has_duplicates=False because its only duplicate (Entity 3) is deleted
        self.assertFalse(entity2_data["has_duplicates"])
        self.assertTrue(entity0_data["has_duplicates"])
