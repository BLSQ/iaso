from iaso import models as m
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
            permissions=["iaso_entity_duplicates_read", "iaso_entity_duplicates_write"],
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
        response_filtered_1 = self.client.get(f"/api/entityduplicates/?analyze={analysis_1.id}")
        self.assertEqual(response_filtered_1.status_code, 200)
        filtered_duplicates_1 = response_filtered_1.data["results"]
        self.assertEqual(len(filtered_duplicates_1), 2)
        for duplicate in filtered_duplicates_1:
            self.assertEqual(duplicate["analyzis"][0]["analyze_id"], analysis_1.id)

        # Test filtering by second analysis.
        response_filtered_2 = self.client.get(f"/api/entityduplicates/?analyze={analysis_2.id}")
        self.assertEqual(response_filtered_2.status_code, 200)
        filtered_duplicates_2 = response_filtered_2.data["results"]
        self.assertEqual(len(filtered_duplicates_2), 1)
        for duplicate in filtered_duplicates_2:
            self.assertEqual(duplicate["analyzis"][0]["analyze_id"], analysis_2.id)

        # Get all duplicates without any filter (should include both analyses).
        response_all = self.client.get("/api/entityduplicates/")
        self.assertEqual(response_all.status_code, 200)
        total_duplicates = len(response_all.data["results"])
        self.assertEqual(total_duplicates, 3)
        self.assertGreaterEqual(total_duplicates, len(filtered_duplicates_1))
        self.assertGreaterEqual(total_duplicates, len(filtered_duplicates_2))

        # Filter by non-existent analyze ID (should return no results).
        response_empty = self.client.get("/api/entityduplicates/?analyze=99999")
        self.assertEqual(response_empty.status_code, 200)
        self.assertEqual(len(response_empty.data["results"]), 0)
