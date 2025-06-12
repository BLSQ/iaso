from iaso import models as m
from iaso.test import APITestCase


class OrgUnitShapeViewsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.source_version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)
        cls.org_unit = m.OrgUnit.objects.create(
            name="Org Unit",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            version=cls.source_version,
        )

        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)

        cls.project = m.Project.objects.create(name="Project", account=cls.account, app_id="foo.bar.baz")
        cls.data_source.projects.set([cls.project])

        cls.user = cls.create_user_with_profile(username="User", account=cls.account, permissions=["iaso_org_units"])

    def test_retrieve_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/orgunits/shape/{self.org_unit.pk}/")
        self.assertJSONResponse(response, 200)

    def test_list_ok(self):
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/orgunits/shape/")
        self.assertJSONResponse(response, 200)

    def test_create_should_be_forbidden(self):
        # TODO.
        pass

    def test_delete_should_be_forbidden(self):
        self.client.force_authenticate(self.user)
        response = self.client.delete(f"/api/orgunits/shape/{self.org_unit.pk}/", format="json")
        self.assertEqual(response.status_code, 405)
