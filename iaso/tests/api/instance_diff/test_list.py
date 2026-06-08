from uuid import uuid4

from django.urls import reverse
from rest_framework import status

from iaso.models import Account, DataSource, Form, OrgUnit, Project, SourceVersion
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class InstanceDiffAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.account = Account.objects.create()
        cls.john_doe = cls.create_user_with_profile(username="john_doe", account=cls.account)
        cls.john_wick = cls.create_user_with_profile(
            username="john_wick", account=cls.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.jane_doe = cls.create_user_with_profile(username="jane_doe", account=cls.account, is_superuser=True)
        cls.nobody = cls.create_user_with_profile(
            username="nobody", account=cls.account, permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_ORG_UNITS_PERMISSION]
        )

        # create instance
        sw_source = DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = SourceVersion.objects.create(data_source=sw_source, number=1)
        cls.account.default_version = sw_version
        cls.account.save()
        cls.jedi_council_corruscant_uuid = str(uuid4())

        cls.jedi_council_corruscant = OrgUnit.objects.create(
            name="Coruscant Jedi Council",
            source_ref="jedi_council_corruscant_ref",
            version=sw_version,
            validation_status="VALID",
            uuid=cls.jedi_council_corruscant_uuid,
        )
        cls.form_2 = Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )
        cls.project = Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=cls.account
        )

        cls.instance = cls.create_form_instance(
            form=cls.form_2,
            period="202001",
            org_unit=cls.jedi_council_corruscant,
            project=cls.project,
            created_by=cls.nobody,
        )

    def assertValidData(self, data, expected_length):
        self.assertValidListData(list_data=data, expected_length=expected_length, paginated=True, results_key="results")

    def test_permission(self):
        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_cannot_access_instance_outside_account(self):
        pass

    def test_num_queries(self):
        pass

    def test_list(self):
        pass
