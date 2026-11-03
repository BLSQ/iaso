from unittest import mock

from iaso.api.microplanning.plannings.serializers.misc import PlanningReadSerializer, PlanningWriteSerializer
from iaso.tests.api.microplanning.plannings.base import PlanningSerializersTestBase
from iaso.utils.colors import COLOR_CHOICES, DEFAULT_COLOR


class PlanningSerializersTestCase(PlanningSerializersTestBase):
    def test_read_serializer(self):
        serializer = PlanningReadSerializer(self.planning)
        data = serializer.data

        self.assertEqual(data["id"], self.planning.id)
        self.assertEqual(data["name"], "planning_1")
        self.assertEqual(data["description"], "A test planning")
        self.assertIsNone(data["published_at"])
        self.assertEqual(data["started_at"], "2025-01-01")
        self.assertEqual(data["ended_at"], "2025-01-10")
        self.assertEqual(data["pipeline_uuids"], self.planning.pipeline_uuids)
        self.assertEqual(data["assignments_count"], 0)

        self.assertEqual(
            serializer.data,
            {
                "id": self.planning.id,
                "name": "planning_1",
                "deprecated": False,
                "missions": [self.mission_1.id, self.mission_2.id],
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
                "assignments_count": 0,
                "team_details": {
                    "id": self.team_1.id,
                    "name": self.team_1.name,
                    "deleted_at": None,
                    "color": COLOR_CHOICES[0][0].upper(),
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
                "target_org_unit_type_details": [
                    {
                        "id": self.org_unit_type_child.id,
                        "name": self.org_unit_type_child.name,
                    },
                ],
            },
        )

    def test_write_serializer_happy_path(self):
        data = {
            "name": "planning_2",
            "missions": [self.mission_2.id],
            "description": "Another test planning",
            "started_at": "2025-02-01",
            "ended_at": "2025-02-10",
            "team": self.team_1.id,
            "org_unit": self.org_unit_parent.id,
            "target_org_unit_types": [self.org_unit_type_child.id],
            "project": self.project_1.id,
            "selected_sampling_result": self.planning_sampling_result.id,
            "pipeline_uuids": ["333e4567-e89b-12d3-a456-426614174000", "444e4567-e89b-12d3-a456-426614174000"],
        }

        request = mock.Mock(user=self.user_no_perms_1)
        serializer = PlanningWriteSerializer(data=data, context={"request": request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

    # TODO: add tests to cover all validation errors in PlanningWriteSerializer
    # TODO: add tests to check for missing and empty fields in PlanningWriteSerializer
