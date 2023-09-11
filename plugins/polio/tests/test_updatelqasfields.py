from datetime import datetime, timedelta

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.models import Campaign, Round


class UpdateLqasFieldsTestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.url = "/api/polio/rounds/updatelqasfields/"
        cls.account = account = m.Account.objects.create(name="test account")
        cls.other_account = m.Account.objects.create(name="other account")
        cls.project = m.Project.objects.create(
            name="Polio", app_id="polio.rapid.outbreak.taskforce", account=cls.account
        )
        cls.project.save()
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.data_source.projects.add(cls.project)
        cls.data_source.save()
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version.save()
        cls.country_org_unit_1 = m.OrgUnit.objects.create(
            name="Country1",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            version=cls.source_version,
        )
        cls.country_org_unit_1.save()
        cls.country_org_unit_2 = m.OrgUnit.objects.create(
            name="Country2",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
            version=cls.source_version,
        )
        cls.country_org_unit_2.save()
        cls.user = cls.create_user_with_profile(username="test user", account=account, permissions=["iaso_polio"])
        cls.user.iaso_profile.org_units.set([cls.country_org_unit_1])
        cls.round1_start = (datetime.now() - timedelta(days=42)).date()
        cls.round1_end = (datetime.now() - timedelta(days=39)).date()
        cls.campaign = Campaign.objects.create(
            obr_name="right_campaign", account=account, initial_org_unit=cls.country_org_unit_1
        )
        cls.round1 = Round.objects.create(
            number=1,
            started_at=cls.round1_start.strftime("%Y-%m-%d"),
            ended_at=cls.round1_end.strftime("%Y-%m-%d"),
            campaign=cls.campaign,
        )
        cls.wrong_campaign = Campaign.objects.create(
            obr_name="wrong_campaign", account=cls.account, initial_org_unit=cls.country_org_unit_2
        )
        cls.wrong_round1 = Round.objects.create(
            number=1,
            started_at=cls.round1_start.strftime("%Y-%m-%d"),
            ended_at=cls.round1_end.strftime("%Y-%m-%d"),
            campaign=cls.wrong_campaign,
        )

    def test_no_perm(self):
        user_no_perm = self.create_user_with_profile(username="test user2", account=self.account, permissions=[])
        self.client.force_authenticate(user_no_perm)
        response = self.client.patch(
            self.url,
            format="json",
            data={
                "obr_name": self.campaign.obr_name,
                "number": 0,
                "lqas_district_failing": 9,
                "lqas_district_passing": 10,
            },
        )
        jr = self.assertJSONResponse(response, 403)
        self.assertEqual({"detail": "You do not have permission to perform this action."}, jr)

    def test_wrong_obr_name(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            self.url,
            format="json",
            data={"obr_name": "Bleh", "number": 0, "lqas_district_failing": 9, "lqas_district_passing": 10},
        )
        self.assertEqual(response.status_code, 404)

    def test_wrong_account(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            self.url,
            format="json",
            data={
                "obr_name": self.wrong_campaign.obr_name,
                "number": 0,
                "lqas_district_failing": 9,
                "lqas_district_passing": 10,
            },
        )
        self.assertEqual(response.status_code, 404)

    def test_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            self.url,
            format="json",
            data={
                "obr_name": self.campaign.obr_name,
                "number": 1,
                "lqas_district_failing": 9,
                "lqas_district_passing": 10,
            },
        )
        jr = self.assertJSONResponse(response, 200)
        self.assertEqual(jr["campaign"], str(self.campaign.id))
        self.assertEqual(jr["number"], 1)
        self.assertEqual(jr["lqas_district_failing"], 9)
        self.assertEqual(jr["lqas_district_passing"], 10)

    def test_unauthorized_org_unit(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch(
            self.url,
            format="json",
            data={
                "obr_name": self.wrong_campaign.obr_name,
                "number": 1,
                "lqas_district_failing": 9,
                "lqas_district_passing": 10,
            },
        )
        self.assertEqual(response.status_code, 404)
