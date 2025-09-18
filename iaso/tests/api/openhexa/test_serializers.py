import uuid

from django.test import TestCase

from iaso.api.openhexa.serializers import (
    PipelineLaunchSerializer,
    TaskResponseSerializer,
    TaskUpdateSerializer,
)


class TaskUpdateSerializerTestCase(TestCase):
    """Test TaskUpdateSerializer."""

    def test_valid_data(self):
        """Test serializer with valid task update data."""
        data = {
            "task_id": 123,
            "status": "SUCCESS",
            "progress_message": "Task completed",
            "progress_value": 100,
            "end_value": 100,
            "result_data": {"result": "success"},
        }
        serializer = TaskUpdateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["task_id"], 123)
        self.assertEqual(serializer.validated_data["status"], "SUCCESS")

    def test_missing_task_id(self):
        """Test serializer with missing task_id."""
        data = {"status": "SUCCESS"}
        serializer = TaskUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("task_id", serializer.errors)

    def test_invalid_status(self):
        """Test serializer with invalid status."""
        data = {"task_id": 123, "status": "INVALID_STATUS"}
        serializer = TaskUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("status", serializer.errors)
        self.assertIn("Status must be one of: RUNNING, SUCCESS, ERRORED, KILLED", str(serializer.errors["status"]))

    def test_valid_statuses(self):
        """Test serializer with all valid status values."""
        valid_statuses = ["RUNNING", "SUCCESS", "ERRORED", "KILLED"]
        for status_value in valid_statuses:
            data = {"task_id": 123, "status": status_value}
            serializer = TaskUpdateSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Status {status_value} should be valid")

    def test_optional_fields(self):
        """Test serializer with only required fields."""
        data = {"task_id": 123}
        serializer = TaskUpdateSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class TaskResponseSerializerTestCase(TestCase):
    """Test TaskResponseSerializer."""

    def test_valid_data(self):
        """Test serializer with valid task response data."""
        data = {
            "id": 123,
            "name": "test-task",
            "status": "SUCCESS",
            "progress_message": "Task completed",
            "progress_value": 100,
            "end_value": 100,
            "result": {"result": "success"},
            "updated_at": "2023-01-01T12:00:00Z",
        }
        serializer = TaskResponseSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["id"], 123)
        self.assertEqual(serializer.validated_data["name"], "test-task")

    def test_missing_required_fields(self):
        """Test serializer with missing required fields."""
        data = {"id": 123}
        serializer = TaskResponseSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("name", serializer.errors)
        self.assertIn("status", serializer.errors)

    def test_optional_fields(self):
        """Test serializer with only required fields."""
        data = {
            "id": 123,
            "name": "test-task",
            "status": "SUCCESS",
        }
        serializer = TaskResponseSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class PipelineLaunchSerializerTestCase(TestCase):
    """Test PipelineLaunchSerializer."""

    def test_valid_data(self):
        """Test serializer with valid launch data."""
        version_uuid = str(uuid.uuid4())
        data = {
            "version": version_uuid,
            "config": {"country_name": "Burkina Faso", "use_demo_data": True},
        }
        serializer = PipelineLaunchSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(str(serializer.validated_data["version"]), version_uuid)
        self.assertEqual(serializer.validated_data["config"], data["config"])

    def test_missing_version(self):
        """Test serializer with missing version."""
        data = {"config": {"country_name": "Burkina Faso"}}
        serializer = PipelineLaunchSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("version", serializer.errors)

    def test_missing_config(self):
        """Test serializer with missing config."""
        data = {"version": str(uuid.uuid4())}
        serializer = PipelineLaunchSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("config", serializer.errors)

    def test_invalid_version_uuid(self):
        """Test serializer with invalid version UUID."""
        data = {
            "version": "not-a-uuid",
            "config": {"country_name": "Burkina Faso"},
        }
        serializer = PipelineLaunchSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("version", serializer.errors)

    def test_empty_config(self):
        """Test serializer with empty config."""
        data = {
            "version": str(uuid.uuid4()),
            "config": {},
        }
        serializer = PipelineLaunchSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["config"], {})

    def test_complex_config(self):
        """Test serializer with complex config data."""
        version_uuid = str(uuid.uuid4())
        config = {
            "country_name": "Burkina Faso",
            "use_demo_data": True,
            "max_records": 1000,
            "confidence_threshold": 0.85,
            "selected_regions": ["region1", "region2"],
            "settings": {"timeout": 300, "retries": 3},
        }
        data = {
            "version": version_uuid,
            "config": config,
        }
        serializer = PipelineLaunchSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["config"], config)
