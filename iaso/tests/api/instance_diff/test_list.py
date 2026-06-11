from copy import copy
from uuid import uuid4

from django.urls import reverse
from rest_framework import status

from hat.audit.models import log_modification, serialize_instance
from iaso.models import Account, DataSource, Form, OrgUnit, Project, SourceVersion
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class InstanceDiffAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.account = Account.objects.create(name="account")
        cls.other_account = Account.objects.create(name="other_account")
        cls.john_doe = cls.create_user_with_profile(username="john_doe", account=cls.account)
        cls.john_wick = cls.create_user_with_profile(
            username="john_wick", account=cls.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.jane_doe = cls.create_user_with_profile(username="jane_doe", account=cls.account, is_superuser=True)
        cls.nobody = cls.create_user_with_profile(
            username="nobody", account=cls.account, permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_ORG_UNITS_PERMISSION]
        )
        cls.nobody_2 = cls.create_user_with_profile(
            username="nobody2",
            account=cls.other_account,
            permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_ORG_UNITS_PERMISSION],
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

        # create instance other account
        sw_source_2 = DataSource.objects.create(name="Galactic Empire 2")
        cls.sw_source_2 = sw_source_2
        sw_version_2 = SourceVersion.objects.create(data_source=sw_source_2, number=1)
        cls.other_account.default_version = sw_version_2
        cls.other_account.save()
        cls.jedi_council_corruscant_uuid_2 = str(uuid4())

        cls.jedi_council_corruscant_2 = OrgUnit.objects.create(
            name="Coruscant Jedi Council",
            source_ref="jedi_council_corruscant_ref",
            version=sw_version,
            validation_status="VALID",
            uuid=cls.jedi_council_corruscant_uuid_2,
        )
        cls.form_3 = Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )
        cls.project_2 = Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics2", account=cls.other_account
        )

        cls.instance_2 = cls.create_form_instance(
            form=cls.form_3,
            period="202001",
            org_unit=cls.jedi_council_corruscant_2,
            project=cls.project_2,
            created_by=cls.nobody_2,
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
        self.client.force_authenticate(self.jane_doe)
        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance_2.id}))
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

        original = serialize_instance(self.instance)

        log_modification(original, self.instance, source=self.sw_source.name, user=self.john_wick)

        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual(res_data["results"][0]["diff"], [])

        updated = copy(original)
        updated[0]["fields"]["file"] = "new.xml"
        del updated[0]["fields"]["general_validation_status"]
        updated[0]["fields"]["new_field"] = "VALID"

        log_modification(updated, self.instance, source=self.sw_source.name, user=self.john_wick)

        with self.assertNumQueries(4):
            # 1-2: CHECK INSTANCE PERM
            # 3: SELECT COUNT
            # 4: SELECT data
            res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

    def test_list(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

        original = serialize_instance(self.instance)

        log_modification(original, self.instance, source=self.sw_source.name, user=self.john_wick)

        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)
        self.assertEqual(res_data["results"][0]["diff"], [])

        updated = copy(original)
        updated[0]["fields"]["file"] = "new.xml"
        del updated[0]["fields"]["general_validation_status"]
        updated[0]["fields"]["new_field"] = "VALID"

        value = updated[0]["fields"]["created_by"]
        del updated[0]["fields"]["created_by"]
        updated[0]["fields"]["new_field_created_by"] = value

        log_modification(updated, self.instance, source=self.sw_source.name, user=self.john_wick)

        res = self.client.get(reverse("instances_diff-list", kwargs={"instance_id": self.instance.id}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        self.assertCountEqual(
            res_data["results"][0]["diff"],
            [
                {"op": "remove", "path": "/new_field"},
                {"op": "add", "path": "/general_validation_status", "value": ""},
                {"op": "replace", "path": "/file", "value": self.instance.file.name},
                {"op": "move", "from": "/new_field_created_by", "path": "/created_by"},
            ],
        )
