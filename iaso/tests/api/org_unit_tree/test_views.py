from iaso import models as m
from iaso.test import APITestCase


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

        cls.user_without_org_unit_for_profile = cls.create_user_with_profile(username="user2", account=cls.account)

    def test_root_level_for_anonymous_user(self):
        """
        Anonymous users view the default tree root (`data_source_id` is mandatory for anonymous users).
        """
        with self.assertNumQueries(2):
            response = self.client.get(f"/api/orgunits/tree/?data_source_id={self.data_source.pk}")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data))
            self.assertEqual(response.data[0]["name"], "Angola")
            self.assertEqual(response.data[1]["name"], "Burkina Faso")

    def test_root_level_for_authenticated_user_with_org_unit_for_profile(self):
        """
        Authenticated users with org units linked to their profile view a custom tree root.
        """
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(3):
            response = self.client.get("/api/orgunits/tree/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Burkina Faso")

    def test_root_level_force_full_tree_for_authenticated_user_with_org_unit_for_profile(self):
        """
        `force_full_tree` gives access to the default tree root, even to authenticated users
        with org units linked to their profile.
        """
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(3):
            response = self.client.get("/api/orgunits/tree/?force_full_tree=true")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data))
            self.assertEqual(response.data[0]["name"], "Angola")
            self.assertEqual(response.data[1]["name"], "Burkina Faso")

    def test_root_level_for_authenticated_user_without_org_unit_for_profile(self):
        """
        Authenticated users without org units linked to their profile view the default tree root.
        """
        self.client.force_authenticate(self.user_without_org_unit_for_profile)
        with self.assertNumQueries(3):
            response = self.client.get("/api/orgunits/tree/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data))
            self.assertEqual(response.data[0]["name"], "Angola")
            self.assertEqual(response.data[1]["name"], "Burkina Faso")

    def test_root_level_for_superuser(self):
        """
        Superusers view the default tree root.
        """
        self.user_without_org_unit_for_profile.is_superuser = True
        self.user_without_org_unit_for_profile.save()
        self.client.force_authenticate(self.user_without_org_unit_for_profile)
        with self.assertNumQueries(3):
            response = self.client.get("/api/orgunits/tree/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data))
            self.assertEqual(response.data[0]["name"], "Angola")
            self.assertEqual(response.data[1]["name"], "Burkina Faso")

    def test_specific_level_for_anonymous(self):
        with self.assertNumQueries(2):
            # Select `DataSource`.
            # Select `OrgUnit`s.
            response = self.client.get(
                f"/api/orgunits/tree/?parent_id={self.angola.pk}&data_source_id={self.data_source.pk}"
            )
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Huila")

    def test_specific_level_for_authenticated_user(self):
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

    def test_specific_level_with_force_full_tree(self):
        self.client.force_authenticate(self.user)

        with self.assertNumQueries(3):
            response = self.client.get(f"/api/orgunits/tree/?parent_id={self.angola.pk}&force_full_tree=true")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Huila")

        with self.assertNumQueries(3):
            response = self.client.get(f"/api/orgunits/tree/?parent_id={self.burkina.pk}&force_full_tree=true")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data))
            self.assertEqual(response.data[0]["name"], "Boucle du Mouhon")

    def test_children_count(self):
        """
        When we filter only by VALID org units, then REJECTED or NEW children should not be included in `has_children`.
        """
        self.client.force_authenticate(self.user)

        url = f"/api/orgunits/tree/?parent_id={self.burkina.pk}&validation_status={m.OrgUnit.VALIDATION_VALID}"

        response = self.client.get(url)
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data))
        self.assertEqual(response.data[0]["name"], "Boucle du Mouhon")
        self.assertEqual(response.data[0]["has_children"], True)

        # Mark the child of "Boucle du Mouhon" as "rejected".
        self.burkina_district.validation_status = m.OrgUnit.VALIDATION_REJECTED
        self.burkina_district.save()

        response = self.client.get(url)
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data))
        self.assertEqual(response.data[0]["has_children"], False)  # It should be excluded from `has_children`.

        # Mark the child of "Boucle du Mouhon" as "new".
        self.burkina_district.validation_status = m.OrgUnit.VALIDATION_NEW
        self.burkina_district.save()

        response = self.client.get(url)
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data))
        self.assertEqual(response.data[0]["has_children"], False)  # It should be excluded from `has_children`.

    def test_search(self):
        self.client.force_authenticate(self.user)

        with self.assertNumQueries(3):
            response = self.client.get("/api/orgunits/tree/search/?search=b")
            self.assertJSONResponse(response, 200)
            self.assertEqual(3, len(response.data["results"]))
            self.assertEqual(response.data["results"][0]["name"], "Banwa")
            self.assertEqual(response.data["results"][1]["name"], "Boucle du Mouhon")
            self.assertEqual(response.data["results"][2]["name"], "Burkina Faso")

        with self.assertNumQueries(3):
            response = self.client.get("/api/orgunits/tree/search/?search=BURKINA")
            self.assertJSONResponse(response, 200)
            self.assertEqual(1, len(response.data["results"]))
            self.assertEqual(response.data["results"][0]["name"], "Burkina Faso")
