import datetime
from django.utils.timezone import now

import hat.menupermissions.models as permissions
from iaso import models as m
from iaso.test import APITestCase
from plugins.polio import models as pm
from django.contrib.auth.models import AnonymousUser

BASE_URL = "/api/polio/vaccine/request_forms/"


class VaccineSupplyChainAPITestCase(APITestCase):
    @classmethod
    def setUp(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.another_data_source = m.DataSource.objects.create(name="Another source")

        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.another_source_version = m.SourceVersion.objects.create(data_source=cls.another_data_source, number=1)

        cls.account = m.Account.objects.create(name="polio", default_version=cls.source_version_1)

        cls.another_account = m.Account.objects.create(
            name="another_account", default_version=cls.another_source_version
        )

        cls.default_project = m.Project.objects.create(name="Default project", app_id="default", account=cls.account)
        cls.data_source.projects.set([cls.default_project])

        cls.another_project = m.Project.objects.create(
            name="Another project", app_id="another", account=cls.another_account
        )
        cls.another_data_source.projects.set([cls.another_project])

        cls.account_2 = m.Account.objects.create(name="second_account", default_version=cls.source_version_1)

        cls.anon = AnonymousUser()

        cls.user_rw_perm = cls.create_user_with_profile(
            username="user_1",
            account=cls.account,
            permissions=[permissions._POLIO_VACCINE_SUPPLY_CHAIN_READ, permissions._POLIO_VACCINE_SUPPLY_CHAIN_WRITE],
        )
        cls.user_ro_perm = cls.create_user_with_profile(
            username="user_2", account=cls.account, permissions=[permissions._POLIO_VACCINE_SUPPLY_CHAIN_READ]
        )
        cls.user_no_perms = cls.create_user_with_profile(username="user_3", account=cls.account, permissions=[])

        cls.project = m.Project.objects.create(
            name="Polio",
            app_id="polio.projects",
            account=cls.account,
        )

        cls.project_2 = m.Project.objects.create(
            name="Project_2",
            app_id="pro.jects",
            account=cls.account_2,
        )

        cls.org_unit_type_country = m.OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")

        cls.org_unit_type_country.projects.set([cls.project, cls.project_2])
        cls.org_unit_type_country.save()

        cls.org_unit_DRC = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Democratic Republic of Congo",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_CHAD = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="CHAD",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_BE = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Belgium",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.campaign_rdc_1 = pm.Campaign.objects.create(
            obr_name="RDC_CAMPAIGN_1",
            country=cls.org_unit_DRC,
            account=cls.account,
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_rdc_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
        )

        cls.campaign_rdc_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 28),
        )

        cls.campaign_rdc_1_round_3 = pm.Round.objects.create(
            campaign=cls.campaign_rdc_1,
            started_at=datetime.datetime(2021, 3, 1),
            ended_at=datetime.datetime(2021, 3, 31),
        )

        cls.vaccine_request_form_rdc_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_rdc_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        cls.vaccine_request_form_rdc_1.rounds.set([cls.campaign_rdc_1_round_1, cls.campaign_rdc_1_round_2])

        cls.vaccine_request_form_rdc_2 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_rdc_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=1),
            date_vrf_signature=cls.now,
            date_dg_approval=cls.now,
            quantities_ordered_in_doses=100,
        )
        cls.vaccine_request_form_rdc_2.rounds.set([cls.campaign_rdc_1_round_3])

        cls.campaign_chad_1 = pm.Campaign.objects.create(
            obr_name="CHAD_CAMPAIGN_1",
            country=cls.org_unit_CHAD,
            account=cls.account,
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_chad_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
        )

        cls.campaign_chad_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 28),
        )

        cls.campaign_chad_1_round_3 = pm.Round.objects.create(
            campaign=cls.campaign_chad_1,
            started_at=datetime.datetime(2021, 3, 1),
            ended_at=datetime.datetime(2021, 3, 31),
        )

        cls.vaccine_request_form_chad_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_chad_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=30),
            date_vrf_signature=cls.now - datetime.timedelta(days=20),
            date_dg_approval=cls.now - datetime.timedelta(days=10),
            quantities_ordered_in_doses=500,
        )
        cls.vaccine_request_form_chad_1.rounds.set(
            [
                cls.campaign_chad_1_round_1,
                cls.campaign_chad_1_round_2,
                cls.campaign_chad_1_round_3,
            ]
        )

        cls.campaign_be_1 = pm.Campaign.objects.create(
            obr_name="BE_CAMPAIGN_1",
            country=cls.org_unit_BE,
            account=cls.another_account,  # different account
            vacine=pm.VACCINES[0][0],
        )

        cls.campaign_be_1_round_1 = pm.Round.objects.create(
            campaign=cls.campaign_be_1,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
        )

        cls.campaign_be_1_round_2 = pm.Round.objects.create(
            campaign=cls.campaign_be_1,
            started_at=datetime.datetime(2021, 2, 1),
            ended_at=datetime.datetime(2021, 2, 28),
        )

        cls.vaccine_request_form_be_1 = pm.VaccineRequestForm.objects.create(
            campaign=cls.campaign_be_1,
            vaccine_type=pm.VACCINES[0][0],
            date_vrf_reception=cls.now - datetime.timedelta(days=1),
            date_vrf_signature=cls.now,
            date_dg_approval=cls.now,
            quantities_ordered_in_doses=1000000,
        )

    def test_anonymous_user_cannot_see_list(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_without_read_rights_cannot_see_list(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_rights_can_see_list(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        res = response.data["results"]
        self.assertEqual(len(res), 2)
        self.assertEqual(len(res[0]["rounds"]), 2)
        self.assertEqual(len(res[1]["rounds"]), 1)
        self.assertEqual(res[0]["start_date"], datetime.date(2021, 2, 1))
        self.assertEqual(res[0]["end_date"], datetime.date(2021, 2, 28))
        self.assertEqual(res[1]["start_date"], datetime.date(2021, 3, 1))
        self.assertEqual(res[1]["end_date"], datetime.date(2021, 3, 31))

    def test_user_with_read_write_rights_can_see_list(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(BASE_URL)
        self.assertEqual(response.status_code, 200)
        res = response.data["results"]
        self.assertEqual(len(res), 2)

    def test_user_without_read_rights_cannot_see_detail(self):
        self.client.force_authenticate(user=self.user_no_perms)
        response = self.client.get(BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 403)

    def test_user_with_read_rights_can_see_detail(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.get(BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 200)
        res = response.data
        self.assertEqual(res["id"], self.vaccine_request_form_rdc_1.id)
        self.assertEqual(len(res["rounds"]), 2)

    def test_user_with_read_write_rights_can_see_detail(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(BASE_URL + str(self.vaccine_request_form_rdc_1.id) + "/")
        self.assertEqual(response.status_code, 200)
        res = response.data
        self.assertEqual(res["id"], self.vaccine_request_form_rdc_1.id)
        self.assertEqual(len(res["rounds"]), 2)

    def test_user_cannot_see_from_another_account(self):
        self.client.force_authenticate(user=self.user_rw_perm)
        response = self.client.get(BASE_URL + str(self.vaccine_request_form_be_1.id) + "/")
        self.assertEqual(response.status_code, 404)

    def test_anonymou_user_cannot_post_new_request_form(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.post(
            BASE_URL,
            {
                "campaign": self.campaign_rdc_1.id,
                "vaccine_type": pm.VACCINES[0][0],
                "date_vrf_reception": self.now - datetime.timedelta(days=1),
                "date_vrf_signature": self.now,
                "date_dg_approval": self.now,
                "quantities_ordered_in_doses": 1000000,
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_user_without_write_permission_cannot_post_new_request_form(self):
        self.client.force_authenticate(user=self.user_ro_perm)
        response = self.client.post(
            BASE_URL,
            {
                "campaign": self.campaign_rdc_1.id,
                "vaccine_type": pm.VACCINES[0][0],
                "date_vrf_reception": self.now - datetime.timedelta(days=1),
                "date_vrf_signature": self.now,
                "date_dg_approval": self.now,
                "quantities_ordered_in_doses": 1000000,
            },
        )
        self.assertEqual(response.status_code, 403)

    def test_user_with_write_permission_can_post_new_request_form(self):
        self.client.force_authenticate(user=self.user_rw_perm)

        campaign_test = pm.Campaign.objects.create(
            obr_name="TEST_CAMPAIGN",
            country=self.org_unit_DRC,
            account=self.account,
            vacine=pm.VACCINES[0][0],
        )

        campaign_test_round_1 = pm.Round.objects.create(
            campaign=campaign_test,
            started_at=datetime.datetime(2021, 1, 1),
            ended_at=datetime.datetime(2021, 1, 31),
        )

        response = self.client.post(
            BASE_URL,
            {
                "campaign": self.campaign_rdc_1.id,
                "vaccine_type": pm.VACCINES[0][0],
                "date_vrf_reception": "2021-01-01",
                "date_vrf_signature": "2021-01-02",
                "date_dg_approval": "2021-01-03",
                "quantities_ordered_in_doses": 1000000,
                "rounds": [{"id": campaign_test_round_1.id}],
                "pre_alerts": [],
                "arrival_reports": [],
            },
        )
        self.assertEqual(response.status_code, 201)
        res = response.data
        self.assertEqual(res["campaign"], self.campaign_rdc_1.id)
        self.assertEqual(res["vaccine_type"], pm.VACCINES[0][0])
        self.assertEqual(res["date_vrf_reception"], datetime.date.today() - datetime.timedelta(days=1))
