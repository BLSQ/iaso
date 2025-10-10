import uuid

from unittest.mock import Mock, patch

from django.utils import timezone
from rest_framework import status

from iaso import models as m
from iaso.models.base import QUEUED, RUNNING, SUCCESS
from iaso.models.json_config import Config
from iaso.permissions.core_permissions import CORE_DATA_TASKS_PERMISSION
from iaso.tasks.launch_openhexa_pipeline import launch_openhexa_pipeline
from iaso.test import APITestCase


class OpenHexaAPITestCase(APITestCase):
    """Base test case for OpenHexa API tests."""

    @classmethod
    def setUpTestData(cls):
        """Set up test data."""
        cls.account, cls.data_source, cls.source_version, cls.project = cls.create_account_datasource_version_project(
            "Default source", "Test Account", "Test Project"
        )

        # Create user with permissions
        cls.user = cls.create_user_with_profile(
            username="testuser", account=cls.account, permissions=[CORE_DATA_TASKS_PERMISSION]
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

    def test_get_pipelines_anonymous_user(self):
        """Test pipeline list with anonymous user."""
        self.client.force_authenticate(user=None)

        response = self.client.get("/api/openhexa/pipelines/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_pipelines_invalid_url_format(self):
        """Test pipeline list when OpenHexa URL format is invalid."""
        # Update the config with an invalid URL
        self.openhexa_config.content = {
            "openhexa_url": "not-a-valid-url",
            "openhexa_token": "test-token",
            "workspace_slug": "test-workspace",
        }
        self.openhexa_config.save()

        with patch("iaso.api.openhexa.views.Client") as mock_client_class:
            mock_client = Mock()
            mock_client_class.return_value = mock_client
            mock_client.execute.side_effect = Exception("Invalid URL format")

            response = self.client.get("/api/openhexa/pipelines/")

            self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
            self.assertIn("error", response.json())
            self.assertIn("OpenHexa configuration not found", response.json()["error"])


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

        with (
            patch("iaso.api.openhexa.views.launch_openhexa_pipeline") as mock_launch_task,
            patch("iaso.api.openhexa.views.get_user_token") as mock_get_user_token,
        ):
            # Create a mock task object
            mock_task = m.Task.objects.create(
                created_by=self.user,
                launcher=self.user,
                account=self.account,
                name="launch_openhexa_pipeline",
                status=RUNNING,
                external=True,
                started_at=timezone.now(),
            )
            mock_launch_task.return_value = mock_task
            mock_get_user_token.return_value = "test-jwt-token"

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

            # Verify that launch_openhexa_pipeline was called with correct parameters
            mock_launch_task.assert_called_once()
            call_args = mock_launch_task.call_args
            self.assertEqual(call_args[1]["user"], self.user)
            self.assertEqual(call_args[1]["pipeline_id"], self.pipeline_id)
            self.assertEqual(call_args[1]["version"], version_uuid)
            self.assertEqual(call_args[1]["config"]["country_name"], "Burkina Faso")
            self.assertEqual(call_args[1]["config"]["use_demo_data"], True)

            # Verify that connection_token and connection_host were added to config
            updated_config = call_args[1]["config"]
            self.assertIn("connection_token", updated_config)
            self.assertEqual(updated_config["connection_token"], "test-jwt-token")
            self.assertIn("connection_host", updated_config)
            self.assertEqual(updated_config["connection_host"], "http://testserver")

            # Verify get_user_token was called with the correct user
            mock_get_user_token.assert_called_once_with(self.user)

    def test_post_launch_pipeline_token_generation_error(self):
        """Test pipeline launch when token generation fails."""
        version_uuid = str(uuid.uuid4())
        config = {"country_name": "Burkina Faso"}

        with (
            patch("iaso.api.tasks.views.ExternalTaskModelViewSet.launch_task") as mock_launch_task,
            patch("iaso.api.openhexa.views.get_user_token") as mock_get_user_token,
        ):
            mock_launch_task.return_value = RUNNING
            mock_get_user_token.side_effect = Exception("Token generation failed")

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
            self.assertIn("Failed to generate authentication token", response.json()["error"])

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
        """Test pipeline launch when launch_openhexa_pipeline fails."""
        version_uuid = str(uuid.uuid4())
        config = {"country_name": "Burkina Faso"}

        with patch("iaso.api.openhexa.views.launch_openhexa_pipeline") as mock_launch_task:
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

    def test_patch_update_task_progress_only(self):
        """Test task update with progress only (no status change)."""
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
                "progress_message": "Processing data...",
                "progress_value": 50,
                "end_value": 100,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("task", data)
        self.assertEqual(data["task"]["status"], RUNNING)  # Status should remain RUNNING
        self.assertEqual(data["task"]["progress_message"], "Processing data...")
        self.assertEqual(data["task"]["progress_value"], 50)

        # Verify task was updated
        task.refresh_from_db()
        self.assertEqual(task.status, RUNNING)  # Status unchanged
        self.assertEqual(task.progress_message, "Processing data...")
        self.assertEqual(task.progress_value, 50)

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

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("task_id", response.json())

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

        with patch.object(m.Task, "report_success_with_result", side_effect=Exception("Save failed")):
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

    def test_post_launch_pipeline_anonymous_user(self):
        """Test pipeline launch with anonymous user."""
        self.client.force_authenticate(user=None)

        response = self.client.post(
            f"/api/openhexa/pipelines/{self.pipeline_id}/launch/",
            data={
                "version": str(uuid.uuid4()),
                "config": {"country_name": "Burkina Faso"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_update_task_anonymous_user(self):
        """Test task update with anonymous user."""
        self.client.force_authenticate(user=None)

        response = self.client.patch(
            f"/api/openhexa/pipelines/{self.pipeline_id}/",
            data={
                "task_id": 123,
                "status": SUCCESS,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_pipeline_detail_anonymous_user(self):
        """Test pipeline detail retrieval with anonymous user."""
        self.client.force_authenticate(user=None)

        response = self.client.get(f"/api/openhexa/pipelines/{self.pipeline_id}/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class BackgroundTaskTestCase(OpenHexaAPITestCase):
    """Test the background task system for OpenHEXA pipeline monitoring."""

    @patch("iaso.tasks.launch_openhexa_pipeline.ExternalTaskModelViewSet.launch_task")
    def test_launch_openhexa_pipeline_task_creation(self, mock_launch):
        """Test that the background task is properly created and configured."""
        from iaso.tasks.launch_openhexa_pipeline import launch_openhexa_pipeline

        pipeline_id = "test-pipeline-id"
        openhexa_url = "https://test.openhexa.org/graphql/"
        openhexa_token = "test-token"
        version = str(uuid.uuid4())
        config = {"test_param": "test_value"}

        mock_launch.return_value = RUNNING

        # Create a task manually to test the function execution
        task = m.Task.objects.create(
            created_by=self.user,
            launcher=self.user,
            account=self.account,
            name="launch_openhexa_pipeline",
            status=RUNNING,
            external=False,  # Will be set to True by the function
            started_at=timezone.now(),
        )

        # Call the function with _immediate=True to execute it directly
        launch_openhexa_pipeline(
            pipeline_id=pipeline_id,
            openhexa_url=openhexa_url,
            openhexa_token=openhexa_token,
            version=version,
            config=config,
            _immediate=True,
            task=task,
        )

        # Verify task was configured correctly
        task.refresh_from_db()

        # Verify task was configured correctly
        self.assertTrue(task.external)
        self.assertEqual(task.status, QUEUED)

        # Verify ExternalTaskModelViewSet.launch_task was called
        mock_launch.assert_called_once()

    def test_launch_openhexa_pipeline_with_beanstalk_worker(self):
        """Test that the function works with beanstalk_worker decorator."""

        pipeline_id = "test-pipeline-id"
        openhexa_url = "https://test.openhexa.org/graphql/"
        openhexa_token = "test-token"
        version = str(uuid.uuid4())
        config = {"test_param": "test_value"}

        # Call the decorated function (this will create a task automatically)
        result_task = launch_openhexa_pipeline(
            user=self.user,
            pipeline_id=pipeline_id,
            openhexa_url=openhexa_url,
            openhexa_token=openhexa_token,
            version=version,
            config=config,
        )

        # Verify a task was created
        self.assertIsNotNone(result_task)
        # The decorator creates a task but doesn't set external=True automatically
        # The external flag is only set when the function code runs
        self.assertFalse(result_task.external)
        self.assertEqual(result_task.launcher, self.user)
        self.assertEqual(result_task.account, self.account)
        self.assertEqual(result_task.name, "launch_openhexa_pipeline")
        self.assertIn("pipeline_id", result_task.params["kwargs"])
        self.assertEqual(result_task.params["kwargs"]["pipeline_id"], pipeline_id)


class ConfigCheckViewTestCase(OpenHexaAPITestCase):
    """Test ConfigCheckView."""

    def test_get_config_configured(self):
        """Test config check when OpenHexa is properly configured."""
        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertTrue(data["configured"])

    def test_get_config_not_configured_missing_config(self):
        """Test config check when OpenHexa config doesn't exist."""
        # Delete the config
        self.openhexa_config.delete()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertFalse(data["configured"])

    def test_get_config_not_configured_missing_fields(self):
        """Test config check when OpenHexa config exists but is incomplete."""
        # Update config to be incomplete
        self.openhexa_config.content = {
            "openhexa_url": "https://test.openhexa.org/graphql/",
            # Missing openhexa_token and workspace_slug
        }
        self.openhexa_config.save()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertFalse(data["configured"])

    def test_get_config_not_configured_empty_fields(self):
        """Test config check when OpenHexa config has empty required fields."""
        # Update config with empty fields
        self.openhexa_config.content = {
            "openhexa_url": "",
            "openhexa_token": "",
            "workspace_slug": "",
        }
        self.openhexa_config.save()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertFalse(data["configured"])

    def test_get_config_not_configured_partial_fields(self):
        """Test config check when OpenHexa config has some fields missing."""
        # Update config with only some fields
        self.openhexa_config.content = {
            "openhexa_url": "https://test.openhexa.org/graphql/",
            "openhexa_token": "test-token",
            # Missing workspace_slug
        }
        self.openhexa_config.save()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertFalse(data["configured"])

    def test_get_config_unauthorized(self):
        """Test config check without authentication."""
        self.client.logout()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_config_with_extra_fields(self):
        """Test config check when OpenHexa config has extra fields (should still work)."""
        # Update config with extra fields
        self.openhexa_config.content = {
            "openhexa_url": "https://test.openhexa.org/graphql/",
            "openhexa_token": "test-token",
            "workspace_slug": "test-workspace",
            "extra_field": "extra_value",  # Extra field
            "another_field": "another_value",  # Another extra field
        }
        self.openhexa_config.save()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertTrue(data["configured"])

    def test_get_config_with_lqas_pipeline_code(self):
        """Test config check when OpenHexa config includes lqas_pipeline_code."""
        # Update config with lqas_pipeline_code
        self.openhexa_config.content = {
            "openhexa_url": "https://test.openhexa.org/graphql/",
            "openhexa_token": "test-token",
            "workspace_slug": "test-workspace",
            "lqas_pipeline_code": "lqas-pipeline-123",
        }
        self.openhexa_config.save()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertTrue(data["configured"])
        self.assertIn("lqas_pipeline_code", data)
        self.assertEqual(data["lqas_pipeline_code"], "lqas-pipeline-123")

    def test_get_config_without_lqas_pipeline_code(self):
        """Test config check when OpenHexa config doesn't include lqas_pipeline_code."""
        # Config without lqas_pipeline_code (default setup)
        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertTrue(data["configured"])
        self.assertNotIn("lqas_pipeline_code", data)

    def test_get_config_with_empty_lqas_pipeline_code(self):
        """Test config check when OpenHexa config has empty lqas_pipeline_code."""
        # Update config with empty lqas_pipeline_code
        self.openhexa_config.content = {
            "openhexa_url": "https://test.openhexa.org/graphql/",
            "openhexa_token": "test-token",
            "workspace_slug": "test-workspace",
            "lqas_pipeline_code": "",  # Empty value
        }
        self.openhexa_config.save()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertTrue(data["configured"])
        self.assertNotIn("lqas_pipeline_code", data)  # Should not be included if empty

    def test_get_config_with_null_lqas_pipeline_code(self):
        """Test config check when OpenHexa config has null lqas_pipeline_code."""
        # Update config with null lqas_pipeline_code
        self.openhexa_config.content = {
            "openhexa_url": "https://test.openhexa.org/graphql/",
            "openhexa_token": "test-token",
            "workspace_slug": "test-workspace",
            "lqas_pipeline_code": None,  # Null value
        }
        self.openhexa_config.save()

        response = self.client.get("/api/openhexa/pipelines/config/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("configured", data)
        self.assertTrue(data["configured"])
        self.assertNotIn("lqas_pipeline_code", data)  # Should not be included if null
