from iaso.gpkg.import_gpkg import import_gpkg_file
from iaso.models import Account, Project
from iaso.test import APITestCase
from setuper.pyramid import update_org_unit_sub_type


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
        self.assertJSONResponse(response, 200)
        response_data = response.json()

        updated_with_sub_types = update_org_unit_sub_type(
            self.client, self.project.id, response_data["orgUnitTypes"], False
        )

        for org_unit_type_with in updated_with_sub_types:
            self.assertJSONResponse(org_unit_type_with, 200)
