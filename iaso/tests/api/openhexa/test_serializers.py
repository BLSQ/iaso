import uuid

from django.test import TestCase

from iaso.api.openhexa.serializers import (
    PipelineLaunchSerializer,
    TaskResponseSerializer,
    TaskUpdateSerializer,
)
from iaso.models import Task
from iaso.test import IasoTestCaseMixin


class TaskUpdateSerializerTestCase(TestCase, IasoTestCaseMixin):
    """Test TaskUpdateSerializer."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Test Source", "Test Account", "Test Project"
        )
        cls.user = cls.create_user_with_profile(username="testuser", account=cls.account)
        cls.task = Task.objects.create(name="Test Task", account=cls.account, created_by=cls.user, status="QUEUED")

    def test_valid_data(self):
        """Test serializer with valid task update data."""
        data = {
            "task_id": self.task.id,
            "status": "SUCCESS",
            "progress_message": "Task completed",
            "progress_value": 100,
            "end_value": 100,
            "result_data": {"result": "success"},
        }
        serializer = TaskUpdateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data["id"], self.task.id)
        self.assertEqual(serializer.validated_data["status"], "SUCCESS")

    def test_serializer_with_task_instance(self):
        """Test serializer with actual Task instance (ModelSerializer advantage)."""
        # Update the task with some data
        self.task.status = "SUCCESS"
        self.task.progress_message = "Task completed"
        self.task.progress_value = 100
        self.task.end_value = 100
        self.task.result = {"result": "success"}
        self.task.save()

        # Pass the Task instance directly to the serializer
        serializer = TaskUpdateSerializer(self.task)
        self.assertEqual(serializer.data["task_id"], self.task.id)
        self.assertEqual(serializer.data["status"], "SUCCESS")
        self.assertEqual(serializer.data["progress_message"], "Task completed")
        self.assertEqual(serializer.data["progress_value"], 100)
        self.assertEqual(serializer.data["end_value"], 100)
        self.assertEqual(serializer.data["result_data"], {"result": "success"})

    def test_missing_task_id(self):
        """Test serializer with missing task_id."""
        data = {"status": "SUCCESS"}
        serializer = TaskUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("task_id", serializer.errors)

    def test_invalid_status(self):
        """Test serializer with invalid status."""
        data = {"task_id": self.task.id, "status": "INVALID_STATUS"}
        serializer = TaskUpdateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("status", serializer.errors)
        self.assertIn("is not a valid choice", str(serializer.errors["status"]))

    def test_valid_statuses(self):
        """Test serializer with all valid status values."""
        valid_statuses = ["RUNNING", "SUCCESS", "ERRORED", "KILLED"]
        for status_value in valid_statuses:
            data = {"task_id": self.task.id, "status": status_value}
            serializer = TaskUpdateSerializer(data=data)
            self.assertTrue(serializer.is_valid(), f"Status {status_value} should be valid")

    def test_optional_fields(self):
        """Test serializer with only required fields."""
        data = {"task_id": self.task.id}
        serializer = TaskUpdateSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_with_different_task_instances(self):
        """Test serializer with different Task instances to show ModelSerializer flexibility."""
        # Create another task with different data
        task2 = Task.objects.create(
            name="Another Task",
            account=self.account,
            created_by=self.user,
            status="RUNNING",
            progress_message="Processing...",
            progress_value=50,
            end_value=100,
            result={"step": "halfway"},
        )

        # Test serializing the second task
        serializer = TaskUpdateSerializer(task2)
        self.assertEqual(serializer.data["task_id"], task2.id)
        self.assertEqual(serializer.data["status"], "RUNNING")
        self.assertEqual(serializer.data["progress_message"], "Processing...")
        self.assertEqual(serializer.data["progress_value"], 50)
        self.assertEqual(serializer.data["end_value"], 100)
        self.assertEqual(serializer.data["result_data"], {"step": "halfway"})

    def test_serializer_with_task_instance_and_data_update(self):
        """Test updating a Task instance using serializer data."""
        # Start with a task instance
        serializer = TaskUpdateSerializer(self.task)
        original_data = serializer.data

        # Update the task with new data
        update_data = {
            "task_id": self.task.id,
            "status": "SUCCESS",
            "progress_message": "Completed successfully",
            "progress_value": 100,
            "end_value": 100,
            "result_data": {"final_result": "success"},
        }

        # Validate the update data
        update_serializer = TaskUpdateSerializer(data=update_data)
        self.assertTrue(update_serializer.is_valid())

        # Apply the update to the task instance
        self.task.status = update_serializer.validated_data["status"]
        self.task.progress_message = update_serializer.validated_data["progress_message"]
        self.task.progress_value = update_serializer.validated_data["progress_value"]
        self.task.end_value = update_serializer.validated_data["end_value"]
        self.task.result = update_serializer.validated_data["result"]
        self.task.save()

        # Verify the updated task
        updated_serializer = TaskUpdateSerializer(self.task)
        self.assertEqual(updated_serializer.data["status"], "SUCCESS")
        self.assertEqual(updated_serializer.data["progress_message"], "Completed successfully")
        self.assertEqual(updated_serializer.data["result_data"], {"final_result": "success"})


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
