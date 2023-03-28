from uuid import uuid4

from iaso import models as m
from iaso.test import APITestCase


class EntitiesDuplicationAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        default_account = m.Account.objects.create(name="Default account")

        cls.default_account = default_account

        default_ds = m.DataSource.objects.create(name="Default Data Source")
        cls.default_ds = default_ds
        default_sv = m.SourceVersion.objects.create(data_source=default_ds, number=1)
        default_account.default_version = default_sv
        default_account.save()

        cls.default_orgunit_type = m.OrgUnitType.objects.create(
            name="Default Org Unit Type", short_name="default_ou_type"
        )

        cls.default_orgunit = m.OrgUnit.objects.create(
            name="Default Org Unit", source_ref="default_test_orgunit_ref", version=default_sv
        )

        cls.another_orgunit = m.OrgUnit.objects.create(
            name="Another Org Unit", source_ref="another_test_orgunit_ref", version=default_sv
        )

        cls.default_sv = default_sv

        cls.default_project = m.Project.objects.create(
            name="Default Project", app_id="default.test.project", account=default_account
        )

        cls.user_without_ou = cls.create_user_with_profile(
            username="user_without_ou", account=default_account, permissions=["iaso_submissions"]
        )

        cls.default_form = m.Form.objects.create(name="Default Dorm", period_type=m.MONTH, single_per_period=True)

        first_instance_1 = cls.create_form_instance(
            form=cls.default_form,
            period="202001",
            org_unit=cls.default_orgunit,
            project=cls.default_project,
            uuid=uuid4,
        )

        first_instance_1.json = {"name": "first_instance", "last_name": "iaso"}
        first_instance_1.save()

        first_instance_2 = cls.create_form_instance(
            form=cls.default_form,
            period="202001",
            org_unit=cls.default_orgunit,
            project=cls.default_project,
            uuid=uuid4,
        )

        first_instance_2.json = {"name": "first_instance", "last_name": "iaso"}
        first_instance_2.save()

        first_instance_in_other_ou = cls.create_form_instance(
            form=cls.default_form,
            period="202001",
            org_unit=cls.another_orgunit,
            project=cls.default_project,
            uuid=uuid4,
        )

        first_instance_in_other_ou.json = {"name": "first_instance", "last_name": "iaso"}

        far_instance = cls.create_form_instance(
            form=cls.default_form,
            period="202001",
            org_unit=cls.default_orgunit,
            project=cls.default_project,
            uuid=uuid4,
        )

        far_instance.json = {"name": "Far. Inst.", "last_name": "Yeeeeeaaaahhhhhhhhhhh"}
        far_instance.save()

        cls.first_instance_1 = first_instance_1
        cls.first_instance_2 = first_instance_2
        cls.first_instance_in_other_ou = first_instance_in_other_ou
        cls.far_instance = far_instance

    def test_it_works(self):
        self.client.force_authenticate(user=self.user_without_ou)
