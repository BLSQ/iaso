from django.core.files.uploadedfile import SimpleUploadedFile

from iaso import models as m
from iaso.permissions.core_permissions import CORE_ORG_UNITS_PERMISSION
from iaso.test import APITestCase


class OrgUnitImportAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        account = m.Account.objects.create(name="Account", default_version=version)
        project = m.Project.objects.create(name="Project", account=account, app_id="foo.bar.baz")
        user = cls.create_user_with_profile(username="user", account=account, permissions=[CORE_ORG_UNITS_PERMISSION])

        cls.user = user
        cls.account = account
        cls.project = project
        cls.version = version

        region_org_unit_type = m.OrgUnitType.objects.create(name="Region")
        district_org_unit_type = m.OrgUnitType.objects.create(name="District")
        region_org_unit_type.projects.add(project)
        district_org_unit_type.projects.add(project)

    def test_import_org_units_from_xlsx(self):
        self.client.force_authenticate(self.user)

        import io

        import pandas as pd

        df = pd.DataFrame(
            [
                {"name": "Region A", "parent": None, "org_unit_type": "Region"},
                {"name": "District A1", "parent": "Region A", "org_unit_type": "District"},
            ]
        )

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
            df.to_excel(writer, index=False, sheet_name="Sheet1")

        output.seek(0)

        file = SimpleUploadedFile(
            "sample_import.xlsx",
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )

        response = self.client.post("/api/orgunits/import_org_units/", {"file": file}, format="multipart")

        self.assertJSONResponse(response, 201)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["created"], 2)

        self.assertTrue(m.OrgUnit.objects.filter(name="Region A", org_unit_type__name="Region").exists())
        self.assertTrue(
            m.OrgUnit.objects.filter(
                name="District A1", org_unit_type__name="District", parent__name="Region A"
            ).exists()
        )

    def test_import_org_units_from_csv(self):
        self.client.force_authenticate(self.user)

        csv_data = b"name,parent,org_unit_type\nRegion B,,Region\nDistrict B1,Region B,District\n"

        file = SimpleUploadedFile(
            "sample_import.csv",
            csv_data,
            content_type="text/csv",
        )

        response = self.client.post("/api/orgunits/import_org_units/", {"file": file}, format="multipart")

        self.assertJSONResponse(response, 201)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["created"], 2)

        self.assertTrue(m.OrgUnit.objects.filter(name="Region B", org_unit_type__name="Region").exists())
        self.assertTrue(
            m.OrgUnit.objects.filter(
                name="District B1", org_unit_type__name="District", parent__name="Region B"
            ).exists()
        )
