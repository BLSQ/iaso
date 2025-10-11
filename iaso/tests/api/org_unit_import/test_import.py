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

        # Types for all tests
        region_out = m.OrgUnitType.objects.create(name="Region")
        district_out = m.OrgUnitType.objects.create(name="District")
        country_out = m.OrgUnitType.objects.create(name="Country")
        facility_out = m.OrgUnitType.objects.create(name="Facility")

        region_out.projects.add(project)
        district_out.projects.add(project)
        country_out.projects.add(project)
        facility_out.projects.add(project)

        # Create a hierarchy for testing disambiguation
        cls.country1 = m.OrgUnit.objects.create(name="Country 1", version=cls.version, org_unit_type=country_out)
        cls.region_a_in_country1 = m.OrgUnit.objects.create(
            name="Region A", version=cls.version, org_unit_type=region_out, parent=cls.country1
        )

        cls.country2 = m.OrgUnit.objects.create(name="Country 2", version=cls.version, org_unit_type=country_out)
        cls.region_a_in_country2 = m.OrgUnit.objects.create(
            name="Region A", version=cls.version, org_unit_type=region_out, parent=cls.country2
        )

        cls.district_x = m.OrgUnit.objects.create(
            name="District X", version=cls.version, org_unit_type=district_out, parent=cls.region_a_in_country1
        )

    def test_import_org_units_from_xlsx(self):
        self.client.force_authenticate(self.user)

        import io

        import pandas as pd

        df = pd.DataFrame(
            [
                {"name": "Region C", "parent": None, "org_unit_type": "Region"},
                {"name": "District C1", "parent": "Region C", "org_unit_type": "District"},
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

        self.assertTrue(m.OrgUnit.objects.filter(name="Region C", org_unit_type__name="Region").exists())
        self.assertTrue(
            m.OrgUnit.objects.filter(
                name="District C1", org_unit_type__name="District", parent__name="Region C"
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

    def test_import_with_parent_disambiguation(self):
        self.client.force_authenticate(self.user)

        csv_data = (
            b"name,org_unit_type,parent,parent2,parent3\n"
            b"District Y,District,Region A,Country 1,\n"
            b"Health Center,Facility,District X,Region A,Country 1\n"
            b'Facility B,Facility,District X,"",Country 2\n'
            b"Facility C,Facility,Region A,,\n"
            b"Facility D,Facility,District X,Region B,Country 1\n"
        )

        file = SimpleUploadedFile(
            "import_disambiguation.csv",
            csv_data,
            content_type="text/csv",
        )

        response = self.client.post("/api/orgunits/import_org_units/", {"file": file}, format="multipart")

        self.assertJSONResponse(response, 400)

        response_data = response.json()
        self.assertEqual(response_data["status"], "error")
        self.assertEqual(response_data["created"], 3)
        self.assertEqual(response_data["updated"], 0)

        errors = response_data["errors"]
        self.assertEqual(len(errors), 2)
        self.assertIn("Row 5: Ambiguous parent hierarchy ['Region A']. Multiple matches found.", errors)
        self.assertIn("Row 6: Parent hierarchy ['District X', 'Region B', 'Country 1'] not found.", errors)

        # Verify successful creations
        district_y = m.OrgUnit.objects.get(name="District Y")
        self.assertEqual(district_y.parent, self.region_a_in_country1)

        health_center = m.OrgUnit.objects.get(name="Health Center")
        self.assertEqual(health_center.parent, self.district_x)

        facility_b = m.OrgUnit.objects.get(name="Facility B")
        self.assertEqual(facility_b.parent, self.district_x)

        # Verify unsuccessful creations
        self.assertFalse(m.OrgUnit.objects.filter(name="Facility C").exists())
        self.assertFalse(m.OrgUnit.objects.filter(name="Facility D").exists())
