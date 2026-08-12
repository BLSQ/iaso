from http import HTTPStatus
from uuid import uuid4

from rest_framework import status

from iaso import models as m
from iaso.models.deduplication import ValidationStatus
from iaso.permissions.core_permissions import (
    CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
    CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
    CORE_ENTITIES_PERMISSION,
)
from iaso.test import APITestCase


class EntitiesDuplicationFiltersAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)

        cls.account = m.Account.objects.create(name="Account")
        cls.account.default_version = cls.source_version
        cls.account.save()

        cls.project = m.Project.objects.create(name="Project", app_id="test.project", account=cls.account)

        cls.orgunit_type = m.OrgUnitType.objects.create(name="Org Unit Type")
        cls.org_unit = m.OrgUnit.objects.create(
            name="Org Unit", version=cls.source_version, org_unit_type=cls.orgunit_type
        )

        cls.user_with_default_ou_rw = cls.create_user_with_profile(
            username="user_with_default_ou_rw",
            account=cls.account,
            permissions=[CORE_ENTITIES_DUPLICATES_READ_PERMISSION, CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION],
            org_units=[cls.org_unit],
        )

        cls.form = m.Form.objects.create(name="Form")
        cls.entity_type = m.EntityType.objects.create(name="Entity Type", reference_form=cls.form, account=cls.account)

    def test_filter_by_analyze_id(self):
        """
        Test filtering entity duplicates by analyze ID.
        """
        self.client.force_authenticate(self.user_with_default_ou_rw)

        # Instances.
        instance1 = m.Instance.objects.create(
            form=self.form,
            org_unit=self.org_unit,
            project=self.project,
            json={"name": "Test Entity 1"},
        )
        instance2 = m.Instance.objects.create(
            form=self.form,
            org_unit=self.org_unit,
            project=self.project,
            json={"name": "Test Entity 2"},
        )
        instance3 = m.Instance.objects.create(
            form=self.form,
            org_unit=self.org_unit,
            project=self.project,
            json={"name": "Test Entity 3"},
        )

        # Entities.
        entity1 = m.Entity.objects.create(
            name="Test Entity 1", entity_type=self.entity_type, account=self.account, attributes=instance1
        )
        entity2 = m.Entity.objects.create(
            name="Test Entity 2", entity_type=self.entity_type, account=self.account, attributes=instance2
        )
        entity3 = m.Entity.objects.create(
            name="Test Entity 3", entity_type=self.entity_type, account=self.account, attributes=instance3
        )

        # First analysis.
        analysis_1 = m.EntityDuplicateAnalyzis.objects.create(
            algorithm="levenshtein", metadata={"entity_type_id": self.entity_type.id, "fields": ["Prenom", "Nom"]}
        )
        m.EntityDuplicate.objects.create(entity1=entity1, entity2=entity2, analyze=analysis_1, similarity_score=95)
        m.EntityDuplicate.objects.create(entity1=entity1, entity2=entity3, analyze=analysis_1, similarity_score=78)

        # Second analysis.
        analysis_2 = m.EntityDuplicateAnalyzis.objects.create(
            algorithm="levenshtein", metadata={"entity_type_id": self.entity_type.id, "fields": ["age__int__"]}
        )
        m.EntityDuplicate.objects.create(entity1=entity2, entity2=entity3, analyze=analysis_2, similarity_score=85)

        # Test filtering by first analysis.
        response = self.client.get(f"/api/entityduplicates/?analyze_id={analysis_1.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 2)
        for duplicate in results:
            self.assertEqual(duplicate["analyzis"][0]["analyze_id"], analysis_1.id)

        # Test filtering by second analysis.
        response = self.client.get(f"/api/entityduplicates/?analyze_id={analysis_2.id}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        for duplicate in results:
            self.assertEqual(duplicate["analyzis"][0]["analyze_id"], analysis_2.id)

        # Get all duplicates without any filter (should include both analyses).
        response = self.client.get("/api/entityduplicates/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        total_duplicates = len(response.data["results"])
        self.assertEqual(total_duplicates, 3)

        # Filter by non-existent analyze ID (should return no results).
        response = self.client.get("/api/entityduplicates/?analyze_id=99999")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

        # Filter by invalid ID.
        response = self.client.get("/api/entityduplicates/?analyze_id=FOO")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("The `analyze_id` parameter must be an integer.", response.content.decode())


class StaleEntitiesDuplicationAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)

        cls.account = m.Account.objects.create(name="Account")
        cls.account.default_version = cls.source_version
        cls.account.save()

        cls.project = m.Project.objects.create(name="Project", app_id="test.project", account=cls.account)

        cls.orgunit_type = m.OrgUnitType.objects.create(name="Org Unit Type")
        cls.org_unit = m.OrgUnit.objects.create(
            name="Org Unit", version=cls.source_version, org_unit_type=cls.orgunit_type
        )

        cls.user = cls.create_user_with_profile(
            username="test_user",
            account=cls.account,
            permissions=[
                CORE_ENTITIES_DUPLICATES_READ_PERMISSION,
                CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION,
                CORE_ENTITIES_PERMISSION,
            ],
            org_units=[cls.org_unit],
        )

        cls.form = m.Form.objects.create(name="Form")
        cls.entity_type = m.EntityType.objects.create(name="Entity Type", reference_form=cls.form, account=cls.account)
        cls.form_version = m.FormVersion.objects.create(form=cls.form, version_id="2020010101")

        cls.entities = []
        for i in range(4):
            instance = m.Instance.objects.create(
                form=cls.form,
                form_version=cls.form_version,
                project=cls.project,
                org_unit=cls.org_unit,
                json={"name": f"Entity {i}"},
            )
            entity = m.Entity.objects.create(
                name=f"Entity {i}",
                entity_type=cls.entity_type,
                account=cls.account,
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
