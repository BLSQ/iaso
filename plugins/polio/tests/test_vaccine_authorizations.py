import datetime
from datetime import date

from django.contrib.auth.models import User
from django.core import mail
from django.utils.timezone import now
from rest_framework.test import APIClient

from beanstalk_worker.services import TestTaskService
from hat import settings
from iaso import models as m
from iaso.models import Account, Group, OrgUnitType, Team
from iaso.test import APITestCase
from plugins.polio.models import VaccineAuthorization
from plugins.polio.tasks.vaccine_authorizations_mail_alerts import (
    expired_vaccine_authorizations_email_alert,
    vaccine_authorization_update_expired_entries,
    send_email_vaccine_authorizations_60_days_expiration_alert,
    send_email_expired_vaccine_authorizations_alert,
    vaccine_authorizations_60_days_expiration_email_alert,
)


class VaccineAuthorizationAPITestCase(APITestCase):
    data_source: m.DataSource
    source_version_1: m.SourceVersion
    account: Account

    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.now = now()

        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = Account.objects.create(name="polio", default_version=cls.source_version_1)
        cls.default_project = m.Project.objects.create(name="Default project", app_id="default", account=cls.account)
        cls.data_source.projects.set([cls.default_project])

        cls.account_2 = Account.objects.create(name="second_account", default_version=cls.source_version_1)
        cls.user_1 = cls.create_user_with_profile(
            username="user_1",
            account=cls.account,
            permissions=["iaso_polio_vaccine_authorizations_admin", "iaso_polio_vaccine_authorizations_read_only"],
            email="XlfeeekfdpppZ@somemailzz.io",
        )
        cls.user_2 = cls.create_user_with_profile(
            username="user_2", account=cls.account, permissions=["iaso_polio_vaccine_authorizations_read_only"]
        )
        cls.user_3 = cls.create_user_with_profile(username="user_3", account=cls.account, permissions=["iaso_forms"])

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

        cls.team = Team.objects.create(
            name="nOPV2 vaccine authorization alerts", project=cls.project, manager=cls.user_1
        )

        cls.org_unit_type_country = OrgUnitType.objects.create(name="COUNTRY", category="COUNTRY")

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

        cls.org_unit_BURKINA_FASO = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Burkina Faso",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_ZIMBABWE = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Zimbabwe",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_SIERRA_LEONE = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Sierra Leone",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_ALGERIA = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="ALGERIA",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

        cls.org_unit_SOMALIA = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="SOMALIA",
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )

    def setUp(self):
        self.client = APIClient()

    def test_user_can_post(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        response = self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ONGOING",
                "comment": "waiting for approval.",
                "start_date": datetime.date(2224, 2, 1),
                "expiration_date": datetime.date(2225, 2, 1),
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["country"]["name"], "Democratic Republic of Congo")
        self.assertEqual(response.data["expiration_date"], "2225-02-01"),
        self.assertEqual(response.data["start_date"], "2224-02-01"),
        self.assertEqual(response.data["status"], "ONGOING")
        self.assertEqual(response.data["comment"], "waiting for approval.")
        self.assertEqual(response.data["quantity"], 12346)

    def test_expiration_date_is_required(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        response = self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ONGOING",
                "comment": "waiting for approval.",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["expiration_date"][0], "This field is required.")

    def test_get_vacc_auth_by_id(self):
        self.client.force_authenticate(self.user_1)

        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        vaccine_auth = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            quantity=123456,
            status="ongoing",
            comment="waiting for approval",
            expiration_date="2224-02-01",
        )

        response = self.client.get(f"/api/polio/vaccineauthorizations/{vaccine_auth.id}/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["country"]["id"], self.org_unit_DRC.id)
        self.assertEqual(response.data["country"]["name"], "Democratic Republic of Congo")
        self.assertEqual(response.data["quantity"], 123456)
        self.assertEqual(response.data["status"], "ongoing")
        self.assertEqual(response.data["comment"], "waiting for approval")

    def test_can_access_list(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        VaccineAuthorization.objects.create(
            country=self.org_unit_DRC,
            account=self.user_1.iaso_profile.account,
            quantity=1000000,
            status="signature",
            comment="validated",
            expiration_date="2224-02-01",
        )

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_without_perm_cant_read(self):
        self.client.force_authenticate(self.user_3)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.id])

        VaccineAuthorization.objects.create(
            country=self.org_unit_DRC,
            account=self.user_1.iaso_profile.account,
            quantity=1000000,
            status="signature",
            comment="validated",
            expiration_date="2224-02-01",
        )

        response = self.client.get("/api/polio/vaccineauthorizations/")
        self.assertEqual(response.status_code, 403)

    def test_user_need_admin_perm_for_write_operations(self):
        self.client.force_authenticate(self.user_2)

        response = self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ongoing",
                "comment": "waiting for approval.",
                "expiration_date": "2224-02-01",
            },
        )

        self.assertEqual(403, response.status_code)

    def test_user_without_read_only_cant_access_api(self):
        self.client.force_authenticate(self.user_3)

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.status_code, 403)

    def test_get_most_recent_authorizations(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk])

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "EXPIRED",
                "comment": "waiting for approval.",
                "expiration_date": "2224-02-01",
                "start_date": "2223-02-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "VALIDATED",
                "comment": "validated auth",
                "expiration_date": "2224-03-01",
                "start_date": "2224-02-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ONGOING",
                "comment": "next validation date",
                "expiration_date": "2024-04-01",
                "start_date": "2224-02-01",
            },
        )

        response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["comment"], "validated auth")
        self.assertEqual(response.data[0]["status"], "VALIDATED")
        self.assertEqual(response.data[0]["current_expiration_date"], datetime.date(2224, 3, 1))
        self.assertEqual(response.data[0]["next_expiration_date"], None)
        self.assertEqual(response.data[0]["start_date"], datetime.date(2224, 2, 1))

    def test_filters(self):
        self.client.force_authenticate(self.user_1)

        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk, self.org_unit_ALGERIA, self.org_unit_SOMALIA])

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ONGOING",
                "comment": "waiting for approval.",
                "expiration_date": "2224-02-01",
                "start_date": "2224-01-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ONGOING",
                "comment": "new update",
                "expiration_date": "2224-02-01",
                "start_date": "2224-01-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_ALGERIA.pk,
                "quantity": 12346,
                "status": "VALIDATED",
                "comment": "Approved.",
                "expiration_date": "2224-02-01",
                "start_date": "2224-01-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_SOMALIA.pk,
                "quantity": 12346,
                "status": "VALIDATED",
                "comment": "Approved.",
                "expiration_date": "2224-02-01",
                "start_date": "2224-01-01",
            },
        )

        # search by partial name

        response = self.client.get("/api/polio/vaccineauthorizations/?search=congo")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

        # retrieve by status
        response = self.client.get("/api/polio/vaccineauthorizations/?auth_status=VALIDATED")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

        # retrieve only non deleted entries

        self.client.delete(f"/api/polio/vaccineauthorizations/{VaccineAuthorization.objects.last().pk}/")

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)

        # retrieve only deleted

        response = self.client.get("/api/polio/vaccineauthorizations/?deletion_status=deleted")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

        # all

        response = self.client.get("/api/polio/vaccineauthorizations/?deletion_status=all")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 4)

        # only actives

        response = self.client.get("/api/polio/vaccineauthorizations/?deletion_status=active")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 3)

    def test_block_countries(self):
        self.client.force_authenticate(self.user_1)

        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk, self.org_unit_ALGERIA, self.org_unit_SOMALIA])

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ONGOING",
                "comment": "waiting for approval.",
                "expiration_date": "2024-02-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_ALGERIA.pk,
                "quantity": 12346,
                "status": "ONGOING",
                "comment": "new update",
                "expiration_date": "2024-03-01",
            },
        )

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_SOMALIA.pk,
                "quantity": 12346,
                "status": "VALIDATED",
                "comment": "Approved.",
                "expiration_date": "2024-04-01",
            },
        )

        group = Group.objects.create(
            name="Sub-Saharian-Countries",
        )

        group.org_units.set([self.org_unit_DRC.pk, self.org_unit_SOMALIA.pk])

        response = self.client.get(f"/api/polio/vaccineauthorizations/?block_country={group.pk}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 2)

    def test_get_recent_without_expired_or_validated_data_must_return_ongoing_or_signature(self):
        def test_get_most_recent_authorizations(self):
            self.client.force_authenticate(self.user_1)
            self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk])

            self.client.post(
                "/api/polio/vaccineauthorizations/",
                data={
                    "country": self.org_unit_DRC.pk,
                    "quantity": 12346,
                    "status": "ONGOING",
                    "comment": "waiting for approval.",
                    "expiration_date": "2024-02-01",
                },
            )

            response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/")

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data[0]["comment"], "waiting for approval.")
            self.assertEqual(response.data[0]["status"], "ongoing")
            self.assertEqual(response.data[0]["current_expiration_date"], None)
            self.assertEqual(response.data[0]["next_expiration_date"], datetime.date(2024, 2, 1))

    def test_can_edit_authorizations(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk])

        self.client.post(
            "/api/polio/vaccineauthorizations/",
            data={
                "country": self.org_unit_DRC.pk,
                "quantity": 12346,
                "status": "ONGOING",
                "comment": "waiting for approval.",
                "expiration_date": "2024-02-01",
            },
        )

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.data[0]["comment"], "waiting for approval.")

        last_entry = VaccineAuthorization.objects.last()

        data = {
            "country": self.org_unit_DRC.pk,
            "comment": "Approved",
            "status": "VALIDATED",
            "expiration_date": last_entry.expiration_date,
        }

        post_rep = self.client.put(f"/api/polio/vaccineauthorizations/{last_entry.pk}/", data=data)

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.data[0]["comment"], "Approved")
        self.assertEqual(response.data[0]["status"], "VALIDATED")

    def test_vaccine_authorizations_60_days_expiration_email_alert(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk])

        self.team.users.set([self.user_1])

        sixty_days_date = datetime.date.today() + datetime.timedelta(days=60)
        vaccine_auths = VaccineAuthorization.objects.filter(expiration_date=sixty_days_date)

        mailing_list = [user.email for user in User.objects.filter(pk__in=self.team.users.all())]

        sixty_days_expiration_auth = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="VALIDATED",
            quantity=1000000,
            comment="Validated for 1M",
            expiration_date=sixty_days_date,
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="ONGOING",
            quantity=1000000,
            comment="Validated for 1M",
            expiration_date=datetime.date.today() + datetime.timedelta(days=100),
        )

        from_email = settings.DEFAULT_FROM_EMAIL

        # test the function itself to check if the content is correct

        response = vaccine_authorizations_60_days_expiration_email_alert(vaccine_auths, mailing_list)

        self.assertEqual(response, {"vacc_auth_mail_sent_to": ["XlfeeekfdpppZ@somemailzz.io"]})

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(
            mail.outbox[0].subject,
            f"ALERT: Vaccine Authorization {sixty_days_expiration_auth} arrives to expiration date in 2 months",
        )
        self.assertEqual(mail.outbox[0].from_email, from_email)
        self.assertEqual(mail.outbox[0].to, ["XlfeeekfdpppZ@somemailzz.io"])

        # test the task

        task = send_email_vaccine_authorizations_60_days_expiration_alert(user=self.user_1)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS")

    def test_expired_vaccine_authorizations_email_alert(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk])

        self.team.users.set([self.user_1])

        past_date = datetime.date.today() - datetime.timedelta(days=1)

        vaccine_auths = VaccineAuthorization.objects.filter(expiration_date=past_date)
        mailing_list = [user.email for user in User.objects.filter(pk__in=self.team.users.all())]

        past_vacc_auth = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="VALIDATED",
            quantity=1000000,
            comment="Validated for 1M",
            expiration_date=past_date,
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="ONGOING",
            quantity=1000000,
            comment="Validated for 1M",
            expiration_date=datetime.date.today() + datetime.timedelta(days=100),
        )

        from_email = settings.DEFAULT_FROM_EMAIL

        # test the function itself to check if the content is correct

        response = expired_vaccine_authorizations_email_alert(vaccine_auths, mailing_list)

        page_url = f"example.com/dashboard/polio/vaccinemodule/nopv2authorisation/accountId/{self.team.project.account.id}/order/-current_expiration_date/pageSize/20/page/1"
        url_is_correct = False

        if page_url in mail.outbox[0].body:
            url_is_correct = True

        self.assertEqual(response, {"vacc_auth_mail_sent_to": ["XlfeeekfdpppZ@somemailzz.io"]})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, f"ALERT: Vaccine Authorization {past_vacc_auth} has expired.")
        self.assertEqual(mail.outbox[0].from_email, from_email)
        self.assertEqual(mail.outbox[0].to, ["XlfeeekfdpppZ@somemailzz.io"])
        self.assertEqual(url_is_correct, True)

        # test the Task

        task = send_email_expired_vaccine_authorizations_alert(user=self.user_1)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        self.assertEqual(task.status, "SUCCESS")

    def test_vaccine_authorization_update_expired_entries(self):
        expired_entry = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="VALIDATED",
            quantity=5000000,
            expiration_date=date.today() - datetime.timedelta(days=1),
            start_date=date.today() - datetime.timedelta(days=20),
        )

        valid_entry = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="VALIDATED",
            quantity=5000000,
            expiration_date=date.today(),
        )

        expired_entry_second = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="VALIDATED",
            quantity=5000000,
            expiration_date=date.today() - datetime.timedelta(days=200),
            start_date=date.today() - datetime.timedelta(days=250),
        )

        expired_entry_third = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="VALIDATED",
            quantity=5000000,
            expiration_date=date.today() - datetime.timedelta(days=300),
            start_date=date.today() - datetime.timedelta(days=350),
        )

        task = vaccine_authorization_update_expired_entries(user=self.user_1)

        self.assertEqual(task.status, "QUEUED")
        task_service = TestTaskService()
        task_service.run_all()
        task.refresh_from_db()
        expired_entry_second.refresh_from_db()
        expired_entry.refresh_from_db()
        expired_entry_third.refresh_from_db()
        valid_entry.refresh_from_db()
        print(task.status)
        print(task.progress_message)
        print(task.result)
        self.assertEqual(task.status, "SUCCESS")

        self.assertEqual(expired_entry_second.status, "EXPIRED")
        self.assertEqual(expired_entry.status, "EXPIRED")
        self.assertEqual(expired_entry_third.status, "EXPIRED")
        self.assertEqual(valid_entry.status, "VALIDATED")
        self.assertEqual(task.progress_message, "3 expired nOPV2 vaccine authorization.")

    def test_order_get_recent_vacc(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set([self.org_unit_DRC.pk, self.org_unit_SOMALIA, self.org_unit_ALGERIA])

        first = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="VALIDATED",
            quantity=100,
            expiration_date=date.today(),
        )

        second = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="EXPIRED",
            quantity=200,
            expiration_date=date.today() + datetime.timedelta(days=10),
        )

        third = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_ALGERIA,
            status="VALIDATED",
            quantity=300,
            expiration_date=date.today() + datetime.timedelta(days=20),
        )

        fourth = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_SOMALIA,
            status="VALIDATED",
            quantity=400,
            expiration_date=date.today() + datetime.timedelta(days=30),
        )

        """
        ORDER BY COUNTRY
        """
        # Ascendant

        response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=country/")

        self.assertEqual(response.data[0]["country"]["name"], third.country.name)
        self.assertEqual(response.data[1]["country"]["name"], second.country.name)
        self.assertEqual(response.data[2]["country"]["name"], fourth.country.name)

        # Descendant

        response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=-country/")

        self.assertEqual(response.data[0]["country"]["name"], fourth.country.name)
        self.assertEqual(response.data[1]["country"]["name"], second.country.name)
        self.assertEqual(response.data[2]["country"]["name"], third.country.name)

        """
        ORDER BY current_expiration_date
        """

        # Ascendant

        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=current_expiration_date/"
        )

        self.assertEqual(response.data[0]["current_expiration_date"], second.expiration_date)
        self.assertEqual(response.data[1]["current_expiration_date"], third.expiration_date)
        self.assertEqual(response.data[2]["current_expiration_date"], fourth.expiration_date)

        # Descendant

        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=-current_expiration_date"
        )

        self.assertEqual(response.data[0]["current_expiration_date"], fourth.expiration_date)
        self.assertEqual(response.data[1]["current_expiration_date"], third.expiration_date)
        self.assertEqual(response.data[2]["current_expiration_date"], second.expiration_date)

        """
        ORDER BY status
        """

        # Ascendant

        response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=status/")

        self.assertEqual(response.data[0]["status"], second.status)
        self.assertEqual(response.data[1]["status"], third.status)
        self.assertEqual(response.data[2]["status"], fourth.status)

        # Descendant

        response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=-status")

        self.assertEqual(response.data[0]["status"], fourth.status)
        self.assertEqual(response.data[1]["status"], third.status)
        self.assertEqual(response.data[2]["status"], second.status)

        """
        ORDER BY Quantity
        """

        # Ascendant

        response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=quantity/")

        self.assertEqual(response.data[0]["status"], second.status)
        self.assertEqual(response.data[1]["status"], third.status)
        self.assertEqual(response.data[2]["status"], fourth.status)

        # Descendant

        response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=-quantity")

        self.assertEqual(response.data[0]["status"], fourth.status)
        self.assertEqual(response.data[1]["status"], third.status)
        self.assertEqual(response.data[2]["status"], second.status)

        """
                ORDER BY next_expiration_date
        """

        fifth = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="ONGOING",
            quantity=200,
            expiration_date=date.today() + datetime.timedelta(days=100),
        )

        sixth = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_ALGERIA,
            status="ONGOING",
            quantity=300,
            expiration_date=date.today() + datetime.timedelta(days=200),
        )

        seventh = VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_SOMALIA,
            status="ONGOING",
            quantity=400,
            expiration_date=date.today() + datetime.timedelta(days=300),
        )

        # Ascendant

        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=next_expiration_date/"
        )

        self.assertEqual(response.data[0]["next_expiration_date"], fifth.expiration_date)
        self.assertEqual(response.data[1]["next_expiration_date"], sixth.expiration_date)
        self.assertEqual(response.data[2]["next_expiration_date"], seventh.expiration_date)

        # Descendant

        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=-next_expiration_date"
        )

        self.assertEqual(response.data[0]["next_expiration_date"], seventh.expiration_date)
        self.assertEqual(response.data[1]["next_expiration_date"], sixth.expiration_date)
        self.assertEqual(response.data[2]["next_expiration_date"], fifth.expiration_date)

    def test_get_most_recent_filters_status(self):
        self.client.force_authenticate(self.user_1)
        self.user_1.iaso_profile.org_units.set(
            [
                self.org_unit_DRC.pk,
                self.org_unit_SOMALIA,
                self.org_unit_ALGERIA,
                self.org_unit_ZIMBABWE,
                self.org_unit_CHAD,
                self.org_unit_SIERRA_LEONE,
                self.org_unit_BURKINA_FASO,
            ]
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_SOMALIA,
            status="EXPIRED",
            quantity=400,
            expiration_date=date.today() - datetime.timedelta(days=30),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_SOMALIA,
            status="VALIDATED",
            quantity=400,
            expiration_date=date.today() + datetime.timedelta(days=220),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_DRC,
            status="EXPIRED",
            quantity=40000,
            expiration_date=date.today() - datetime.timedelta(days=220),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_ALGERIA,
            status="SIGNATURE",
            quantity=40000,
            expiration_date=date.today() + datetime.timedelta(days=120),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_CHAD,
            status="EXPIRED",
            quantity=40000,
            expiration_date=date.today() - datetime.timedelta(days=1),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_SIERRA_LEONE,
            status="SIGNATURE",
            quantity=40000,
            expiration_date=date.today() + datetime.timedelta(days=250),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_ZIMBABWE,
            status="ONGOING",
            quantity=40000,
            expiration_date=date.today() + datetime.timedelta(days=250),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_ZIMBABWE,
            status="EXPIRED",
            quantity=40000,
            expiration_date=date.today() - datetime.timedelta(days=250),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_ZIMBABWE,
            status="SIGNATURE",
            quantity=40000,
            expiration_date=date.today() + datetime.timedelta(days=250),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_BURKINA_FASO,
            status="EXPIRED",
            quantity=40000,
            expiration_date=date.today() - datetime.timedelta(days=250),
        )

        VaccineAuthorization.objects.create(
            account=self.user_1.iaso_profile.account,
            country=self.org_unit_BURKINA_FASO,
            status="VALIDATED",
            quantity=40000,
            expiration_date=date.today() + datetime.timedelta(days=100),
        )

        # response length
        response = self.client.get("/api/polio/vaccineauthorizations/get_most_recent_authorizations/?order=status")

        self.assertEqual((len(response.data)), 7)

        # VALIDATED status
        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?auth_status=VALIDATED"
        )

        self.assertEqual(len(response.data), 2)

        # ONGOING status
        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?auth_status=ONGOING"
        )

        self.assertEqual(len(response.data), 0)

        # EXPIRED status
        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?auth_status=EXPIRED"
        )

        self.assertEqual(len(response.data), 2)

        # SIGNATURE status
        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?auth_status=SIGNATURE"
        )

        self.assertEqual(len(response.data), 3)

        # SIGNATURE and EXPIRED status
        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?auth_status=SIGNATURE,EXPIRED"
        )

        self.assertEqual(len(response.data), 5)

        # SIGNATURE and ONGOING status
        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?auth_status=SIGNATURE,ONGOING"
        )

        self.assertEqual(len(response.data), 3)

        # SIGNATURE and VALIDATED status
        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?auth_status=SIGNATURE,VALIDATED"
        )

        self.assertEqual(len(response.data), 5)

        # SIGNATURE, VALIDATED, EXPIRED status
        response = self.client.get(
            "/api/polio/vaccineauthorizations/get_most_recent_authorizations/?auth_status=SIGNATURE,EXPIRED,VALIDATED"
        )

        self.assertEqual(len(response.data), 7)
