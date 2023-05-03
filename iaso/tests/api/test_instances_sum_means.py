from unittest import mock
from uuid import uuid4

from django.core.files import File
from django.core.files.uploadedfile import UploadedFile
from django.contrib.auth.models import AnonymousUser

from iaso import models as m
from iaso.test import APITestCase


class InstancesSumMeansAPITestCase(APITestCase):
    def setUpTestData(cls):
        cls.default_account = m.Account.objects.create(name="Default Account")

        cls.default_source = m.DataSource.objects.create(name="Default Source")

        cls.default_version = m.SourceVersion.objects.create(data_source=cls.default_source, number=1)

        cls.default_account.default_version = cls.default_version
        cls.default_account.save()

        cls.anon_user = AnonymousUser()

        cls.user_with_perms = cls.create_user_with_profile(
            username="user_with_perms", account=cls.default_account, permissions=["iaso_submissions"]
        )

        cls.user_without_perms = cls.create_user_with_profile(
            username="user_without_perms", account=cls.default_account
        )

        cls.default_project = m.Project.objects.create(name="Default Project", account=cls.default_account)

        cls.default_account.projects.add(cls.default_project)

        cls.parent_ou_type = m.OrgUnitType.objects.create(name="Parent OU", short_name="PRT")
        cls.child_ou_type = m.OrgUnitType.objects.create(name="Child OU", short_name="CHD")
        cls.grand_child_ou_type = m.OrgUnitType.objects.create(name="Grand Child OU", short_name="GCD")

        cls.ou_parent = m.OrgUnit.objects.create(
            name="ou_top_1",
            source_ref="ou_top_1_ref",
            version=cls.default_version,
            org_unit_type=cls.parent_ou_type,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.ou_child_1 = m.OrgUnit.objects.create(
            name="ou_child_1",
            source_ref="ou_child_1_ref",
            version=cls.default_version,
            org_unit_type=cls.child_ou_type,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            parent=cls.ou_parent,
        )

        cls.ou_child_2 = m.OrgUnit.objects.create(
            name="ou_child_2",
            source_ref="ou_child_2_ref",
            version=cls.default_version,
            org_unit_type=cls.child_ou_type,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            parent=cls.ou_parent,
        )

        cls.ou_child_3 = m.OrgUnit.objects.create(
            name="ou_child_3",
            source_ref="ou_child_3_ref",
            version=cls.default_version,
            org_unit_type=cls.child_ou_type,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            parent=cls.ou_parent,
        )

        cls.ou_grand_child_1 = m.OrgUnit.objects.create(
            name="ou_grand_child_1",
            source_ref="ou_grand_child_1_ref",
            version=cls.default_version,
            org_unit_type=cls.grand_child_ou_type,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            parent=cls.ou_child_1,
        )

        cls.the_form = m.Form.objects.create(
            name="The Form",
            period_type=m.MONTH,
            single_per_period=True,
            summable_fields=["Children Count"],
            averageable_fields=["Age", "Height"],
        )

        default_form_file_mock = mock.MagicMock(spec=File)
        default_form_file_mock.name = "test.xml"
        with open("iaso/tests/fixtures/test_form_sum_avg.xlsx", "rb") as xls_file:
            cls.default_form.form_versions.create(
                file=default_form_file_mock, xls_file=UploadedFile(xls_file), version_id="123456"
            )

        cls.default_form.update_possible_fields()
        cls.default_form.save()

        cls.ou_child_1_instance = cls.create_form_instance(
            form=cls.default_form,
            period="202304",
            org_unit=cls.ou_child_1,
            project=cls.default_project,
            uuid=uuid4,
            json={"Prenom": "Ou Child 1", "Nom": "Some Name", "Age": 20, "Children Count": 0, "Height": 170},
        )

        cls.ou_child_2_instance = cls.create_form_instance(
            form=cls.default_form,
            period="202304",
            org_unit=cls.ou_child_2,
            project=cls.default_project,
            uuid=uuid4,
            json={"Prenom": "Ou Child 2", "Nom": "Some Name", "Age": 30, "Children Count": 4, "Height": 180},
        )

        cls.ou_child_3_instance = cls.create_form_instance(
            form=cls.default_form,
            period="202304",
            org_unit=cls.ou_child_3,
            project=cls.default_project,
            uuid=uuid4,
            json={"Prenom": "Ou Child 3", "Nom": "Some Name", "Age": 40, "Children Count": 2, "Height": 190},
        )

        cls.ou_grand_child_1_instance = cls.create_form_instance(
            form=cls.default_form,
            period="202304",
            org_unit=cls.ou_grand_child_1,
            project=cls.default_project,
            uuid=uuid4,
            json={"Prenom": "Ou Grand Child 1", "Nom": "Some Name", "Age": 50, "Children Count": 1, "Height": 155},
        )

        cls.ou_child_1_instance_no_data = cls.create_form_instance(
            form=cls.default_form,
            period="202304",
            org_unit=cls.ou_child_1,
            project=cls.default_project,
            uuid=uuid4,
            json={"Prenom": "Ou Child 1", "Nom": "Some Name"},
        )

        cls.average_age = 20 + 30 + 40 + 50 / 4
        cls.sum_children = 0 + 4 + 2 + 1
        cls.average_height = 170 + 180 + 190 + 155 / 4

        def test_anon_user_doesnt_work(self):
            self.client.force_authenticate(user=self.anon_user)
            response = self.client.get(self.url)
            self.assertEqual(response.status_code, 401)
