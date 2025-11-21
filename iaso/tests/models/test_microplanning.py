from iaso.models import Account, DataSource, OrgUnit, OrgUnitType, Project, SourceVersion, Team
from iaso.models.microplanning import Planning
from iaso.test import APITestCase


class PlanningPipelineIntegrationTestCase(APITestCase):
    """Test Planning model pipeline UUID integration."""

    def setUp(self):
        """Set up test data."""
        # Create test account
        self.account = Account.objects.create(name="test_account")

        # Create test user with profile
        self.user = self.create_user_with_profile(username="testuser", account=self.account)

        # Create test project
        self.project = Project.objects.create(name="Test Project", app_id="test.app")
        self.project.account = self.account
        self.project.save()

        # Create test org unit type
        self.org_unit_type = OrgUnitType.objects.create(name="Test Country Type")
        self.org_unit_type.projects.add(self.project)

        # Create test data source and version
        self.data_source = DataSource.objects.create(name="Test Source")
        self.data_source.projects.add(self.project)
        self.version = SourceVersion.objects.create(data_source=self.data_source, number=1)

        # Create test org unit
        self.org_unit = OrgUnit.objects.create(
            name="Test Country", org_unit_type=self.org_unit_type, version=self.version
        )

        # Create test team
        self.team = Team.objects.create(name="Test Team", project=self.project, manager=self.user, path="1")

        # Create test planning
        self.planning = Planning.objects.create(
            name="Test Planning",
            description="Test planning for pipeline integration",
            project=self.project,
            team=self.team,
            org_unit=self.org_unit,
            created_by=self.user,
        )

    def test_pipeline_uuids_default_empty(self):
        """Test that pipeline_uuids field defaults to empty list."""
        self.assertEqual(self.planning.pipeline_uuids, [])
        self.assertEqual(self.planning.get_pipeline_uuids(), [])

    def test_add_pipeline_uuid(self):
        """Test adding a pipeline UUID to planning."""
        pipeline_uuid = "60fcb048-a5f6-4a79-9529-1ccfa55e75d1"

        self.planning.add_pipeline_uuid(pipeline_uuid)

        self.assertIn(pipeline_uuid, self.planning.pipeline_uuids)
        self.assertTrue(self.planning.has_pipeline_uuid(pipeline_uuid))
        self.assertEqual(self.planning.get_pipeline_uuids(), [pipeline_uuid])

    def test_add_duplicate_pipeline_uuid(self):
        """Test that adding duplicate pipeline UUID doesn't create duplicates."""
        pipeline_uuid = "60fcb048-a5f6-4a79-9529-1ccfa55e75d1"

        # Add the same UUID twice
        self.planning.add_pipeline_uuid(pipeline_uuid)
        self.planning.add_pipeline_uuid(pipeline_uuid)

        # Should only appear once
        self.assertEqual(self.planning.pipeline_uuids.count(pipeline_uuid), 1)

    def test_remove_pipeline_uuid(self):
        """Test removing a pipeline UUID from planning."""
        pipeline_uuid = "60fcb048-a5f6-4a79-9529-1ccfa55e75d1"

        # Add then remove
        self.planning.add_pipeline_uuid(pipeline_uuid)
        self.planning.remove_pipeline_uuid(pipeline_uuid)

        self.assertNotIn(pipeline_uuid, self.planning.pipeline_uuids)
        self.assertFalse(self.planning.has_pipeline_uuid(pipeline_uuid))
        self.assertEqual(self.planning.get_pipeline_uuids(), [])

    def test_remove_nonexistent_pipeline_uuid(self):
        """Test removing a pipeline UUID that doesn't exist."""
        pipeline_uuid = "60fcb048-a5f6-4a79-9529-1ccfa55e75d1"

        # Try to remove non-existent UUID
        self.planning.remove_pipeline_uuid(pipeline_uuid)

        # Should not cause error and list should remain empty
        self.assertEqual(self.planning.pipeline_uuids, [])

    def test_multiple_pipeline_uuids(self):
        """Test managing multiple pipeline UUIDs."""
        uuid1 = "60fcb048-a5f6-4a79-9529-1ccfa55e75d1"
        uuid2 = "70fcb048-a5f6-4a79-9529-1ccfa55e75d2"
        uuid3 = "80fcb048-a5f6-4a79-9529-1ccfa55e75d3"

        # Add multiple UUIDs
        self.planning.add_pipeline_uuid(uuid1)
        self.planning.add_pipeline_uuid(uuid2)
        self.planning.add_pipeline_uuid(uuid3)

        # Check all are present
        self.assertEqual(len(self.planning.get_pipeline_uuids()), 3)
        self.assertTrue(self.planning.has_pipeline_uuid(uuid1))
        self.assertTrue(self.planning.has_pipeline_uuid(uuid2))
        self.assertTrue(self.planning.has_pipeline_uuid(uuid3))

        # Remove one
        self.planning.remove_pipeline_uuid(uuid2)

        # Check remaining
        self.assertEqual(len(self.planning.get_pipeline_uuids()), 2)
        self.assertTrue(self.planning.has_pipeline_uuid(uuid1))
        self.assertFalse(self.planning.has_pipeline_uuid(uuid2))
        self.assertTrue(self.planning.has_pipeline_uuid(uuid3))

    def test_pipeline_uuids_field_type(self):
        """Test that pipeline_uuids field is properly typed as ArrayField."""
        # Test that we can store a list
        test_uuids = ["uuid1", "uuid2", "uuid3"]
        self.planning.pipeline_uuids = test_uuids
        self.planning.save()

        # Reload from database
        self.planning.refresh_from_db()
        self.assertEqual(self.planning.pipeline_uuids, test_uuids)

    def test_target_org_unit_type_nullable(self):
        """Test that target_org_unit_type can be null."""
        self.assertIsNone(self.planning.target_org_unit_type)

        self.planning.target_org_unit_type = None
        self.planning.save()
        self.planning.refresh_from_db()
        self.assertIsNone(self.planning.target_org_unit_type)

    def test_target_org_unit_type_assignment(self):
        """Test assigning target_org_unit_type to planning."""
        target_type = OrgUnitType.objects.create(name="Health Post")
        target_type.projects.add(self.project)

        self.planning.target_org_unit_type = target_type
        self.planning.save()

        self.planning.refresh_from_db()
        self.assertEqual(self.planning.target_org_unit_type, target_type)
        self.assertEqual(self.planning.target_org_unit_type.name, "Health Post")

    def test_target_org_unit_type_reverse_relation(self):
        """Test the reverse relation from OrgUnitType to Planning."""
        target_type = OrgUnitType.objects.create(name="Clinic")
        target_type.projects.add(self.project)

        planning1 = Planning.objects.create(
            name="Planning 1",
            project=self.project,
            team=self.team,
            org_unit=self.org_unit,
            target_org_unit_type=target_type,
            created_by=self.user,
        )
        planning2 = Planning.objects.create(
            name="Planning 2",
            project=self.project,
            team=self.team,
            org_unit=self.org_unit,
            target_org_unit_type=target_type,
            created_by=self.user,
        )

        target_plannings = target_type.target_plannings.all()
        self.assertEqual(target_plannings.count(), 2)
        self.assertIn(planning1, target_plannings)
        self.assertIn(planning2, target_plannings)

    def test_target_org_unit_type_protect_on_delete(self):
        """Test that deleting an OrgUnitType with plannings raises ProtectedError."""
        from django.db.models import ProtectedError

        target_type = OrgUnitType.objects.create(name="Hospital")
        target_type.projects.add(self.project)

        self.planning.target_org_unit_type = target_type
        self.planning.save()

        with self.assertRaises(ProtectedError):
            target_type.delete()

        self.planning.refresh_from_db()
        self.assertEqual(self.planning.target_org_unit_type, target_type)
