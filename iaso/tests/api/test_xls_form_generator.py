import datetime

from django.core.files import File
from django.core.files.uploadedfile import SimpleUploadedFile

from iaso.models.xls_form_template import XlsFormTemplate

from django.utils.timezone import now

from iaso import models as m
from iaso.test import APITestCase


class XlsFormGeneratorAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        cls.data_source = m.DataSource.objects.create(name="Default source")
        cls.source_version_1 = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.source_version_2 = m.SourceVersion.objects.create(data_source=cls.data_source, number=2)

        star_wars = m.Account.objects.create(name="Star Wars", default_version=cls.source_version_2)
        marvel = m.Account.objects.create(name="Marvel")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_org_units"])
        cls.chewbacca = cls.create_user_with_profile(username="chewbacca", account=star_wars)
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_org_units"])

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept", app_id="stars.empire.agriculture.land_speeder", account=star_wars
        )

        cls.group_1 = m.Group.objects.create(name="Councils", source_version=cls.source_version_1)
        cls.group_2 = m.Group.objects.create(name="Assemblies", source_version=cls.source_version_2)
        cls.group_3 = m.Group.objects.create(name="Hidden", source_version=cls.source_version_1, domain="POLIO")

        cls.project_1.data_sources.add(cls.data_source)
        cls.project_1.save()

    def test_export_campaign_xls_form(self):
        self.client.force_authenticate(self.yoda)

        data = File(open("iaso/tests/fixtures/testcampaignformtemplate.xlsx", "rb"))
        upload_file = SimpleUploadedFile(
            "testcampaignformtemplate.xlsx", data.read(), content_type="multipart/form-data"
        )

        XlsFormTemplate.objects.create(
            name="A_FORM_1", account=self.yoda.iaso_profile.account, form_template=upload_file
        )

        group = self.group_2

        response = self.client.get(f"/api/generate_xlsform/xlsform_generator/?groupid={group.id}&form_name=A_FORM_1")
        date_now = datetime.datetime.today().strftime("%Y-%m-%d")

        self.assertEqual(response.status_code, 200)
        self.assertEquals(response.get("Content-Disposition"), f"attachment; filename=FORM_A_FORM_1_{date_now}.xlsx")

    def test_upload_xls_form_template(self):
        self.client.force_authenticate(self.yoda)

        file = File(open("iaso/tests/fixtures/testcampaignformtemplate.xlsx", "rb"))
        upload_file = SimpleUploadedFile(
            "testcampaignformtemplate.xlsx", file.read(), content_type="multipart/form-data"
        )

        data = {"file": upload_file, "name": "FORM_TEMPLATE", "account": self.yoda.iaso_profile.account.pk}

        response = self.client.post("/api/generate_xlsform/", data=data)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["name"], "FORM_TEMPLATE")
        self.assertEqual(response.json()["account"], self.yoda.iaso_profile.account.pk)
