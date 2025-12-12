from rest_framework import status

from iaso import models as m
from iaso.test import APITestCase
from plugins.polio.models import CountryUsersGroup
from plugins.polio.permissions import POLIO_PERMISSION


BASE_URL = "/api/polio/countryusersgroup/"


class CountryUsersGroupAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account_1, cls.data_source_1, cls.source_version_1, cls.project_1 = (
            cls.create_account_datasource_version_project("Data Source 1", "Account 1", "Project 1", "com.app1.app")
        )
        cls.account_2, cls.data_source_2, cls.source_version_2, cls.project_2 = (
            cls.create_account_datasource_version_project("Data Source 2", "Account 2", "Project 2", "com.app2.app")
        )

        cls.user_with_perms, cls.anonymous_user, cls.user_without_perms = cls.create_base_users(
            cls.account_1, [POLIO_PERMISSION], "user_with_perms"
        )
        cls.user_account_2 = cls.create_user_with_profile(
            username="user_account_2", account=cls.account_2, permissions=[POLIO_PERMISSION]
        )

        cls.country_type = cls.create_org_unit_type("Country", [cls.project_1, cls.project_2], "COUNTRY")
        cls.region_type = cls.create_org_unit_type("Region", [cls.project_1], "REGION")

        cls.country_1 = cls.create_valid_org_unit("Country 1", cls.country_type, cls.source_version_1)
        cls.country_1.validation_status = m.OrgUnit.VALIDATION_VALID
        cls.country_1.save()

        cls.country_2 = cls.create_valid_org_unit("Country 2", cls.country_type, cls.source_version_1)
        cls.country_2.validation_status = m.OrgUnit.VALIDATION_VALID
        cls.country_2.save()

        cls.country_3 = cls.create_valid_org_unit("Country 3", cls.country_type, cls.source_version_1)
        cls.country_3.validation_status = m.OrgUnit.VALIDATION_VALID
        cls.country_3.save()

        # Create countries for account 2
        cls.country_4 = cls.create_valid_org_unit("Country 4", cls.country_type, cls.source_version_2)
        cls.country_4.validation_status = m.OrgUnit.VALIDATION_VALID
        cls.country_4.save()

        # Create a region (not a country) to ensure filtering works
        cls.region_1 = cls.create_valid_org_unit("Region 1", cls.region_type, cls.source_version_1)
        cls.region_1.validation_status = m.OrgUnit.VALIDATION_VALID
        cls.region_1.save()

        # Create CountryUsersGroup for some countries (not all, to test auto-creation)
        cls.country_users_group_1 = CountryUsersGroup.objects.create(country=cls.country_1, language="EN")
        cls.country_users_group_2 = CountryUsersGroup.objects.create(country=cls.country_2, language="FR")
        # country_3 intentionally has no CountryUsersGroup to test auto-creation
        cls.country_users_group_4 = CountryUsersGroup.objects.create(country=cls.country_4, language="PT")

        cls.user_1 = cls.create_user_with_profile(username="user1", account=cls.account_1)
        cls.user_2 = cls.create_user_with_profile(username="user2", account=cls.account_1)
        cls.country_users_group_1.users.add(cls.user_1, cls.user_2)

    def test_unauthenticated_access_forbidden(self):
        """Unauthenticated users should not be able to access the endpoint."""
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

        response = self.client.put(f"{BASE_URL}{self.country_users_group_1.id}/", data={}, format="json")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_without_permissions_forbidden(self):
        """Authenticated users without POLIO_PERMISSION should be forbidden."""
        self.client.force_authenticate(self.user_without_perms)
        # response = self.client.get(BASE_URL)
        # self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

        response = self.client.put(
            f"{BASE_URL}{self.country_users_group_1.id}/", data={"language": "PT"}, format="json"
        )
        self.assertJSONResponse(response, status.HTTP_403_FORBIDDEN)

    def test_authenticated_user_with_permissions_allowed(self):
        """Authenticated users with POLIO_PERMISSION should be able to access."""
        self.client.force_authenticate(self.user_with_perms)
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

    def test_list_filters_by_account(self):
        """Test that a user can only see CountryUsersGroup from their own account."""
        self.client.force_authenticate(self.user_with_perms)
        response = self.client.get(BASE_URL)
        response_json = self.assertJSONResponse(response, status.HTTP_200_OK)
        results = response_json["country_users_group"]
        result_ids = {item["id"] for item in results}

        # Should see country_users_group_1, country_users_group_2, and auto-created one for country_3
        self.assertIn(self.country_users_group_1.id, result_ids)
        self.assertIn(self.country_users_group_2.id, result_ids)

        # Should NOT see country_users_group_4 (from account_2)
        self.assertNotIn(self.country_users_group_4.id, result_ids)

    def test_auto_creates_missing_country_users_groups(self):
        """Test that missing CountryUsersGroup objects are automatically created."""
        self.client.force_authenticate(self.user_with_perms)

        # Verify country_3 doesn't have a group yet
        self.assertFalse(CountryUsersGroup.objects.filter(country=self.country_3).exists())

        # Make a GET request
        response = self.client.get(BASE_URL)
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        # Verify country_3 now has a group
        self.assertTrue(CountryUsersGroup.objects.filter(country=self.country_3).exists())

        # Verify it's included in the response
        results = response_data.get("country_users_group", [])
        country_3_group = CountryUsersGroup.objects.get(country=self.country_3)
        result_ids = {item["id"] for item in results}
        self.assertIn(country_3_group.id, result_ids)

    def test_response_shape(self):
        """Test that the response has the correct shape and fields."""
        self.client.force_authenticate(self.user_with_perms)
        response = self.client.get(BASE_URL)
        self.assertJSONResponse(response, status.HTTP_200_OK)

        response_data = response.json()
        self.assertIn("country_users_group", response_data)

        if response_data["country_users_group"]:
            result = response_data["country_users_group"][0]
            expected_fields = {
                "id",
                "country",
                "language",
                "created_at",
                "updated_at",
                "country_name",
                "users",
                "read_only_users_field",
                "teams",
            }
            self.assertEqual(set(result.keys()), expected_fields)

    def test_get_request_query_count(self):
        """Test that GET request doesn't cause excessive database queries."""
        self.client.force_authenticate(self.user_with_perms)

        with self.assertNumQueries(9):
            # get_queryset
            #   1. SELECT auth_permission
            #   2. SELECT auth_permission & auth_user_groups
            #   3. SELECT EXISTS iaso_orgunit & iaso_profile_org_units
            #   4. SELECT EXISTS iaso_orgunit & iaso_orgunittype
            #   5. SELECT iaso_orgunit
            #   6. INSERT INTO polio_countryusersgroup
            #   7. SELECT polio_countryusersgroup
            #   8. PREFETCH polio_countryusersgroup_users
            #   9. PREFETCH polio_countryusersgroup_teams
            response = self.client.get(BASE_URL)
            self.assertJSONResponse(response, status.HTTP_200_OK)

    def test_get_request_query_count_with_existing_groups(self):
        """Test query count when all groups already exist (no auto-creation needed)."""
        # Create group for country_3 so no auto-creation is needed
        CountryUsersGroup.objects.create(country=self.country_3, language="EN")

        self.client.force_authenticate(self.user_with_perms)

        # Should have fewer queries since no bulk_create is needed
        with self.assertNumQueries(7):
            # get_queryset
            #   1. SELECT auth_permission
            #   2. SELECT auth_permission & auth_user_groups
            #   3. SELECT EXISTS iaso_orgunit & iaso_profile_org_units
            #   4. SELECT EXISTS iaso_orgunit & iaso_orgunittype
            #   5. SELECT polio_countryusersgroup
            #   6. PREFETCH polio_countryusersgroup_users
            #   7. PREFETCH polio_countryusersgroup_teams
            response = self.client.get(BASE_URL)
            self.assertJSONResponse(response, status.HTTP_200_OK)
