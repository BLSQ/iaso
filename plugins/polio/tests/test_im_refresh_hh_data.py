from datetime import datetime
from unittest.mock import patch

from iaso import models as m
from iaso.models.base import KILLED, RUNNING, SKIPPED, SUCCESS
from iaso.test import APITestCase
from plugins.polio.tasks.api.refresh_im_data import IM_HH_CONFIG_SLUG, RefreshIMHouseholdDataViewset


class RefreshIMHouseholdDataTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.url = "/api/polio/tasks/refreshim/hh/"
        cls.action_url = f"{cls.url}last_run_for_country/"
        cls.account = account = m.Account.objects.create(name="test account")
        cls.user = cls.create_user_with_profile(username="test user", account=account, permissions=["iaso_polio"])

        cls.external_task1 = m.Task.objects.create(
            status=RUNNING, account=account, launcher=cls.user, name="external task 1", external=True
        )
        cls.external_task2 = m.Task.objects.create(
            status=RUNNING, account=account, launcher=cls.user, name="external task 2", external=True
        )
        cls.country = m.OrgUnitType.objects.create(name="Country", depth=1, category="COUNTRY")
        cls.project = m.Project.objects.create(name="Polio", app_id="polio.rapid.outbreak.taskforce", account=account)
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.data_source.projects.add(cls.project)
        cls.data_source.save()
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account.default_version = cls.source_version
        cls.account.save()
        cls.country_org_unit = m.OrgUnit.objects.create(
            name="Country1",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.country,
            version=cls.source_version,
        )
        cls.other_country_org_unit = m.OrgUnit.objects.create(
            name="Country2",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            org_unit_type=cls.country,
            version=cls.source_version,
        )
        cls.task1 = m.Task.objects.create(
            status=RUNNING,
            account=account,
            launcher=cls.user,
            name=IM_HH_CONFIG_SLUG,
            started_at=datetime.now(),
            external=True,
        )
        cls.task2 = m.Task.objects.create(
            status=RUNNING, account=account, launcher=cls.user, name="task 2", external=True
        )
        cls.limited_user = cls.create_user_with_profile(
            username="other user", account=account, permissions=["iaso_polio"], org_units=[cls.other_country_org_unit]
        )
        cls.json_config = {
            "pipeline": "pipeline",
            "openhexa_url": "https://yippie.openhexa.xyz/",
            "openhexa_token": "token",
            "pipeline_version": 1,
            "oh_pipeline_target": "staging",
        }

    def mock_openhexa_call_success(self, slug=None, config=None, id_field=None, task_id=None):
        return SUCCESS

    def mock_openhexa_call_skipped(self, slug=None, config=None, id_field=None, task_id=None):
        return SKIPPED

    def mock_openhexa_call_running(self, slug=None, config=None, id_field=None, task_id=None):
        return RUNNING

    def test_no_perm(self):
        user_no_perm = self.create_user_with_profile(username="test user2", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perm)
        response = self.client.get(
            self.url,
            format="json",
        )
        jr = self.assertJSONResponse(response, 403)
        self.assertEqual({"detail": "You do not have permission to perform this action."}, jr)

        response = self.client.post(
            self.url,
            format="json",
            data={
                "id_field": {"country_id": self.country_org_unit.id},
                "config": {"country_id": self.country_org_unit.id},
                "slug": IM_HH_CONFIG_SLUG,
            },
        )
        jr = self.assertJSONResponse(response, 403)
        self.assertEqual({"detail": "You do not have permission to perform this action."}, jr)

    @patch.object(RefreshIMHouseholdDataViewset, "launch_task", mock_openhexa_call_running)
    def test_create_external_task(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={
                "id_field": {"country_id": self.country_org_unit.id},
                "config": {"country_id": self.country_org_unit.id},
                "slug": IM_HH_CONFIG_SLUG,
            },
        )
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        self.assertEqual(task["status"], RUNNING)
        self.assertEqual(task["launcher"]["username"], self.user.username)
        self.assertEqual(task["name"], f"{IM_HH_CONFIG_SLUG}-{self.country_org_unit.id}")

    @patch.object(RefreshIMHouseholdDataViewset, "launch_task", mock_openhexa_call_skipped)
    def test_create_external_task_pipeline_already_running(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={
                "id_field": {"country_id": self.country_org_unit.id},
                "config": {"country_id": self.country_org_unit.id},
                "slug": IM_HH_CONFIG_SLUG,
            },
        )
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        self.assertEqual(task["status"], SKIPPED)
        self.assertEqual(task["launcher"]["username"], self.user.username)
        self.assertEqual(task["name"], f"{IM_HH_CONFIG_SLUG}-{self.country_org_unit.id}")

    @patch.object(RefreshIMHouseholdDataViewset, "launch_task", mock_openhexa_call_running)
    def test_patch_external_task(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={
                "id_field": {"country_id": self.country_org_unit.id},
                "config": {"country_id": self.country_org_unit.id},
                "slug": IM_HH_CONFIG_SLUG,
            },
        )
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        task_id = task["id"]
        self.assertEqual(task["status"], RUNNING)
        self.assertEqual(task["progress_value"], 0)
        self.assertEqual(task["end_value"], 0)

        response = self.client.patch(
            f"{self.url}{task_id}/", format="json", data={"status": SUCCESS, "progress_value": 21}
        )
        response = self.assertJSONResponse(response, 200)
        task = response
        self.assertEqual(task["id"], task_id)
        self.assertEqual(task["status"], SUCCESS)
        self.assertEqual(task["progress_value"], 21)
        self.assertEqual(task["end_value"], 0)

    @patch.object(RefreshIMHouseholdDataViewset, "launch_task", mock_openhexa_call_running)
    def test_kill_external_task(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            self.url,
            format="json",
            data={
                "id_field": {"country_id": self.country_org_unit.id},
                "config": {"country_id": self.country_org_unit.id},
                "slug": IM_HH_CONFIG_SLUG,
            },
        )
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        task_id = task["id"]
        self.assertEqual(task["status"], RUNNING)

        response = self.client.patch(
            f"{self.url}{task_id}/",
            format="json",
            data={
                "should_be_killed": True,
            },
        )
        response = self.assertJSONResponse(response, 200)
        task = response
        self.assertEqual(task["id"], task_id)
        self.assertEqual(task["status"], KILLED)

    def test_get_latest_for_country(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"{self.action_url}?country_id={self.country_org_unit.id}")
        response = self.assertJSONResponse(response, 200)
        task = response["task"]
        self.assertEqual(task["id"], self.task1.id)
        self.assertEqual(task["ended_at"], self.task1.ended_at)
        self.assertEqual(task["status"], self.task1.status)

    def test_restrict_user_country(self):
        self.client.force_authenticate(self.limited_user)
        response = self.client.get(f"{self.action_url}?country_id={self.country_org_unit.id}")
        response = self.assertJSONResponse(response, 400)
        self.assertEqual(response, {"country_id": ["No authorised org unit found for user"]})
