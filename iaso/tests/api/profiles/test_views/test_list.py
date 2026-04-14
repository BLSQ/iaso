from django.contrib.auth.models import Group
from django.urls import reverse

from iaso.models import OrgUnit, Profile, UserRole
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION
from iaso.tests.api.profiles.test_views.common import BaseProfileAPITestCase


class ProfileListAPITestCase(BaseProfileAPITestCase):
    def test_profile_list_no_auth(self):
        """GET /profiles/ without auth -> 401"""

        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}))
        self.assertJSONResponse(response, 401)

    def test_profile_list_number_queries_without_read_only_permissions(self):
        """GET /profiles/ with auth (user has read only permissions)"""
        self.client.force_authenticate(self.jane)
        with self.assertNumQueries(13):
            response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}), data={"fields": ":all"})
        self.assertJSONResponse(response, 200)

    def test_profile_list_ok(self):
        """GET /profiles/ with auth"""
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 7)

    def test_profile_list_user_admin_ok(self):
        """GET /profiles/ with auth (user has user admin permissions)"""
        self.client.force_authenticate(self.jim)
        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 7)

    def test_profile_list_superuser_ok(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 7)

    def test_profile_list_user_manager_ok(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.jam)
        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}))
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["count"], 7)
        self.assertEqual(len(response_data["results"]), 7)
        self.assertValidProfileListData(response_data, 7)

    def test_profile_list_managed_user_only_superuser(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}), {"managedUsersOnly": True})
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 7)

    def test_profile_list_managed_user_only_user_admin(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.john)
        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}), {"managedUsersOnly": True})
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 7)

    def test_profile_list_managed_user_only_user_manager_no_org_unit(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.jam)
        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}), {"managedUsersOnly": True})
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 6)

    def test_profile_list_managed_user_only_user_manager_with_org_unit(self):
        """GET /profiles/ with auth (superuser)"""
        self.jam.iaso_profile.org_units.set([self.org_unit_from_parent_type.id])
        self.jum.iaso_profile.org_units.set([self.child_org_unit.id])
        self.client.force_authenticate(self.jam)
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}), {"managedUsersOnly": True, "fields": ":all"}
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)

    def test_profile_list_managed_user_only_user_regular_user(self):
        """GET /profiles/ with auth (superuser)"""
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}), {"managedUsersOnly": True, "fields": ":all"}
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 0)

    def test_search_user_by_has_email(self):
        self.client.force_authenticate(self.jane)

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}), {"hasEmail": True, "fields": ":all"}
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 0)
        self.assertTrue(all(x["email"] for x in response_data["results"]))

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}), {"hasEmail": False, "fields": ":all"}
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 7)
        self.assertFalse(all(x["email"] for x in response_data["results"]))

    def test_search_user_by_permissions(self):
        self.client.force_authenticate(self.jane)

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}), {"permissions": "iaso_users", "fields": ":all"}
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(len(response_data["results"]), 1)
        self.assertEqual(response_data["results"][0]["userName"], "jim")

    def test_search_user_by_org_units(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"location": self.org_unit_from_parent_type.pk, "limit": 100, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)
        self.assertEqual(response_data["results"][0]["userName"], "janedoe")

    def test_search_user_by_org_units_type(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"orgUnitTypes": self.parent_org_unit_type.pk, "limit": 100, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)
        self.assertEqual(response_data["results"][0]["userName"], "janedoe")

    def test_search_user_by_children_ou(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.child_org_unit])

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"location": self.org_unit_from_parent_type.pk, "ouParent": False, "ouChildren": True, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)

        self.assertEqual(response_data["results"][0]["userName"], "janedoe")

    def test_search_user_by_parent_ou(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"location": self.child_org_unit.pk, "ouParent": True, "ouChildren": False, "limit": 100, "fields": ":all"},
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)
        self.assertEqual(response_data["results"][0]["userName"], "janedoe")

    def test_list_by_ids(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"ids": f"{self.jane.id},{self.jim.id}", "fields": ":all"},
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)
        self.assertEqual(response_data["results"][0]["userName"], "janedoe")
        self.assertEqual(response_data["results"][1]["userName"], "jim")

    def test_search_by_profile_ids(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"search": f"ids:{self.jane.iaso_profile.id},{self.jim.iaso_profile.id}", "order": "id", "fields": ":all"},
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)
        self.assertEqual(response_data["results"][0]["userName"], "janedoe")
        self.assertEqual(response_data["results"][1]["userName"], "jim")

    def test_search_by_dhis2_id(self):
        self.client.force_authenticate(self.jane)
        mydhis2_id = "mydhis2id"

        self.jim.iaso_profile.dhis2_id = mydhis2_id
        self.jim.iaso_profile.save()

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}), {"search": f"refs:{mydhis2_id}", "fields": ":all"}
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 1)
        self.assertEqual(response_data["results"][0]["userName"], "jim")

    def test_search_by_teams(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"teams": f"{self.team1.pk},{self.team2.pk}", "fields": ":all"},
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)
        user_names = [item["userName"] for item in response_data["results"]]
        self.assertIn("janedoe", user_names)
        self.assertIn("jim", user_names)

    def test_search_users_by_organization(self):
        self.jane.iaso_profile.organization = "Some organization"
        self.jane.iaso_profile.save()

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-list", kwargs={"version": "v2"}), {"limit": 100, "fields": ":all"})
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 7)

        for parameter in ["so", "some org", "Some organization"]:
            with self.subTest(f"Searching with {parameter}"):
                response = self.client.get(
                    reverse("profiles-list", kwargs={"version": "v2"}), {"limit": 100, "search": parameter}
                )
                response_data = self.assertJSONResponse(response, 200)
                self.assertValidProfileListData(response_data, 1)

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"limit": 100, "search": "wrong search", "fields": ":all"},
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 0)

    def test_search_parameters_default(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])

        response = self.client.get(reverse("profiles-list"), {"limit": 100, "fields": ":all"})
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["count"], 7)

        response = self.client.get(
            reverse("profiles-list"),
            {"org_unit_types": self.parent_org_unit_type.pk, "limit": 100, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["count"], 2)
        self.assertEqual(response_data["results"][0]["user_name"], "janedoe")

        response = self.client.get(
            reverse("profiles-list"),
            {"orgUnitTypes": self.parent_org_unit_type.pk, "limit": 100, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["count"], 7)
        self.assertEqual(response_data["results"][0]["user_name"], "janedoe")

    def test_search_parameters_v1(self):
        self.client.force_authenticate(self.jane)
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])

        response = self.client.get(reverse("profiles-list", kwargs={"version": "v1"}), {"limit": 100, "fields": ":all"})
        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["count"], 7)

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v1"}),
            {"org_unit_types": self.parent_org_unit_type.pk, "limit": 100, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["count"], 2)
        self.assertEqual(response_data["results"][0]["user_name"], "janedoe")

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v1"}),
            {"orgUnitTypes": self.parent_org_unit_type.pk, "limit": 100, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertEqual(response_data["count"], 7)
        self.assertEqual(response_data["results"][0]["user_name"], "janedoe")

    def test_list_profiles_sorted_by_annotated_first_user_role(self):
        """
        Test that profiles are properly sorted by their alphabetically first user role.
        """
        data_manager_group = Group.objects.create(name=f"{self.account.pk}_Data manager")
        gpei_group = Group.objects.create(name=f"{self.account.pk}_GPEI coordinators")
        zulu_group = Group.objects.create(name=f"{self.account.pk}_Zulu role")

        data_manager_role = UserRole.objects.create(group=data_manager_group, account=self.account)
        gpei_role = UserRole.objects.create(group=gpei_group, account=self.account)
        zulu_role = UserRole.objects.create(group=zulu_group, account=self.account)

        # Clear the users.
        self.account.profile_set.exclude(user_id=self.john.pk).delete()

        # User 1: multiple roles starting with "Data manager" (should be first).
        user1 = self.create_user_with_profile(
            username="user_multi_data", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        user1.iaso_profile.user_roles.set([data_manager_role, gpei_role])

        # User 2: single role "GPEI" (should be middle).
        user2 = self.create_user_with_profile(
            username="user_single_gpei", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        user2.iaso_profile.user_roles.set([gpei_role])

        # User 3: single role "Zulu" (should be last)
        user3 = self.create_user_with_profile(
            username="user_single_zulu", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        user3.iaso_profile.user_roles.set([zulu_role])

        # User 4: multiple roles starting with "GPEI coordinators" (should be between user1 and user3)
        user4 = self.create_user_with_profile(
            username="user_multi_gpei", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )
        user4.iaso_profile.user_roles.set([gpei_role, zulu_role])

        self.client.force_authenticate(self.john)

        # Test ascending order.
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"order": "annotatedFirstUserRole", "limit": 10, "fields": ":all"},
        )
        response_data = self.assertJSONResponse(response, 200)

        actual_order = []
        for profile in response_data["results"]:
            if not profile["userRoles"]:
                actual_order.append(None)
                continue
            role_id = profile["userRoles"][0]
            group_name = UserRole.objects.get(id=role_id["id"]).group.name
            actual_order.append(group_name)

        expected_order = [
            f"{self.account.pk}_Data manager",
            f"{self.account.pk}_GPEI coordinators",
            f"{self.account.pk}_GPEI coordinators",
            f"{self.account.pk}_Zulu role",
            None,
        ]

        self.assertEqual(
            actual_order,
            expected_order,
            f"Users not sorted correctly by first role. Expected: {expected_order}, got: {actual_order}",
        )

        # Test descending order.

        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"order": "-annotatedFirstUserRole", "limit": 10, "fields": ":all"},
        )
        response_data = self.assertJSONResponse(response, 200)

        actual_order = []
        for profile in response_data["results"]:
            if not profile["userRoles"]:
                actual_order.append(None)
                continue
            role_id = profile["userRoles"][0]
            group_name = UserRole.objects.get(id=role_id["id"]).group.name
            actual_order.append(group_name)

        expected_order = [
            None,
            f"{self.account.pk}_Zulu role",
            f"{self.account.pk}_GPEI coordinators",
            f"{self.account.pk}_GPEI coordinators",
            f"{self.account.pk}_Data manager",
        ]

        self.assertEqual(
            actual_order,
            expected_order,
            f"Users not sorted correctly by first role. Expected: {expected_order}, got: {actual_order}",
        )

    def test_profile_list_search_with_children_ou_preserves_search_results(self):
        """
        Test that search results are preserved with `ouChildren`.
        """
        # Clear existing org units first.
        for profile in Profile.objects.all():
            profile.org_units.clear()

        # This user matches "jim" search.
        self.jim.iaso_profile.org_units.set([self.child_org_unit])

        # Create a user that matches "jim" search but is NOT in the hierarchy.
        self.create_user_with_profile(
            username="jim_outside", account=self.account, permissions=[CORE_USERS_ADMIN_PERMISSION]
        )

        self.client.force_authenticate(self.jim)

        # Search for "jim" without ouChildren - should return both `jim` and `jim_outside`.
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}), {"search": "jim", "fields": ":all"}
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 2)
        profiles = response_data["results"]
        self.assertEqual(profiles[0]["userName"], "jim")
        self.assertEqual(profiles[1]["userName"], "jim_outside")

        # Search for "jim" with `ouChildren=true` - should only return jim (who is in hierarchy).
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"search": "jim", "location": self.org_unit_from_parent_type.pk, "ouChildren": True, "fields": ":all"},
        )
        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 1)
        profiles = response_data["results"]
        self.assertEqual(profiles[0]["userName"], "jim")

    def test_profile_list_search_by_children_ou_no_duplicates(self):
        """Test that searching by children org units doesn't return duplicate profiles
        when a user is assigned to multiple levels"""
        # Clear existing org units first
        for profile in Profile.objects.all():
            profile.org_units.clear()

        # Assign a user to multiple levels in the hierarchy
        self.jane.iaso_profile.org_units.set(
            [
                self.org_unit_from_parent_type,  # Root
                self.child_org_unit,  # Child
            ]
        )

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"location": self.org_unit_from_parent_type.pk, "ouChildren": True, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 1)

        # Should only include the user once despite being in multiple levels
        self.assertEqual(response_data["results"][0]["userName"], "janedoe")

    def test_profile_list_search_by_parent_and_children_ou(self):
        """Test that searching with both parent and children flags returns the complete hierarchy"""
        # Clear existing org units first
        for profile in Profile.objects.all():
            profile.org_units.clear()

        # Setup hierarchy
        parent_of_root = OrgUnit.objects.create(
            org_unit_type=self.parent_org_unit_type,
            version=self.account.default_version,
            name="Parent of root",
        )
        self.org_unit_from_parent_type.parent = parent_of_root
        self.org_unit_from_parent_type.save()

        # Assign users to different levels
        self.jane.iaso_profile.org_units.set([parent_of_root])  # Parent
        self.jim.iaso_profile.org_units.set([self.org_unit_from_parent_type])  # Current
        self.jam.iaso_profile.org_units.set([self.child_org_unit])  # Child

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"location": self.org_unit_from_parent_type.pk, "ouParent": True, "ouChildren": True, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 3)
        profiles = response_data["results"]
        usernames = [p["userName"] for p in profiles]

        # Should include users from parent, current and child levels
        self.assertIn("janedoe", usernames)  # Parent level
        self.assertIn("jim", usernames)  # Current level
        self.assertIn("jam", usernames)  # Child level

    def test_profile_list_search_by_children_ou_deep_hierarchy(self):
        """Test that searching by children org units returns profiles from all levels of the hierarchy"""
        # Create a deeper hierarchy
        child_of_child = OrgUnit.objects.create(
            org_unit_type=self.parent_org_unit_type,
            version=self.account.default_version,
            name="Child of child org unit",
            parent=self.child_org_unit,
        )

        grand_child = OrgUnit.objects.create(
            org_unit_type=self.parent_org_unit_type,
            version=self.account.default_version,
            name="Grand child org unit",
            parent=child_of_child,
        )

        # Clear existing org units first to avoid interference
        for profile in Profile.objects.all():
            profile.org_units.clear()

        # Assign users to different levels of the hierarchy
        self.jane.iaso_profile.org_units.set([self.org_unit_from_parent_type])  # Root
        self.jim.iaso_profile.org_units.set([self.child_org_unit])  # Child
        self.jam.iaso_profile.org_units.set([child_of_child])  # Child of child
        self.jom.iaso_profile.org_units.set([grand_child])  # Grand child

        self.client.force_authenticate(self.jane)
        response = self.client.get(
            reverse("profiles-list", kwargs={"version": "v2"}),
            {"location": self.org_unit_from_parent_type.pk, "ouChildren": True, "fields": ":all"},
        )

        response_data = self.assertJSONResponse(response, 200)
        self.assertValidProfileListData(response_data, 4)
        profiles = response_data["results"]
        usernames = [p["userName"] for p in profiles]

        # Should include users from all levels
        self.assertIn("janedoe", usernames)  # Root level
        self.assertIn("jim", usernames)  # Child level
        self.assertIn("jam", usernames)  # Child of child level
        self.assertIn("jom", usernames)  # Grand child level

    def test_fields_parameter(self):
        self.client.force_authenticate(self.jim)

        # to avoid having empty phone_number and hence not output to the serializer (phone_number not in the keys)
        # todo: it's imho a bug that should be fixed though
        for profile in Profile.objects.all():
            profile.phone_number = "+32488888888"
            profile.save()

        response = self.client.get(reverse("profiles-list"), data={"fields": ":all"})
        response_data = self.assertJSONResponse(response, 200)
        # self.assertValidProfileListData(response_data, 7)

        for item in response_data["results"]:
            self.assertCountEqual(
                item.keys(),
                [
                    "id",
                    "user_id",
                    "first_name",
                    "user_name",
                    "last_name",
                    "email",
                    "phone_number",
                    "user_roles",
                    "projects",
                    "user_display",
                ],
            )

        response = self.client.get(reverse("profiles-list"), data={"fields": ":default"})
        response_data = self.assertJSONResponse(response, 200)
        # self.assertValidProfileListData(response_data, 7)

        for item in response_data["results"]:
            self.assertCountEqual(item.keys(), ["id", "user_id", "user_display"])

        response = self.client.get(reverse("profiles-list"), data={"fields": "email,last_name"})
        response_data = self.assertJSONResponse(response, 200)
        # self.assertValidProfileListData(response_data, 7)

        for item in response_data["results"]:
            self.assertCountEqual(item.keys(), ["email", "last_name"])
