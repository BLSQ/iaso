from typing import Any

from django.urls import reverse
from rest_framework import status
from rest_framework.settings import api_settings

from iaso.models import (
    Account,
    DataSource,
    Group,
    OrgUnit,
    OrgUnitType,
    Planning,
    PlanningConfig,
    Project,
    SourceVersion,
    Team,
)
from iaso.permissions.core_permissions import CORE_PLANNING_WRITE_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class PlanningConfigCreateAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        # create accounts
        cls.account = Account.objects.create(name="account")

        cls.data_source = DataSource.objects.create(name="Test Data Source")
        cls.source_version = SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account.default_version = cls.source_version
        cls.account.save()

        cls.other_account = Account.objects.create(name="other_account")
        cls.data_source_other_account = DataSource.objects.create(name="Test Data Source 2")
        cls.source_version_other_account = SourceVersion.objects.create(
            data_source=cls.data_source_other_account, number=1
        )
        cls.other_account.default_version = cls.source_version_other_account
        cls.other_account.save()

        # set up users
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account, permissions=[])
        cls.user_write_perm = cls.create_user_with_profile(
            username="user_read_perm", account=cls.account, permissions=[CORE_PLANNING_WRITE_PERMISSION]
        )
        cls.user_other_perm = cls.create_user_with_profile(
            username="user_other_perm", account=cls.account, permissions=[CORE_SUBMISSIONS_PERMISSION]
        )
        cls.superuser = cls.create_user_with_profile(
            username="superuser", account=cls.account, is_superuser=True, is_staff=True
        )

        cls.user_other_account = cls.create_user_with_profile(
            username="user_other_account", account=cls.other_account, is_superuser=True, is_staff=True
        )

        # Create test project
        cls.project = Project.objects.create(name="Test Project", app_id="test.app", account=cls.account)
        cls.project2 = Project.objects.create(name="Test Project2", app_id="test.app2", account=cls.account)
        cls.project_other_account = Project.objects.create(
            name="Test Project other account", app_id="test.app.other_account", account=cls.other_account
        )

        cls.data_source.projects.add(cls.project)
        cls.data_source_other_account.projects.add(cls.project_other_account)

        # Create test org unit types
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type")
        # setting up two projects to be sure that the queryset in serializer PK field is returning distinct values
        cls.org_unit_type.projects.set([cls.project, cls.project2])

        cls.org_unit_type_2 = OrgUnitType.objects.create(name="Test Country Type 2")
        cls.org_unit_type_2.projects.set([cls.project])

        cls.org_unit_type_other_account = OrgUnitType.objects.create(name="Test Country Type 3")
        cls.org_unit_type_other_account.projects.set([cls.project_other_account])

        # Create test org unit
        cls.ou = OrgUnit.objects.create(
            name="Test Country", org_unit_type=cls.org_unit_type, version=cls.source_version
        )
        cls.org_unit_group = Group.objects.create(name="Test country", source_version=cls.source_version)
        cls.org_unit_group_2 = Group.objects.create(name="Test Country", source_version=cls.source_version)
        cls.org_unit_group_other_account = Group.objects.create(
            name="Test Country", source_version=cls.source_version_other_account
        )

        # Create test team
        cls.team = Team.objects.create(name="Test Team", project=cls.project, manager=cls.superuser)
        cls.team_other_account = Team.objects.create(
            name="Test Team Other Account", project=cls.project_other_account, manager=cls.user_other_account
        )

        # create plannings

        cls.planning = Planning.objects.create(name="planning", project=cls.project, team=cls.team, org_unit=cls.ou)

        cls.planning_other_account = Planning.objects.create(
            name="planning_other_account",
            project=cls.project_other_account,
            team=cls.team_other_account,
            org_unit=cls.ou,
        )

    def assertValidBody(self, body: Any) -> None:
        self.assertResponseCompliantToSwagger(body, "PlanningConfigCreateRequest")

    def assertValidResponse(self, data: Any):
        self.assertResponseCompliantToSwagger(data, "PlanningConfigCreate")

    def test_permissions(self):
        res = self.client.post(reverse("planning_configs-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.post(reverse("planning_configs-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.post(reverse("planning_configs-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_write_perm)
        res = self.client.post(reverse("planning_configs-list"), data={})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        self.client.force_authenticate(self.superuser)
        res = self.client.post(reverse("planning_configs-list"), data={})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_num_queries(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "planning": self.planning.id,
            "level": 1,
            "org_unit_types": [self.org_unit_type.id, self.org_unit_type_2.id],
            "org_unit_groups": [self.org_unit_group.id, self.org_unit_group_2.id],
        }
        self.assertValidBody(data)
        with self.assertNumQueries(23):
            res = self.client.post(reverse("planning_configs-list"), data=data)

        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)

        self.assertValidResponse(res_data)

        # check that the planning config was created
        planning_config = PlanningConfig.objects.get(pk=res_data["id"])

        self.assertEqual(planning_config.level, 1)
        self.assertEqual(planning_config.planning_id, self.planning.pk)
        self.assertCountEqual(
            planning_config.org_unit_types.values_list("id", flat=True),
            [self.org_unit_type.id, self.org_unit_type_2.id],
        )
        self.assertCountEqual(
            planning_config.org_unit_groups.values_list("id", flat=True),
            [self.org_unit_group.id, self.org_unit_group_2.id],
        )

    def test_validation_errors(self):
        self.client.force_authenticate(self.superuser)
        with self.subTest("planning other account"):
            data = {"planning": self.planning_other_account.pk, "level": 1}
            self.assertValidBody(data)
            res = self.client.post(reverse("planning_configs-list"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

            self.assertHasError(res_data, "planning")

        with self.subTest("planning invalid pk"):
            data = {"planning": Planning.objects.order_by("-id").first().pk + 1, "level": 1}
            self.assertValidBody(data)
            res = self.client.post(reverse("planning_configs-list"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

            self.assertHasError(res_data, "planning")

        with self.subTest("level"):
            for level in [0, -1]:
                data = {"planning": self.planning.pk, "level": level}
                # self.assertValidBody(data) # will fail obviously
                res = self.client.post(reverse("planning_configs-list"), data=data)
                res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

                self.assertHasError(res_data, "level")

        with self.subTest("org unit type out of account"):
            data = {"planning": self.planning.pk, "level": 1, "org_unit_types": [self.org_unit_type_other_account.pk]}
            self.assertValidBody(data)
            res = self.client.post(reverse("planning_configs-list"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

            self.assertHasError(res_data, "org_unit_types")

        with self.subTest("org unit group out of account"):
            data = {"planning": self.planning.pk, "level": 1, "org_unit_groups": [self.org_unit_group_other_account.pk]}
            self.assertValidBody(data)
            res = self.client.post(reverse("planning_configs-list"), data=data)
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

            self.assertHasError(res_data, "org_unit_groups")

    def test_level_and_planning_uniqueness(self):
        # create a planning config
        PlanningConfig.objects.create(level=1, planning=self.planning)

        self.client.force_authenticate(self.superuser)
        data = {"planning": self.planning.id, "level": 1}
        self.assertValidBody(data)
        res = self.client.post(reverse("planning_configs-list"), data=data)

        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
        self.assertHasError(
            res_data, api_settings.NON_FIELD_ERRORS_KEY, "The fields planning, level must make a unique set."
        )

    def test_happy_path(self):
        self.client.force_authenticate(self.superuser)
        data = {
            "planning": self.planning.id,
            "level": 1,
            "org_unit_types": [self.org_unit_type.id, self.org_unit_type_2.id],
            "org_unit_groups": [self.org_unit_group.id, self.org_unit_group_2.id],
        }
        self.assertValidBody(data)
        res = self.client.post(reverse("planning_configs-list"), data=data)

        res_data = self.assertJSONResponse(res, status.HTTP_201_CREATED)

        self.assertValidResponse(res_data)

        # check that the planning config was created
        planning_config = PlanningConfig.objects.get(pk=res_data["id"])

        self.assertEqual(planning_config.level, 1)
        self.assertEqual(planning_config.planning_id, self.planning.pk)

        self.assertCountEqual(
            planning_config.org_unit_types.values_list("id", flat=True),
            [self.org_unit_type.id, self.org_unit_type_2.id],
        )
        self.assertCountEqual(
            planning_config.org_unit_groups.values_list("id", flat=True),
            [self.org_unit_group.id, self.org_unit_group_2.id],
        )
