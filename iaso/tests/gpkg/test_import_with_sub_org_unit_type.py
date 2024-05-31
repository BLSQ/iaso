from iaso.gpkg.import_gpkg import import_gpkg_file
from iaso.models import Account, Project
from iaso.test import APITestCase


class OrgUnitImportFromGPKG(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="a")
        cls.user_test = cls.create_user_with_profile(username="test", account=cls.account)
        cls.project = Project.objects.create(name="Project 1", account=cls.account, app_id="test_app_id")

    def test_minimal_import_with_sub_org_unit_type(self):
        import_gpkg_file(
            "./iaso/tests/fixtures/gpkg/minimal.gpkg",
            project_id=self.project.id,
            source_name="test",
            version_number=1,
            validation_status="new",
            description="",
        )
        self.client.force_authenticate(self.user_test)
        response = self.client.get("/api/v2/orgunittypes/")
        org_unit_types = response.json()["orgUnitTypes"]

        for org_unit_type in org_unit_types:
            current_level = org_unit_type["depth"]
            current_id = org_unit_type["id"]
            sub_unit_type_ids = [
                org_unit_type["id"] for org_unit_type in org_unit_types if org_unit_type["depth"] == (current_level + 1)
            ]

            if len(sub_unit_type_ids) > 0:
                current_type = {
                    "name": org_unit_type["name"],
                    "short_name": org_unit_type["short_name"],
                    "project_ids": [self.project.id],
                    "sub_unit_type_ids": sub_unit_type_ids,
                }
                response = self.client.patch(f"/api/v2/orgunittypes/{current_id}/", data=current_type, format="json")
                self.assertJSONResponse(response, 200)
                self.assertHasField(response.json(), "sub_unit_types", list)
                new_sub_units = response.json()["sub_unit_types"]
                new_sub_unit_ids = [sub_unit_type["id"] for sub_unit_type in new_sub_units]
                self.assertEqual(new_sub_unit_ids, sub_unit_type_ids)
