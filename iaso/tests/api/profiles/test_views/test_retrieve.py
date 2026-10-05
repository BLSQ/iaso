import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import override_settings
from django.urls import reverse
from rest_framework import status

from iaso.models import AccountFeatureFlag, OrgUnit, TenantUser, UserRole
from iaso.tests.api.profiles.test_views.common import BaseProfileAPITestCase


class ProfileRetrieveAPITestCase(BaseProfileAPITestCase):
    def setUp(self):
        super().setUp()
        self.other_account_user = self.create_user_with_profile(username="other", account=self.another_account)

        group = Group.objects.create(name=f"{self.account.id}_Data manager")
        self.user_role = user_role = UserRole.objects.create(group=group, account=self.account)
        user_role.editable_org_unit_types.add(self.parent_org_unit_type)
        self.jane.iaso_profile.user_roles.set([user_role])

        # multi tenant account

        # Create a main user without profile
        main_user = get_user_model().objects.create(
            username="main_user", first_name="main", last_name="user", email="mainuser@me.com"
        )

        # And 2 account users with profile
        self.account_user_ghi = self.create_user_with_profile(username="User_A", account=self.account)
        TenantUser.objects.create(main_user=main_user, account_user=self.account_user_ghi)
        TenantUser.objects.create(main_user=main_user, account_user=self.jane)
        self.account_user_wha = self.create_user_with_profile(username="User_B", account=self.another_account)
        TenantUser.objects.create(main_user=main_user, account_user=self.account_user_wha)
        TenantUser.objects.create(main_user=main_user, account_user=self.other_account_user)

        # account feature flags
        self.aff = AccountFeatureFlag.objects.create(code="shape", name="Can edit shape")
        AccountFeatureFlag.objects.create(code="not-used", name="this is not used")
        self.account.feature_flags.add(self.aff)

        # editable OUT
        self.jane.iaso_profile.editable_org_unit_types.add(self.parent_org_unit_type)

    def assertValidData(self, data):
        self.assertResponseCompliantToSwagger(data, "ProfileRetrieve")

    def test_permissions(self):
        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # no particular permissions : CORE_USERS_ADMIN_PERMISSION or CORE_USERS_MANAGED_PERMISSION
        self.client.force_authenticate(self.jane)
        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.john.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # superuser
        self.client.force_authenticate(self.john)
        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.john.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.other_account_user.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # CORE_USERS_ADMIN_PERMISSIONS : same as superuser
        self.client.force_authenticate(self.jim)
        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.john.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.other_account_user.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # CORE_USERS_MANAGED_PERMISSION: same as superuser for retrieve
        self.client.force_authenticate(self.jam)
        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.john.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        res = self.client.get(reverse("profiles-detail", kwargs={"pk": self.other_account_user.iaso_profile.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_num_queries(self):
        self.client.force_authenticate(self.jane)

        with self.assertNumQueries(12):
            response = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))

        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(response_data)

    @override_settings(
        USER_MANUAL_PATH="https://www.openiaso.com/user-manual/",
        FORUM_PATH="https://forum.example.com/",
    )
    def test_account_paths_fallback_to_settings_when_empty(self):
        self.account.user_manual_path = ""
        self.account.forum_path = None
        self.account.save(update_fields=["user_manual_path", "forum_path"])

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(
            response_data["account"]["user_manual_path"],
            settings.USER_MANUAL_PATH,
        )
        self.assertEqual(response_data["account"]["forum_path"], settings.FORUM_PATH)

    def test_account_feature_flags_is_included(self):
        self.client.force_authenticate(self.jane)

        response = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(response_data)

        self.assertIn("account", response_data)

        self.assertEqual(response_data["account"]["feature_flags"], ["shape"])

        # remove feature flags
        self.account.feature_flags.remove(self.aff)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(response_data)
        self.assertIn("account", response_data)

        self.assertEqual(response_data["account"]["feature_flags"], [])

    def test_retrieve_profile_ok(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertValidData(response_data)

        self.assertCountEqual(
            response_data.keys(),
            [
                "id",
                "first_name",
                "user_name",
                "last_name",
                "email",
                "date_joined",
                "permissions",
                "user_permissions",
                "is_staff",
                "is_superuser",
                "user_roles",
                "user_roles_permissions",
                "language",
                "organization",
                "user_id",
                "dhis2_id",
                "home_page",
                "phone_number",
                "country_code",
                "projects",
                "other_accounts",
                "editable_org_unit_types",
                "user_roles_editable_org_unit_type_ids",
                "color",
                "account",
                "org_units",
            ],
        )

        self.assertEqual(response_data["id"], self.jane.iaso_profile.id)
        self.assertEqual(response_data["first_name"], "main")
        self.assertEqual(response_data["user_name"], "main_user")
        self.assertEqual(response_data["last_name"], "user")
        self.assertEqual(response_data["email"], "mainuser@me.com")
        self.assertIsNotNone(response_data["date_joined"])
        self.assertEqual(response_data["permissions"], ["iaso_forms"])
        self.assertEqual(response_data["user_permissions"], ["iaso_forms"])
        self.assertFalse(response_data["is_staff"])
        self.assertFalse(response_data["is_superuser"])
        self.assertEqual(response_data["user_roles"], [self.user_role.pk])
        self.assertEqual(
            response_data["user_roles_permissions"],
            [
                {
                    "id": self.user_role.pk,
                    "name": re.sub(r"^\d+_", "", self.user_role.group.name),
                    "group_id": self.user_role.group_id,
                    "created_at": self.user_role.created_at.timestamp(),
                    "updated_at": self.user_role.updated_at.timestamp(),
                }
            ],
        )
        self.assertEqual(response_data["language"], "en")
        self.assertIsNone(response_data["organization"])
        self.assertEqual(response_data["user_id"], self.jane.pk)
        self.assertIsNone(response_data["dhis2_id"])
        self.assertIsNone(response_data["phone_number"])
        self.assertIsNone(response_data["country_code"])
        self.assertEqual(
            response_data["projects"],
            [
                {
                    "id": self.project.pk,
                    "name": "Hydroponic gardens",
                    "app_id": "stars.empire.agriculture.hydroponics",
                    "color": "#1976D2",
                }
            ],
        )

        self.assertCountEqual(
            response_data["other_accounts"],
            [
                {
                    "name": self.account.name,
                    "id": self.account.pk,
                    "created_at": self.account.created_at.timestamp(),
                    "updated_at": self.account.updated_at.timestamp(),
                    "default_version": {
                        "data_source": {
                            "name": self.datasource.name,
                            "description": self.datasource.description,
                            "id": self.datasource.pk,
                            "url": None,
                            "created_at": self.datasource.created_at.timestamp(),
                            "updated_at": self.datasource.updated_at.timestamp(),
                            "tree_config_status_fields": [],
                        },
                        "number": self.account.default_version.number,
                        "description": self.account.default_version.description,
                        "id": self.account.default_version.pk,
                        "created_at": self.account.default_version.created_at.timestamp(),
                        "updated_at": self.account.default_version.updated_at.timestamp(),
                    },
                    "feature_flags": ["shape"],
                    "user_manual_path": "",
                    "forum_path": "",
                    "analytics_script": None,
                },
                {
                    "name": self.another_account.name,
                    "id": self.another_account.pk,
                    "created_at": self.another_account.created_at.timestamp(),
                    "updated_at": self.another_account.updated_at.timestamp(),
                    "default_version": None,
                    "feature_flags": [],
                    "user_manual_path": "",
                    "forum_path": "",
                    "analytics_script": None,
                },
            ],
        )

        self.assertEqual(
            response_data["editable_org_unit_types"],
            [
                {
                    "id": self.parent_org_unit_type.pk,
                    "name": self.parent_org_unit_type.name,
                }
            ],
        )

        self.assertEqual(
            response_data["user_roles_editable_org_unit_type_ids"],
            [self.parent_org_unit_type.pk],
        )

        self.assertEqual(response_data["color"], "#1976D2")

        self.assertEqual(
            response_data["account"],
            {
                "name": self.account.name,
                "id": self.account.pk,
                "created_at": self.account.created_at.timestamp(),
                "updated_at": self.account.updated_at.timestamp(),
                "default_version": {
                    "data_source": {
                        "name": self.datasource.name,
                        "description": self.datasource.description,
                        "id": self.datasource.pk,
                        "url": None,
                        "created_at": self.datasource.created_at.timestamp(),
                        "updated_at": self.datasource.updated_at.timestamp(),
                        "tree_config_status_fields": [],
                    },
                    "number": self.account.default_version.number,
                    "description": self.account.default_version.description,
                    "id": self.account.default_version.pk,
                    "created_at": self.account.default_version.created_at.timestamp(),
                    "updated_at": self.account.default_version.updated_at.timestamp(),
                },
                "feature_flags": ["shape"],
                "user_manual_path": "",
                "forum_path": "",
                "analytics_script": None,
                "modules": self.MODULES,
            },
        )

        self.assertEqual(
            response_data["org_units"],
            [
                {
                    "name": self.child_org_unit.name,
                    "short_name": self.child_org_unit.name,
                    "id": self.child_org_unit.pk,
                    "source": self.datasource.name,
                    "source_id": self.datasource.pk,
                    "source_ref": self.child_org_unit.source_ref,
                    "parent_id": self.org_unit_from_parent_type.pk,
                    "org_unit_type_id": self.parent_org_unit_type.pk,
                    "org_unit_type_name": self.parent_org_unit_type.name,
                    "org_unit_type_depth": None,
                    "created_at": self.child_org_unit.created_at.timestamp(),
                    "updated_at": self.child_org_unit.updated_at.timestamp(),
                    "aliases": None,
                    "validation_status": OrgUnit.VALIDATION_VALID,
                    "has_geo_json": False,
                    "version": self.child_org_unit.version.number,
                    "opening_date": None,
                    "closed_date": None,
                }
            ],
        )

    def test_retrieve_profile_user_roles_permissions_do_not_include_account_prefix(self):
        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("profiles-detail", kwargs={"pk": self.jane.iaso_profile.pk}))
        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertEqual(response_data["user_roles_permissions"][0]["name"], "Data manager")
