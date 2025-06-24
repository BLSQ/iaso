import datetime

from unittest import mock
from unittest.mock import patch
from uuid import uuid4

import pytz

from iaso import models as m
from iaso.api.query_params import IMAGE_ONLY
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


MOCK_DATE = datetime.datetime(2020, 2, 2, 2, 2, 2, tzinfo=pytz.utc)


class InstancesMobileAPITestCase(TaskAPITestCase):
    @classmethod
    @mock.patch("django.utils.timezone.now", lambda: MOCK_DATE)
    def setUpTestData(cls):
        cls.star_wars = star_wars = m.Account.objects.create(name="Star Wars")

        sw_source = m.DataSource.objects.create(name="Galactic Empire")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        star_wars.default_version = sw_version
        star_wars.save()
        cls.sw_version = sw_version

        cls.yoda = cls.create_user_with_profile(
            username="yoda",
            last_name="Da",
            first_name="Yo",
            account=star_wars,
            permissions=["iaso_submissions", "iaso_org_units"],
        )

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_corruscant_uuid = str(uuid4())
        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council",
            source_ref="jedi_council_corruscant_ref",
            version=sw_version,
            validation_status="VALID",
            uuid=cls.jedi_council_corruscant_uuid,
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        sw_source.projects.add(cls.project)

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)
        date1 = datetime.datetime(2020, 2, 1, 0, 0, 5, tzinfo=pytz.UTC)

        with patch("django.utils.timezone.now", lambda: date1):
            cls.instance_1 = cls.create_form_instance(
                form=cls.form_1,
                period="202001",
                org_unit=cls.jedi_council_corruscant,
                project=cls.project,
                created_by=cls.yoda,
                export_id="Vzhn0nceudr",
                source_created_at=date1,
            )
        with patch("django.utils.timezone.now", lambda: date1):
            cls.instance_2 = cls.create_form_instance(
                form=cls.form_1,
                period="202002",
                org_unit=cls.jedi_council_corruscant,
                project=cls.project,
                created_by=cls.yoda,
                source_created_at=date1,
            )

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.forms.add(cls.form_1)
        sw_source.projects.add(cls.project)
        cls.project.save()

    def test_attachments_permission_denied_when_anonymous(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        instance = self.form_1.instances.first()
        response = self.client.get(f"/api/mobile/instances/{instance.pk}/attachments/")
        self.assertJSONResponse(response, 401)

    def test_get_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.yoda)
        instance = self.form_1.instances.first()
        response = self.client.get(f"/api/mobile/instances/{instance.pk}/")
        self.assertJSONResponse(response, 403)

    def test_list_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/instances/")
        self.assertJSONResponse(response, 403)

    def test_delete_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.yoda)
        instance = self.form_1.instances.first()
        response = self.client.delete(f"/api/mobile/instances/{instance.pk}/")
        self.assertJSONResponse(response, 403)

    def test_post_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.yoda)
        response = self.client.post("/api/mobile/instances/", data={})
        self.assertJSONResponse(response, 403)

    def test_patch_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.yoda)
        instance = self.form_1.instances.first()
        response = self.client.patch(f"/api/mobile/instances/{instance.pk}/", data={})
        self.assertJSONResponse(response, 403)

    def test_attachments_when_logged_in(self):
        """GET /mobile/instances/{instance.pk}/attachments/"""
        self.client.force_authenticate(self.yoda)
        instance = self.instance_1
        m.InstanceFile.objects.create(instance=instance, file="test1.jpg")
        m.InstanceFile.objects.create(instance=instance, file="test2.pdf")
        response = self.client.get(f"/api/mobile/instances/{instance.pk}/attachments/")
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
        self.client.force_authenticate(self.yoda)
        instance = self.instance_1
        m.InstanceFile.objects.create(instance=instance, file="test1.jpg")
        m.InstanceFile.objects.create(instance=instance, file="test2.pdf")
        response = self.client.get(f"/api/mobile/instances/{instance.pk}/attachments/", data={IMAGE_ONLY: True})
        self.assertJSONResponse(response, 200)
        data = response.json()["attachments"]
        self.assertEqual(len(data), 1)
        self.assertTrue(data[0]["file"].endswith("test1.jpg"))
