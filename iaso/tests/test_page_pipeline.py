from unittest.mock import Mock, patch

from django.utils import timezone
from rest_framework import status

from iaso import models as m
from iaso.models.base import ERRORED, KILLED, QUEUED, RUNNING, SUCCESS
from iaso.models.openhexa import OpenHEXAInstance, OpenHEXAWorkspace
from iaso.models.task import Task
from iaso.test import TestCase


PIPELINE_ID = "720120b3-d82d-4ea4-a465-30ce7ad58443"
VERSION_ID = "e55c7f7f-ccd7-4470-9178-5db53878f715"


class PagePipelineButtonTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Pipeline page account")
        cls.other_account = m.Account.objects.create(name="Other account")
        cls.user = cls.create_user_with_profile(username="page_pipeline_user", account=cls.account)
        cls.other_user = cls.create_user_with_profile(username="other_pipeline_user", account=cls.other_account)
        cls.instance = OpenHEXAInstance.objects.create(
            name="Page pipeline OpenHEXA",
            url="https://test.openhexa.org/graphql/",
            token="test-token",
        )
        OpenHEXAWorkspace.objects.create(
            openhexa_instance=cls.instance,
            account=cls.account,
            slug="page-pipeline-workspace",
        )

    def setUp(self):
        self.client.force_login(self.user)

    def _page(self, **kwargs):
        values = {
            "type": "TEXT",
            "needs_authentication": True,
            "name": "Preparedness",
            "slug": "preparedness-page",
            "content": "<p>dashboard</p>",
            "account": self.account,
            "additional_config": {
                "pipeline_config": {
                    "pipeline_id": PIPELINE_ID,
                    "text": "Refresh dashboard",
                }
            },
        }
        values.update(kwargs)
        page = m.Page.objects.create(**values)
        page.users.add(self.user)
        return page

    def test_button_hidden_without_pipeline_id(self):
        page = self._page(slug="no-pipeline", additional_config={})
        response = self.client.get(f"/pages/{page.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotContains(response, "launchPipelineButton")

    def test_button_hidden_without_openhexa_config(self):
        OpenHEXAWorkspace.objects.all().delete()
        page = self._page(slug="no-openhexa")
        response = self.client.get(f"/pages/{page.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotContains(response, "launchPipelineButton")

    def test_button_shown_and_enabled(self):
        page = self._page()
        response = self.client.get(f"/pages/{page.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, 'id="launchPipelineButton"')
        self.assertContains(response, "Refresh dashboard")
        self.assertContains(response, "Refresh in progress.")
        self.assertContains(response, 'data-ongoing="false"')
        self.assertNotContains(response, 'disabled="disabled"')

    def test_button_disabled_while_external_task_is_ongoing(self):
        page = self._page(slug="ongoing-page")
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=RUNNING,
            external=True,
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID, "version": VERSION_ID, "config": {}}},
        )
        response = self.client.get(f"/pages/{page.slug}/")
        self.assertContains(response, 'data-ongoing="true"')
        self.assertContains(response, 'disabled="disabled"')
        status_response = self.client.get(f"/pages/{page.slug}/pipeline-status/")
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertTrue(status_response.json()["ongoing"])

    def test_finished_task_does_not_disable_button(self):
        page = self._page(slug="finished-page")
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=SUCCESS,
            external=True,
            ended_at=timezone.now(),
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        response = self.client.get(f"/pages/{page.slug}/pipeline-status/")
        self.assertFalse(response.json()["ongoing"])
        self.assertFalse(response.json()["failed"])

    def test_failed_task_is_reported_as_failed(self):
        page = self._page(slug="failed-page")
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=SUCCESS,
            external=True,
            ended_at=timezone.now(),
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=ERRORED,
            external=True,
            ended_at=timezone.now(),
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        response = self.client.get(f"/pages/{page.slug}/")
        self.assertContains(response, "The refresh failed.")
        self.assertContains(response, 'data-ongoing="false"')
        self.assertNotContains(response, 'disabled="disabled"')
        status_response = self.client.get(f"/pages/{page.slug}/pipeline-status/")
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.assertFalse(status_response.json()["ongoing"])
        self.assertTrue(status_response.json()["failed"])

    def test_ongoing_task_hides_an_older_failure(self):
        page = self._page(slug="failed-then-running")
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=KILLED,
            external=True,
            ended_at=timezone.now(),
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=RUNNING,
            external=True,
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        status_response = self.client.get(f"/pages/{page.slug}/pipeline-status/")
        self.assertTrue(status_response.json()["ongoing"])
        self.assertFalse(status_response.json()["failed"])

    def test_raw_page_includes_button(self):
        page = self._page(
            slug="raw-page",
            type="RAW",
            content="<html><body><p>raw</p></body></html>",
        )
        response = self.client.get(f"/pages/{page.slug}/")
        body = response.content.decode()
        self.assertIn("launchPipelineButton", body)
        self.assertLess(body.index("launchPipelineButton"), body.lower().index("</body>"))

    def test_launch_uses_openhexa_pipeline_task(self):
        page = self._page(slug="launch-page")
        task = Mock(id=42, status=QUEUED)
        with (
            patch("iaso.utils.page_pipeline.fetch_current_pipeline_version", return_value=VERSION_ID) as fetch_version,
            patch("iaso.utils.page_pipeline.launch_page_openhexa_pipeline", return_value=task) as launch,
        ):
            response = self.client.post(f"/pages/{page.slug}/launch-pipeline/")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["task"]["id"], 42)
        fetch_version.assert_called_once()
        self.assertEqual(launch.call_args.kwargs["pipeline_id"], PIPELINE_ID)
        self.assertEqual(launch.call_args.kwargs["version"], VERSION_ID)
        self.assertEqual(launch.call_args.kwargs["user"], self.user)
        self.assertNotIn("include_task_id", launch.call_args.kwargs)

    def test_page_launch_does_not_send_task_id(self):
        task = Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=QUEUED,
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        with patch(
            "iaso.tasks.launch_openhexa_pipeline.ExternalTaskModelViewSet.launch_task",
            return_value=ERRORED,
        ) as launch:
            from iaso.tasks.launch_openhexa_pipeline import launch_page_openhexa_pipeline

            launch_page_openhexa_pipeline(
                pipeline_id=PIPELINE_ID,
                openhexa_url="https://test.openhexa.org/graphql/",
                openhexa_token="token",
                version=VERSION_ID,
                task=task,
                _immediate=True,
                user=self.user,
            )
        self.assertIsNone(launch.call_args.kwargs["task_id"])
        self.assertEqual(launch.call_args.kwargs["config"], {})

    def test_launch_rejected_when_task_is_ongoing(self):
        page = self._page(slug="busy-page")
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=QUEUED,
            external=False,
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        with patch("iaso.utils.page_pipeline.launch_page_openhexa_pipeline") as launch:
            response = self.client.post(f"/pages/{page.slug}/launch-pipeline/")
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        launch.assert_not_called()

    def test_launch_forbidden_for_another_account(self):
        page = self._page(slug="foreign-page")
        self.client.force_login(self.other_user)
        response = self.client.post(f"/pages/{page.slug}/launch-pipeline/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_messages_follow_page_language(self):
        self.user.iaso_profile.language = "en"
        self.user.iaso_profile.save()
        page = self._page(
            slug="french-page",
            language="fr-be",
            additional_config={
                "pipeline_config": {"pipeline_id": PIPELINE_ID, "text": "Actualiser le tableau"},
            },
        )
        response = self.client.get(f"/pages/{page.slug}/")
        self.assertContains(response, "Actualiser le tableau")
        self.assertContains(response, "Actualisation en cours.")
        self.assertContains(response, "L\\u0027actualisation a échoué.")
        self.assertNotContains(response, "Refresh in progress.")
        self.assertNotContains(response, "The refresh failed.")

    def test_anonymous_user_does_not_see_button_on_public_page(self):
        page = self._page(slug="public-page", needs_authentication=False)
        self.client.logout()
        response = self.client.get(f"/pages/{page.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotContains(response, "launchPipelineButton")
