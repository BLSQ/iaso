from hat.audit import models as audit_models
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

        cls.user_with_perms = cls.create_user_with_profile(
            username="user_with_perms", account=cls.account, permissions=["iaso_org_units"]
        )
        cls.user_without_perms = cls.create_user_with_profile(username="user_without_perms", account=cls.account)

    def test_retrieve_without_auth(self):
        response = self.client.get(f"/api/orgunits/shape/{self.org_unit.pk}/")
        self.assertJSONResponse(response, 401)

    def test_retrieve_without_perms(self):
        self.client.force_authenticate(self.user_without_perms)
        response = self.client.get(f"/api/orgunits/shape/{self.org_unit.pk}/")
        self.assertJSONResponse(response, 403)

    def test_retrieve(self):
        self.client.force_authenticate(self.user_with_perms)
        response = self.client.get(f"/api/orgunits/shape/{self.org_unit.pk}/")
        self.assertJSONResponse(response, 200)

    def test_list(self):
        self.client.force_authenticate(self.user_with_perms)
        response = self.client.get("/api/orgunits/shape/")
        self.assertJSONResponse(response, 200)

    def test_patch(self):
        self.assertIsNone(self.org_unit.geom)
        self.assertIsNone(self.org_unit.simplified_geom)

        self.client.force_authenticate(self.user_with_perms)
        data = {"geom": "SRID=4326;MULTIPOLYGON (((-1.3 2.5, -1.7 2.8, -1.1 4.1, -1.3 2.5)))"}
        response = self.client.patch(f"/api/orgunits/shape/{self.org_unit.pk}/", data, format="json")
        self.assertEqual(response.status_code, 200)

        self.org_unit.refresh_from_db()
        self.assertIsNotNone(self.org_unit.geom)
        self.assertIsNotNone(self.org_unit.simplified_geom)

        modification_log = audit_models.Modification.objects.get(object_id=self.org_unit.pk)
        self.assertEqual(modification_log.source, audit_models.ORG_UNIT_API_SHAPE)
        self.assertEqual(modification_log.user, self.user_with_perms)
        past_values = modification_log.past_value[0]["fields"]
        self.assertEqual(past_values["geom"], None)
        self.assertEqual(past_values["simplified_geom"], None)
        new_values = modification_log.new_value[0]["fields"]
        self.assertEqual(new_values["geom"], self.org_unit.geom)
        self.assertEqual(new_values["simplified_geom"], self.org_unit.simplified_geom)

    def test_create(self):
        """
        `create` should be forbidden.
        """
        self.client.force_authenticate(self.user_with_perms)
        data = {"geom": "SRID=4326;MULTIPOLYGON (((-1.3 2.5, -1.7 2.8, -1.1 4.1, -1.3 2.5)))"}
        response = self.client.post("/api/orgunits/shape/", data, format="json")
        self.assertEqual(response.status_code, 405)

    def test_delete_should_be_forbidden(self):
        """
        `delete` should be forbidden.
        """
        self.client.force_authenticate(self.user_with_perms)
        response = self.client.delete(f"/api/orgunits/shape/{self.org_unit.pk}/", format="json")
        self.assertEqual(response.status_code, 405)
