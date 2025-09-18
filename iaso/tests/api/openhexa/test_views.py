import uuid

from unittest.mock import Mock, patch

from django.utils import timezone
from rest_framework import status

from iaso import models as m
from iaso.models.base import RUNNING, SUCCESS
from iaso.models.json_config import Config
from iaso.test import APITestCase


class OpenHexaAPITestCase(APITestCase):
    """Base test case for OpenHexa API tests."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Test Account", default_version=cls.source_version)

        # Create user with permissions
        cls.user = cls.create_user_with_profile(
            username="testuser", account=cls.account, permissions=["iaso_data_tasks"]
        )

        # Create OpenHexa config
        cls.openhexa_config = Config.objects.create(
            slug="openhexa-config",
            content={
                "openhexa_url": "https://test.openhexa.org/graphql/",
                "openhexa_token": "test-token",
                "workspace_slug": "test-workspace",
            },
        )

    def setUp(self):
        """Set up for each test."""
        self.client.force_authenticate(self.user)


class PipelineListViewTestCase(OpenHexaAPITestCase):
    """Test PipelineListView."""

    def test_get_pipelines_success(self):
        """Test successful pipeline list retrieval."""
        mock_pipelines_data = {
            "pipelines": {
                "items": [
                    {
                        "id": "60fcb048-a5f6-4a79-9529-1ccfa55e75d1",
                        "name": "test_pipeline_1",
                        "currentVersion": {"versionNumber": 1},
                    },
                    {
                        "id": "70fcb048-a5f6-4a79-9529-1ccfa55e75d2",
                        "name": "test_pipeline_2",
                        "currentVersion": {"versionNumber": 2},
                    },
                ]
            }
        }

        with patch("iaso.api.openhexa.views.Client") as mock_client_class:
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            mock_client.execute.return_value = mock_pipelines_data

            response = self.client.get("/api/openhexa/pipelines/")

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("results", response.json())
            self.assertEqual(len(response.json()["results"]), 2)
            self.assertEqual(response.json()["results"][0]["name"], "test_pipeline_1")

    def test_get_pipelines_config_not_found(self):
        """Test pipeline list when OpenHexa config is not found."""
        # Delete the config
        self.openhexa_config.delete()

        response = self.client.get("/api/openhexa/pipelines/")

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("error", response.json())
        self.assertIn("OpenHexa configuration not found", response.json()["error"])

    def test_get_pipelines_graphql_error(self):
        """Test pipeline list when GraphQL call fails."""
        with patch("iaso.api.openhexa.views.Client") as mock_client_class:
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            mock_client.execute.side_effect = Exception("GraphQL error")

            response = self.client.get("/api/openhexa/pipelines/")

            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("error", response.json())
            self.assertIn("Failed to retrieve pipelines", response.json()["error"])

    def test_get_pipelines_unauthorized(self):
        """Test pipeline list without authentication."""
        self.client.logout()

        response = self.client.get("/api/openhexa/pipelines/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PipelineDetailViewTestCase(OpenHexaAPITestCase):
    """Test PipelineDetailView."""

    def setUp(self):
        """Set up for each test."""
        super().setUp()
        self.pipeline_id = "60fcb048-a5f6-4a79-9529-1ccfa55e75d1"

    def test_get_pipeline_detail_success(self):
        """Test successful pipeline detail retrieval."""
        mock_pipeline_data = {
            "pipeline": {
                "id": self.pipeline_id,
                "name": "test_pipeline",
                "currentVersion": {
                    "versionNumber": 1,
                    "id": str(uuid.uuid4()),
                    "parameters": [
                        {
                            "type": "str",
                            "name": "country_name",
                            "code": "country_name",
                            "default": "Burkina Faso",
                            "choices": None,
                            "required": True,
                            "multiple": False,
                        }
                    ],
                },
            }
        }

        with patch("iaso.api.openhexa.views.Client") as mock_client_class:
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            mock_client.execute.return_value = mock_pipeline_data

            response = self.client.get(f"/api/openhexa/pipelines/{self.pipeline_id}/")

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertEqual(data["id"], self.pipeline_id)
            self.assertEqual(data["name"], "test_pipeline")
            self.assertIn("currentVersion", data)
            self.assertIn("parameters", data["currentVersion"])

    def test_get_pipeline_detail_config_not_found(self):
        """Test pipeline detail when OpenHexa config is not found."""
        self.openhexa_config.delete()

        response = self.client.get(f"/api/openhexa/pipelines/{self.pipeline_id}/")

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("error", response.json())
        self.assertIn("OpenHexa configuration not found", response.json()["error"])

    def test_get_pipeline_detail_graphql_error(self):
        """Test pipeline detail when GraphQL call fails."""
        with patch("iaso.api.openhexa.views.Client") as mock_client_class:
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            mock_client.execute.side_effect = Exception("GraphQL error")

            response = self.client.get(f"/api/openhexa/pipelines/{self.pipeline_id}/")

            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("error", response.json())
            self.assertIn("Failed to retrieve pipeline details", response.json()["error"])

    def test_post_launch_pipeline_success(self):
        """Test successful pipeline launch."""
        version_uuid = str(uuid.uuid4())
        config = {"country_name": "Burkina Faso", "use_demo_data": True}

        with patch("iaso.api.openhexa.views.ExternalTaskModelViewSet.launch_task") as mock_launch_task:
            mock_launch_task.return_value = RUNNING

            response = self.client.post(
                f"/api/openhexa/pipelines/{self.pipeline_id}/launch/",
                data={
                    "version": version_uuid,
                    "config": config,
                },
                format="json",
            )

            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            data = response.json()
            self.assertIn("task", data)
            self.assertEqual(data["task"]["status"], RUNNING)
            # pipeline_id and version are no longer in the response, they're in task.params

            # Verify task was created
            task = m.Task.objects.get(pk=data["task"]["id"])
            self.assertEqual(task.external, True)
            self.assertEqual(task.status, RUNNING)
            self.assertIn("pipeline_id", task.params["kwargs"])

    def test_post_launch_pipeline_invalid_data(self):
        """Test pipeline launch with invalid data."""
        response = self.client.post(
            f"/api/openhexa/pipelines/{self.pipeline_id}/launch/",
            data={
                "version": "not-a-uuid",
                "config": {"country_name": "Burkina Faso"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_post_launch_pipeline_config_not_found(self):
        """Test pipeline launch when OpenHexa config is not found."""
        self.openhexa_config.delete()

        response = self.client.post(
            f"/api/openhexa/pipelines/{self.pipeline_id}/launch/",
            data={
                "version": str(uuid.uuid4()),
                "config": {"country_name": "Burkina Faso"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertIn("error", response.json())
        self.assertIn("OpenHexa configuration not found", response.json()["error"])

    def test_post_launch_pipeline_launch_error(self):
        """Test pipeline launch when launch_task fails."""
        version_uuid = str(uuid.uuid4())
        config = {"country_name": "Burkina Faso"}

        with patch("iaso.api.openhexa.views.ExternalTaskModelViewSet.launch_task") as mock_launch_task:
            mock_launch_task.side_effect = Exception("Launch failed")

            response = self.client.post(
                f"/api/openhexa/pipelines/{self.pipeline_id}/launch/",
                data={
                    "version": version_uuid,
                    "config": config,
                },
                format="json",
            )

            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("error", response.json())
            self.assertIn("Failed to launch pipeline", response.json()["error"])

    def test_patch_update_task_success(self):
        """Test successful task status update."""
        # Create a task first
        task = m.Task.objects.create(
            created_by=self.user,
            launcher=self.user,
            account=self.account,
            name="test-task",
            status=RUNNING,
            external=True,
            started_at=timezone.now(),
        )

        response = self.client.patch(
            f"/api/openhexa/pipelines/{self.pipeline_id}/",
            data={
                "task_id": task.pk,
                "status": SUCCESS,
                "progress_message": "Task completed",
                "progress_value": 100,
                "end_value": 100,
                "result_data": {"result": "success", "data": "test data"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("task", data)
        self.assertEqual(data["task"]["status"], SUCCESS)
        self.assertEqual(data["task"]["progress_message"], "Task completed")
        self.assertEqual(data["task"]["progress_value"], 100)

        # Verify task was updated
        task.refresh_from_db()
        self.assertEqual(task.status, SUCCESS)
        self.assertEqual(task.progress_message, "Task completed")
        self.assertEqual(task.progress_value, 100)
        self.assertIsNotNone(task.ended_at)

    def test_patch_update_task_missing_task_id(self):
        """Test task update without task_id."""
        response = self.client.patch(
            f"/api/openhexa/pipelines/{self.pipeline_id}/",
            data={
                "status": SUCCESS,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # With serializer validation, we get a different error format
        self.assertIn("task_id", response.json())

    def test_patch_update_task_not_found(self):
        """Test task update with non-existent task."""
        response = self.client.patch(
            f"/api/openhexa/pipelines/{self.pipeline_id}/",
            data={
                "task_id": 99999,
                "status": SUCCESS,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_update_task_not_external(self):
        """Test task update with non-external task."""
        # Create a non-external task
        task = m.Task.objects.create(
            created_by=self.user,
            launcher=self.user,
            account=self.account,
            name="test-task",
            status=RUNNING,
            external=False,  # Not external
            started_at=timezone.now(),
        )

        response = self.client.patch(
            f"/api/openhexa/pipelines/{self.pipeline_id}/",
            data={
                "task_id": task.pk,
                "status": SUCCESS,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.json())
        self.assertIn("Task is not external", response.json()["error"])

    def test_patch_update_task_error(self):
        """Test task update when update fails."""
        task = m.Task.objects.create(
            created_by=self.user,
            launcher=self.user,
            account=self.account,
            name="test-task",
            status=RUNNING,
            external=True,
            started_at=timezone.now(),
        )

        with patch.object(m.Task, "save", side_effect=Exception("Save failed")):
            response = self.client.patch(
                f"/api/openhexa/pipelines/{self.pipeline_id}/",
                data={
                    "task_id": task.pk,
                    "status": SUCCESS,
                },
                format="json",
            )

            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("error", response.json())
            self.assertIn("Failed to update task", response.json()["error"])
