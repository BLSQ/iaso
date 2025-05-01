import datetime

from django.contrib.auth.models import AnonymousUser
from django.utils.timezone import now

from iaso.models import Account, DataSource, Group, OrgUnit, OrgUnitType, SourceVersion
from iaso.test import APITestCase
from plugins.polio.models import Campaign, Round, SubActivity, SubActivityScope


BASE_URL = "/api/polio/campaigns_subactivities/"


class SubactivitiesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.data_source = DataSource.objects.create(name="Default source")
        cls.default_source_version = SourceVersion.objects.create(data_source=cls.data_source, number=1)

        cls.now = now()
        cls.account = Account.objects.create(name="Test Account", default_version=cls.default_source_version)
        cls.user = cls.create_user_with_profile(username="Test User", account=cls.account, permissions=[])
        cls.anon = AnonymousUser()

        cls.default_org_unit_type = OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.org_unit = OrgUnit.objects.create(
            name="Test Org Unit",
            version=cls.account.default_version,
            org_unit_type=cls.default_org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.campaign = Campaign.objects.create(obr_name="Test Campaign", account=cls.account, country=cls.org_unit)

        cls.round = Round.objects.create(campaign=cls.campaign, number=1)
        cls.campaign.rounds.add(cls.round)

        cls.sub_activity = SubActivity.objects.create(
            name="Test SubActivity",
            round=cls.round,
            start_date=datetime.date(2022, 1, 1),
            end_date=datetime.date(2022, 1, 31),
        )

        cls.group = Group.objects.create(name="Test group", source_version=cls.default_source_version)
        cls.group.org_units.add(cls.org_unit)

        cls.sub_activity_scope = SubActivityScope.objects.create(
            subactivity=cls.sub_activity, group=cls.group, vaccine="mOPV2"
        )

    def test_create_sub_activity(self):
        data = {
            "round_number": self.round.number,
            "campaign": self.campaign.obr_name,
            "name": "New SubActivity",
            "start_date": "2022-02-01",
            "end_date": "2022-02-28",
            "scopes": [{"group": {"name": "New Group", "org_units": [self.org_unit.id]}, "vaccine": "mOPV2"}],
        }
        self.client.force_authenticate(self.user)
        response = self.client.post(BASE_URL, data, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(SubActivity.objects.count(), 2)
        self.assertEqual(SubActivityScope.objects.count(), 2)

    def test_anonymous_user_cannot_create_sub_activity(self):
        data = {
            "round_number": self.round.number,
            "campaign": self.campaign.obr_name,
            "name": "New SubActivity",
            "start_date": "2022-02-01",
            "end_date": "2022-02-28",
            "scopes": [{"group": {"name": "New Group", "org_units": [self.org_unit.id]}, "vaccine": "mOPV2"}],
        }
        self.client.force_authenticate(self.anon)
        response = self.client.post(BASE_URL, data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_get_sub_activities(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(BASE_URL, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data["results"][0]["name"], "Test SubActivity")

    def test_update_sub_activity(self):
        data = {
            "round_number": self.round.number,
            "campaign": self.campaign.obr_name,
            "name": "Updated SubActivity",
            "start_date": "2022-03-01",
            "end_date": "2022-03-31",
            "im_started_at": "2022-04-30",
            "im_ended_at": "2022-05-01",
            "lqas_started_at": "2022-04-29",
            "lqas_ended_at": "2022-05-02",
            "scopes": [{"group": {"name": "Updated Group", "org_units": [self.org_unit.id]}, "vaccine": "mOPV2"}],
        }
        self.client.force_authenticate(self.user)
        response = self.client.put(BASE_URL + str(self.sub_activity.id) + "/", data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(SubActivity.objects.get(id=self.sub_activity.id).name, "Updated SubActivity")
        self.assertEqual(SubActivity.objects.get(id=self.sub_activity.id).im_started_at, datetime.date(2022, 4, 30))
        self.assertEqual(SubActivity.objects.get(id=self.sub_activity.id).im_ended_at, datetime.date(2022, 5, 1))
        self.assertEqual(SubActivity.objects.get(id=self.sub_activity.id).lqas_started_at, datetime.date(2022, 4, 29))
        self.assertEqual(SubActivity.objects.get(id=self.sub_activity.id).lqas_ended_at, datetime.date(2022, 5, 2))

    def test_anonymous_user_cannot_delete_sub_activity(self):
        self.client.force_authenticate(self.anon)
        response = self.client.delete(BASE_URL + str(self.sub_activity.id) + "/", format="json")
        self.assertEqual(response.status_code, 403)

    def test_delete_sub_activity(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(BASE_URL + str(self.sub_activity.id) + "/", format="json")
        self.assertEqual(response.status_code, 204)
        self.assertEqual(SubActivity.objects.count(), 0)
