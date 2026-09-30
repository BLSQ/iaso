from unittest.mock import Mock, patch

from django.utils import timezone
from rest_framework import status

from iaso import models as m
from iaso.models.base import ERRORED, KILLED, QUEUED, RUNNING, SUCCESS
from iaso.models.openhexa import OpenHEXAInstance, OpenHEXAWorkspace
from iaso.models.task import Task
from iaso.test import TestCase
from iaso.utils.page_pipeline import (
    PagePipelineError,
    account_has_openhexa_config,
    fetch_current_pipeline_version,
    page_pipeline_has_failed,
    page_pipeline_is_ongoing,
    start_page_pipeline,
)


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
        self.assertEqual(launch.call_args.kwargs["account_id"], self.account.id)
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
        self.assertTrue(response.json()["ongoing"])
        self.assertEqual(response.json()["error"], "The refresh could not be started.")
        self.assertNotIn("already running", response.content.decode())
        launch.assert_not_called()

    def test_user_from_another_account_can_launch(self):
        page = self._page(slug="foreign-page", needs_authentication=False)
        self.client.force_login(self.other_user)
        task = Mock(id=11, status=QUEUED)
        with (
            patch("iaso.utils.page_pipeline.fetch_current_pipeline_version", return_value=VERSION_ID),
            patch("iaso.utils.page_pipeline.launch_page_openhexa_pipeline", return_value=task) as launch,
        ):
            response = self.client.post(f"/pages/{page.slug}/launch-pipeline/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(launch.call_args.kwargs["account_id"], page.account_id)
        self.assertEqual(launch.call_args.kwargs["user"], self.other_user)

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

    def test_anonymous_visitor_sees_and_can_launch_on_a_public_page(self):
        page = self._page(slug="public-page", needs_authentication=False)
        self.client.logout()
        response = self.client.get(f"/pages/{page.slug}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertContains(response, 'id="launchPipelineButton"')
        status_response = self.client.get(f"/pages/{page.slug}/pipeline-status/")
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        task = Mock(id=9, status=QUEUED)
        with (
            patch("iaso.utils.page_pipeline.fetch_current_pipeline_version", return_value=VERSION_ID),
            patch("iaso.utils.page_pipeline.launch_page_openhexa_pipeline", return_value=task) as launch,
        ):
            launch_response = self.client.post(f"/pages/{page.slug}/launch-pipeline/")
        self.assertEqual(launch_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(launch.call_args.kwargs["account_id"], page.account_id)
        self.assertNotIn("user", launch.call_args.kwargs)

    def test_anonymous_visitor_can_launch_a_private_page(self):
        page = self._page(slug="private-page", needs_authentication=True)
        self.client.logout()
        task = Mock(id=12, status=QUEUED)
        with (
            patch("iaso.utils.page_pipeline.fetch_current_pipeline_version", return_value=VERSION_ID),
            patch("iaso.utils.page_pipeline.launch_page_openhexa_pipeline", return_value=task) as launch,
        ):
            response = self.client.post(f"/pages/{page.slug}/launch-pipeline/")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(launch.call_args.kwargs["account_id"], page.account_id)
        self.assertNotIn("user", launch.call_args.kwargs)

    def test_account_has_openhexa_config(self):
        self.assertTrue(account_has_openhexa_config(self.account))
        self.assertFalse(account_has_openhexa_config(self.other_account))
        self.assertFalse(account_has_openhexa_config(None))

    def test_ongoing_ignores_other_pipelines_and_accounts(self):
        page = self._page(slug="helpers-ongoing")
        self.assertFalse(page_pipeline_is_ongoing(page))
        Task.objects.create(
            account=self.other_account,
            created_by=self.other_user,
            launcher=self.other_user,
            name="launch_openhexa_pipeline",
            status=RUNNING,
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=QUEUED,
            params={"args": [], "kwargs": {"pipeline_id": "other-pipeline"}},
        )
        self.assertFalse(page_pipeline_is_ongoing(page))
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=QUEUED,
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        self.assertTrue(page_pipeline_is_ongoing(page))

    def test_ongoing_and_failed_are_false_without_pipeline_or_account(self):
        page = self._page(slug="helpers-empty", additional_config={}, account=None)
        self.assertFalse(page_pipeline_is_ongoing(page))
        self.assertFalse(page_pipeline_has_failed(page))

    def test_failed_uses_the_latest_task_for_this_pipeline(self):
        page = self._page(slug="helpers-failed")
        self.assertFalse(page_pipeline_has_failed(page))
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=ERRORED,
            params={"args": [], "kwargs": {"pipeline_id": "other-pipeline"}},
        )
        self.assertFalse(page_pipeline_has_failed(page))
        Task.objects.create(
            account=self.account,
            created_by=self.user,
            launcher=self.user,
            name="launch_openhexa_pipeline",
            status=KILLED,
            params={"args": [], "kwargs": {"pipeline_id": PIPELINE_ID}},
        )
        self.assertTrue(page_pipeline_has_failed(page))

    def test_fetch_current_pipeline_version_returns_the_id(self):
        client = Mock()
        client.execute.return_value = {"pipeline": {"currentVersion": {"id": VERSION_ID}}}
        with patch("iaso.utils.page_pipeline.Client", return_value=client) as client_cls:
            version = fetch_current_pipeline_version(
                "https://test.openhexa.org/graphql/",
                "test-token",
                PIPELINE_ID,
            )
        self.assertEqual(version, VERSION_ID)
        self.assertEqual(client.execute.call_args.kwargs["variable_values"], {"pipelineId": PIPELINE_ID})
        transport = client_cls.call_args.kwargs["transport"]
        self.assertEqual(transport.headers["Authorization"], "Bearer test-token")
        self.assertEqual(transport.url, "https://test.openhexa.org/graphql/")

    def test_fetch_current_pipeline_version_reports_transport_failure(self):
        client = Mock()
        client.execute.side_effect = RuntimeError("down")
        with patch("iaso.utils.page_pipeline.Client", return_value=client):
            with self.assertRaises(PagePipelineError) as raised:
                fetch_current_pipeline_version("https://test.openhexa.org/graphql/", "test-token", PIPELINE_ID)
        self.assertEqual(raised.exception.status_code, status.HTTP_502_BAD_GATEWAY)

    def test_fetch_current_pipeline_version_requires_a_current_version(self):
        client = Mock()
        client.execute.return_value = {"pipeline": {}}
        with patch("iaso.utils.page_pipeline.Client", return_value=client):
            with self.assertRaises(PagePipelineError) as raised:
                fetch_current_pipeline_version("https://test.openhexa.org/graphql/", "test-token", PIPELINE_ID)
        self.assertEqual(raised.exception.status_code, status.HTTP_400_BAD_REQUEST)

    def test_start_page_pipeline_passes_the_account_openhexa_config(self):
        page = self._page(slug="helpers-start")
        launched = Mock(id=7, status=QUEUED)
        with (
            patch("iaso.utils.page_pipeline.fetch_current_pipeline_version", return_value=VERSION_ID) as fetch_version,
            patch("iaso.utils.page_pipeline.launch_page_openhexa_pipeline", return_value=launched) as launch,
        ):
            task = start_page_pipeline(self.user, page)
        self.assertEqual(task, launched)
        fetch_version.assert_called_once_with("https://test.openhexa.org/graphql/", "test-token", PIPELINE_ID)
        self.assertEqual(launch.call_args.kwargs["openhexa_url"], "https://test.openhexa.org/graphql/")
        self.assertEqual(launch.call_args.kwargs["openhexa_token"], "test-token")
        self.assertEqual(launch.call_args.kwargs["pipeline_id"], PIPELINE_ID)
        self.assertEqual(launch.call_args.kwargs["version"], VERSION_ID)
        self.assertEqual(launch.call_args.kwargs["user"], self.user)
        self.assertEqual(launch.call_args.kwargs["account_id"], page.account_id)

    def test_start_page_pipeline_stops_when_openhexa_is_missing(self):
        OpenHEXAWorkspace.objects.filter(account=self.account).delete()
        page = self._page(slug="helpers-no-openhexa")
        with patch("iaso.utils.page_pipeline.launch_page_openhexa_pipeline") as launch:
            with self.assertRaises(PagePipelineError) as raised:
                start_page_pipeline(self.user, page)
        self.assertEqual(raised.exception.status_code, status.HTTP_400_BAD_REQUEST)
        launch.assert_not_called()

    def test_start_page_pipeline_does_not_launch_when_version_lookup_fails(self):
        page = self._page(slug="helpers-version-fails")
        with (
            patch(
                "iaso.utils.page_pipeline.fetch_current_pipeline_version",
                side_effect=PagePipelineError("version_lookup_failed", status_code=502),
            ),
            patch("iaso.utils.page_pipeline.launch_page_openhexa_pipeline") as launch,
        ):
            with self.assertRaises(PagePipelineError) as raised:
                start_page_pipeline(self.user, page)
        self.assertEqual(raised.exception.status_code, status.HTTP_502_BAD_GATEWAY)
        launch.assert_not_called()

    def test_launch_view_returns_the_pipeline_error_status(self):
        page = self._page(slug="helpers-launch-error")
        with patch(
            "iaso.utils.page_pipeline.fetch_current_pipeline_version",
            side_effect=PagePipelineError("version_lookup_failed", status_code=502),
        ):
            response = self.client.post(f"/pages/{page.slug}/launch-pipeline/")
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.json()["error"], "Failed to fetch pipeline version")
        self.assertNotIn("version_lookup_failed", response.content.decode())
