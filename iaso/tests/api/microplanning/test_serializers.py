from unittest import mock

from django.contrib.gis.geos import MultiPolygon, Polygon

from iaso.api.microplanning.serializers import (
    BulkDeleteAssignmentSerializer,
    PlanningOrgUnitSerializer,
    PlanningReadSerializer,
    PlanningWriteSerializer,
)
from iaso.models import OrgUnit
from iaso.test import IasoTestCaseMixin
from iaso.tests.api.microplanning.test_setup import PlanningSerializersTestBase
from iaso.utils.colors import COLOR_CHOICES, DEFAULT_COLOR


class PlanningSerializersTestCase(PlanningSerializersTestBase):
    def test_read_serializer(self):
        serializer = PlanningReadSerializer(self.planning)

        self.assertEqual(
            serializer.data,
            {
                "id": self.planning.id,
                "name": "planning_1",
                "forms": [self.form_1.id, self.form_2.id],
                "description": "A test planning",
                "published_at": None,
                "started_at": "2025-01-01",
                "ended_at": "2025-01-10",
                "pipeline_uuids": self.planning.pipeline_uuids,
                "selected_sampling_result": {
                    "id": self.planning_sampling_result.id,
                    "pipeline_id": self.planning_sampling_result.pipeline_id,
                    "pipeline_version": self.planning_sampling_result.pipeline_version,
                    "pipeline_name": self.planning_sampling_result.pipeline_name,
                    "group_id": None,
                    "task_id": None,
                },
                "team_details": {
                    "id": self.team_1.id,
                    "name": self.team_1.name,
                    "deleted_at": None,
                    "color": COLOR_CHOICES[0][0],
                },
                "org_unit_details": {
                    "id": self.org_unit_parent.id,
                    "name": self.org_unit_parent.name,
                    "org_unit_type": self.org_unit_type_parent.id,
                },
                "project_details": {
                    "id": self.project_1.id,
                    "name": self.project_1.name,
                    "color": DEFAULT_COLOR,
                },
                "target_org_unit_type_details": {
                    "id": self.org_unit_type_child.id,
                    "name": self.org_unit_type_child.name,
                },
            },
        )

    def test_write_serializer_happy_path(self):
        data = {
            "name": "planning_2",
            "forms": [self.form_2.id],
            "description": "Another test planning",
            "started_at": "2025-02-01",
            "ended_at": "2025-02-10",
            "team": self.team_1.id,
            "org_unit": self.org_unit_parent.id,
            "target_org_unit_type": self.org_unit_type_child.id,
            "project": self.project_1.id,
            "selected_sampling_result": self.planning_sampling_result.id,
            "pipeline_uuids": ["333e4567-e89b-12d3-a456-426614174000", "444e4567-e89b-12d3-a456-426614174000"],
        }

        request = mock.Mock(user=self.user_no_perms_1)
        serializer = PlanningWriteSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # TODO: add tests to cover all validation errors in PlanningWriteSerializer
    # TODO: add tests to check for missing and empty fields in PlanningWriteSerializer

    def test_planning_org_unit_serializer_with_geo_json(self):
        polygon = Polygon(((0, 0), (0, 1), (1, 1), (0, 0)), srid=4326)
        multipolygon = MultiPolygon(polygon, srid=4326)
        self.org_unit_parent.simplified_geom = multipolygon
        self.org_unit_parent.save()

        org_unit = OrgUnit.objects.with_geo_json().get(id=self.org_unit_parent.id)
        serializer = PlanningOrgUnitSerializer(org_unit)

        geo_json = serializer.data["geo_json"]
        self.assertEqual(geo_json["type"], "FeatureCollection")
        self.assertEqual(geo_json["crs"], {"type": "name", "properties": {"name": "EPSG:4326"}})
        self.assertEqual(len(geo_json["features"]), 1)
        feature = geo_json["features"][0]
        self.assertEqual(feature["id"], self.org_unit_parent.id)
        self.assertEqual(feature["geometry"], org_unit.geo_json)
        self.assertTrue(serializer.data["has_geo_json"])

    def test_planning_org_unit_serializer_without_geo_json(self):
        self.org_unit_parent.simplified_geom = None
        self.org_unit_parent.save()

        org_unit = OrgUnit.objects.with_geo_json().get(id=self.org_unit_parent.id)
        serializer = PlanningOrgUnitSerializer(org_unit)

        self.assertIsNone(serializer.data["geo_json"])
        self.assertFalse(serializer.data["has_geo_json"])


class AssignmentSerializesTestCase(PlanningSerializersTestBase, IasoTestCaseMixin):
    def test_bulk_delete_planning_tenancy(self):
        """Test that user cannot use planning from different account"""
        # User from account_1 tries to use planning from account_2
        request = mock.Mock(user=self.user_1)
        data = {"planning": self.planning_account_2.id}
        serializer = BulkDeleteAssignmentSerializer(data=data, context={"request": request})

        self.assertFalse(serializer.is_valid())
        self.assertIn("planning", serializer.errors)

    def test_bulk_delete_team_tenancy(self):
        """Test that user cannot use team from different account"""
        # team_3 is from account_2, user_1 is from account_1
        request = mock.Mock(user=self.user_1)
        data = {"planning": self.planning.id, "team": self.team_3.id}
        serializer = BulkDeleteAssignmentSerializer(data=data, context={"request": request})

        self.assertFalse(serializer.is_valid())
        self.assertIn("team", serializer.errors)

    def test_bulk_delete_user_tenancy(self):
        """Test that user cannot use user from different account"""
        # user_2 is from account_2, user_1 is from account_1
        request = mock.Mock(user=self.user_1)
        data = {"planning": self.planning.id, "user": self.user_2.id}
        serializer = BulkDeleteAssignmentSerializer(data=data, context={"request": request})

        self.assertFalse(serializer.is_valid())
        self.assertIn("user", serializer.errors)
