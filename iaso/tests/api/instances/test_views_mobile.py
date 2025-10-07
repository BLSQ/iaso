from uuid import uuid4

from iaso import models as m
from iaso.api.query_params import IMAGE_ONLY
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


class InstancesMobileAPITestCase(TaskAPITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = m.Account.objects.create(name="Account")
        cls.data_source = data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = source_version = m.SourceVersion.objects.create(data_source=data_source, number=1)

        account.default_version = source_version
        account.save()

        cls.user = cls.create_user_with_profile(
            username="john_doe",
            last_name="Doe",
            first_name="John",
            account=account,
            permissions=[CORE_SUBMISSIONS_PERMISSION, CORE_ORG_UNITS_PERMISSION],
        )

        cls.org_unit_type = m.OrgUnitType.objects.create(name="Org Unit Type", short_name="Cnc")

        cls.org_unit = m.OrgUnit.objects.create(
            name="Org Unit",
            source_ref="org_unit_ref",
            version=source_version,
            validation_status="VALID",
            uuid=str(uuid4()),
        )

        cls.project = m.Project.objects.create(name="Project", app_id="project.id", account=account)

        data_source.projects.add(cls.project)

        cls.form = m.Form.objects.create(name="Form", period_type=m.MONTH, single_per_period=True)

        cls.instance_1 = cls.create_form_instance(
            uuid=str(uuid4()),
            form=cls.form,
            period="202001",
            org_unit=cls.org_unit,
            project=cls.project,
            created_by=cls.user,
            export_id="Vzhn0nceudr",
        )
        cls.instance_2 = cls.create_form_instance(
            form=cls.form,
            period="202002",
            org_unit=cls.org_unit,
            project=cls.project,
            created_by=cls.user,
        )

        cls.project.unit_types.add(cls.org_unit_type)
        cls.project.forms.add(cls.form)
        data_source.projects.add(cls.project)
        cls.project.save()

    def test_attachments_permission_denied_when_anonymous(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        instance = self.form.instances.first()
        response = self.client.get(f"/api/mobile/instances/{instance.pk}/attachments/")
        self.assertJSONResponse(response, 401)

    def test_get_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.user)
        instance = self.form.instances.first()
        response = self.client.get(f"/api/mobile/instances/{instance.pk}/")
        self.assertJSONResponse(response, 403)

    def test_list_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/mobile/instances/")
        self.assertJSONResponse(response, 403)

    def test_delete_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.user)
        instance = self.form.instances.first()
        response = self.client.delete(f"/api/mobile/instances/{instance.pk}/")
        self.assertJSONResponse(response, 403)

    def test_post_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/mobile/instances/", data={})
        self.assertJSONResponse(response, 403)

    def test_patch_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.user)
        instance = self.form.instances.first()
        response = self.client.patch(f"/api/mobile/instances/{instance.pk}/", data={})
        self.assertJSONResponse(response, 403)

    def test_wrong_id_passed(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/mobile/instances/test/attachments/", data={})
        self.assertJSONResponse(response, 404)

    def test_attachments_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.user)
        instance = self.instance_1
        m.InstanceFile.objects.create(instance=instance, file="test1.jpg")
        m.InstanceFile.objects.create(instance=instance, file="test2.pdf")
        response = self.client.get(f"/api/mobile/instances/{instance.pk}/attachments/")
        self.assertJSONResponse(response, 200)
        data = response.json()["attachments"]
        self.assertEqual(len(data), 2)
        self.assertTrue(data[0]["file"].endswith("test1.jpg"))
        self.assertTrue(data[1]["file"].endswith("test2.pdf"))

        response = self.client.get(f"/api/mobile/instances/{instance.uuid}/attachments/")
        self.assertJSONResponse(response, 200)
        data = response.json()["attachments"]
        self.assertEqual(len(data), 2)
        self.assertTrue(data[0]["file"].endswith("test1.jpg"))
        self.assertTrue(data[1]["file"].endswith("test2.pdf"))

        response = self.client.get(f"/api/mobile/instances/{self.instance_2.pk}/attachments/")
        self.assertJSONResponse(response, 200)
        data = response.json()["attachments"]
        self.assertEqual(len(data), 0)

    def test_attachments_filter_image_only(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.user)
        instance = self.instance_1
        m.InstanceFile.objects.create(instance=instance, file="test1.jpg")
        m.InstanceFile.objects.create(instance=instance, file="test2.pdf")
        response = self.client.get(f"/api/mobile/instances/{instance.pk}/attachments/", data={IMAGE_ONLY: True})
        self.assertJSONResponse(response, 200)
        data = response.json()["attachments"]
        self.assertEqual(len(data), 1)
        self.assertTrue(data[0]["file"].endswith("test1.jpg"))
