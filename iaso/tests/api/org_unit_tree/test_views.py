from iaso.test import APITestCase
from iaso import models as m


class OrgUnitTreeViewsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data source")
        cls.source_version = m.SourceVersion.objects.create(number=1, data_source=cls.data_source)

        # Angola.
        cls.angola = m.OrgUnit.objects.create(
            name="Angola",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["1"],
            version=cls.source_version,
        )
        cls.angola_region = m.OrgUnit.objects.create(
            name="Huila",
            parent=cls.angola,
            org_unit_type=m.OrgUnitType.objects.create(category="REGION"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["1", "2"],
            version=cls.source_version,
        )
        cls.angola_district = m.OrgUnit.objects.create(
            name="Cuvango",
            parent=cls.angola_region,
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["1", "2", "3"],
            version=cls.source_version,
        )
        cls.angola_district.calculate_paths()

        # Burkina.
        cls.burkina = m.OrgUnit.objects.create(
            name="Burkina Faso",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["2"],
            version=cls.source_version,
        )
        cls.burkina_region = m.OrgUnit.objects.create(
            name="Boucle du Mouhon",
            parent=cls.burkina,
            org_unit_type=m.OrgUnitType.objects.create(category="REGION"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["2", "2"],
            version=cls.source_version,
        )
        cls.burkina_district = m.OrgUnit.objects.create(
            name="Banwa",
            parent=cls.burkina_region,
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["2", "2", "3"],
            version=cls.source_version,
        )
        cls.burkina_district.calculate_paths()

        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.project = m.Project.objects.create(name="Project", account=cls.account, app_id="foo.bar.baz")
        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        cls.data_source.projects.set([cls.project])
        cls.user.iaso_profile.org_units.set([cls.burkina])  # Restrict access to a subset of org units for user.

    def test_tree_root_for_anonymous(self):
        with self.assertNumQueries(1):
            response = self.client.get("/api/orgunits/tree/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data))
            self.assertEqual(response.data[0]["name"], "Angola")
            self.assertEqual(response.data[1]["name"], "Burkina Faso")

    def test_tree_level_for_anonymous(self):
        with self.assertNumQueries(1):
            response = self.client.get(f"/api/orgunits/tree/?parent_id={self.angola.pk}")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Huila")

    def test_restricted_tree_root(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(3):
            response = self.client.get("/api/orgunits/tree/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Burkina Faso")

    def test_restricted_tree_level(self):
        self.client.force_authenticate(self.user)

        with self.assertNumQueries(2):
            response = self.client.get(f"/api/orgunits/tree/?parent_id={self.angola.pk}")
            self.assertJSONResponse(response, 200)
            self.assertEqual(0, len(response.data))

        with self.assertNumQueries(2):
            response = self.client.get(f"/api/orgunits/tree/?parent_id={self.burkina.pk}")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Boucle du Mouhon")

    def test_force_full_tree_root(self):
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(1):
            response = self.client.get("/api/orgunits/tree/?force_full_tree=true")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data))
            self.assertEqual(response.data[0]["name"], "Angola")
            self.assertEqual(response.data[1]["name"], "Burkina Faso")

    def test_force_full_tree_level(self):
        self.client.force_authenticate(self.user)

        with self.assertNumQueries(1):
            response = self.client.get(f"/api/orgunits/tree/?parent_id={self.angola.pk}&force_full_tree=true")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Huila")

        with self.assertNumQueries(1):
            response = self.client.get(f"/api/orgunits/tree/?parent_id={self.burkina.pk}&force_full_tree=true")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Boucle du Mouhon")
