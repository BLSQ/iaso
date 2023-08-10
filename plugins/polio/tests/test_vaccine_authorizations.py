from datetime import date

from django.contrib.auth.models import User, Permission
from django.utils.timezone import now
from rest_framework.test import APIClient

from hat.audit.models import Modification
from iaso import models as m
from iaso.models import Account, OrgUnitType, OrgUnit
from iaso.test import APITestCase
from plugins.polio.models import VaccineAuthorization


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
        cls.account_2 = Account.objects.create(name="second_account", default_version=cls.source_version_1)
        cls.user_1 = cls.create_user_with_profile(username="user_1", account=cls.account, permissions=["iaso_polio_vaccine_authorizations_admin"])
        cls.user_2 = cls.create_user_with_profile(username="user_2", account=cls.account, permissions=["iaso_polio_vaccine_authorizations_read_only"])

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

        cls.org_unit_type_country = OrgUnitType.objects.create(
            name="COUNTRY",
            category="COUNTRY")

        cls.org_unit_type_country.projects.set([cls.project, cls.project_2])
        cls.org_unit_type_country.save()

        cls.org_unit_DRC = m.OrgUnit.objects.create(
            org_unit_type=cls.org_unit_type_country,
            version=cls.source_version_1,
            name="Democratic Republic of Congo",
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

        cls.user_1.iaso_profile.org_units.set([cls.org_unit_DRC, cls.org_unit_SOMALIA, cls.org_unit_ALGERIA])

    def setUp(self):
        self.client = APIClient()

    def test_can_post_and_access_list(self):

        self.client.force_authenticate(self.user_1)


        response = self.client.post("/api/polio/vaccineauthorizations/",
                         data={
                             "country": self.org_unit_DRC.pk,
                             "account": self.account.pk,
                             "quantity": 12346,
                             "status": "ongoing",
                             "comment": "waiting for approval.",
                             "expiration_date": "2024-02-01"
                         })

        self.assertEqual(response.status_code, 201)

        response = self.client.get("/api/polio/vaccineauthorizations/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_cant_access_authorization_not_in_same_account(self):
        self.client.force_authenticate(self.user_2)



