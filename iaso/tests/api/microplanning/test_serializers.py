from unittest import mock

from django.contrib.gis.geos import MultiPolygon, Polygon

from iaso.api.microplanning.serializers import (
    PlanningOrgUnitSerializer,
    PlanningReadSerializer,
    PlanningWriteSerializer,
)
from iaso.models import Form, OrgUnit, OrgUnitType, Planning, Project, Team
from iaso.models.microplanning import PlanningSamplingResult
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION
from iaso.test import APITestCase
from iaso.utils.colors import COLOR_CHOICES, DEFAULT_COLOR


class PlanningSerializersTestCase(APITestCase):
    def setUp(self):
        # Preparing first account and setup - two projects
        self.account_1, self.data_source_1, self.version_1, self.project_1 = (
            self.create_account_datasource_version_project("source 1", "account 1", "project 1")
        )
        self.project_2 = Project.objects.create(name="project 2", account=self.account_1)
        self.account_1.project_set.add(self.project_2)

        self.user_1, self.anon_1, self.user_no_perms_1 = self.create_base_users(
            self.account_1, [CORE_PLANNING_WRITE_PERMISSION], "user_1"
        )
        self.team_1 = Team.objects.create(project=self.project_1, name="team_1", manager=self.user_1)
        self.team_2 = Team.objects.create(project=self.project_2, name="team_2", manager=self.user_1)

        self.org_unit_type_parent = OrgUnitType.objects.create(name="type_parent")
        self.org_unit_type_parent.projects.add(self.project_1)
        self.org_unit_type_child = OrgUnitType.objects.create(name="type_child")
        self.org_unit_type_child.projects.add(self.project_1)
        self.org_unit_parent = OrgUnit.objects.create(
            version=self.version_1, name="org_unit_parent", org_unit_type=self.org_unit_type_parent
        )
        self.org_unit_child = OrgUnit.objects.create(
            version=self.version_1,
            name="org_unit_child",
            org_unit_type=self.org_unit_type_child,
            parent=self.org_unit_parent,
        )
        self.form_1 = Form.objects.create(name="form_1")
        self.form_2 = Form.objects.create(name="form_2")
        self.project_1.forms.set([self.form_1, self.form_2])
        self.planning = Planning.objects.create(
            project=self.project_1,
            name="planning_1",
            team=self.team_1,
            org_unit=self.org_unit_parent,
            started_at="2025-01-01",
            ended_at="2025-01-10",
            description="A test planning",
            target_org_unit_type=self.org_unit_type_child,
            created_by=self.user_1,
            pipeline_uuids=["111e4567-e89b-12d3-a456-426614174000", "222e4567-e89b-12d3-a456-426614174000"],
        )
        self.planning.forms.set([self.form_1, self.form_2])
        self.planning_sampling_result = PlanningSamplingResult.objects.create(
            planning=self.planning,
            pipeline_id="123e4567-e89b-12d3-a456-426614174000",
            pipeline_version="v1.0",
            pipeline_name="pipeline_1",
            parameters={"param1": "value1"},
            created_by=self.user_1,
        )
        self.planning.selected_sampling_result = self.planning_sampling_result
        self.planning.save()

        # Preparing second account and setup - 1 project
        self.account_2, self.data_source_2, self.version_2, self.project_3 = (
            self.create_account_datasource_version_project("source 2", "account 2", "project 2")
        )
        self.user_2, self.anon_2, self.user_no_perms_2 = self.create_base_users(
            self.account_2, [CORE_PLANNING_WRITE_PERMISSION], "user_2"
        )
        self.team_3 = Team.objects.create(project=self.project_3, name="team_3", manager=self.user_2)

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

        serializer = PlanningOrgUnitSerializer(self.org_unit_parent)

        geo_json = serializer.data["geo_json"]
        self.assertEqual(geo_json["type"], "FeatureCollection")
        self.assertEqual(len(geo_json["features"]), 1)
        feature = geo_json["features"][0]
        self.assertEqual(feature["id"], self.org_unit_parent.id)
        self.assertEqual(feature["geometry"]["type"], "MultiPolygon")
        self.assertTrue(serializer.data["has_geo_json"])

    def test_planning_org_unit_serializer_without_geo_json(self):
        self.org_unit_parent.simplified_geom = None
        self.org_unit_parent.save()

        serializer = PlanningOrgUnitSerializer(self.org_unit_parent)

        self.assertIsNone(serializer.data["geo_json"])
        self.assertFalse(serializer.data["has_geo_json"])
