from django.urls import reverse
from rest_framework import status

from iaso.models import (
    Account,
    Form,
    MissionForm,
    MissionFormThroughForm,
    OrgUnit,
    OrgUnitType,
    Planning,
    Project,
    Team,
)
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class PlanningDropdownTestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
        super(APITestCase, cls).setUpClass()
        # create account
        cls.account = Account.objects.create(name="Account")
        cls.other_account = Account.objects.create(name="OtherAccount")

        # set up users
        cls.user_no_perm = cls.create_user_with_profile(username="user_no_perm", account=cls.account, permissions=[])
        cls.user_read_perm = cls.create_user_with_profile(
            username="user_read_perm", account=cls.account, permissions=[CORE_PLANNING_READ_PERMISSION]
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
        cls.project_other_account = Project.objects.create(
            name="Test Project other account", app_id="test.app.other_account", account=cls.other_account
        )

        # Create test org unit type
        cls.org_unit_type = OrgUnitType.objects.create(name="Test Country Type")
        cls.org_unit_type.projects.set([cls.project, cls.project_other_account])

        # Create test org unit
        cls.org_unit = OrgUnit.objects.create(name="Test Country", org_unit_type=cls.org_unit_type)

        # Create test team
        cls.team = Team.objects.create(name="Test Team", project=cls.project, manager=cls.superuser)
        cls.team_other_account = Team.objects.create(
            name="Test Team Other Account", project=cls.project_other_account, manager=cls.user_other_account
        )

        # set up some data for the plannings
        cls.planning = Planning.objects.create(
            name="planning", project=cls.project, team=cls.team, org_unit=cls.org_unit
        )
        cls.planning_2 = Planning.objects.create(
            name="planning_2", project=cls.project, team=cls.team, org_unit=cls.org_unit
        )
        cls.planning_3 = Planning.objects.create(
            name="planning_3", project=cls.project, team=cls.team, org_unit=cls.org_unit
        )
        cls.planning_4 = Planning.objects.create(
            name="planning_4", project=cls.project, team=cls.team, org_unit=cls.org_unit
        )

        cls.planning_other_account = Planning.objects.create(
            name="planning_other_account",
            project=cls.project_other_account,
            team=cls.team_other_account,
            org_unit=cls.org_unit,
        )

        # missions

        # forms
        cls.form_1 = Form.objects.create(name="form_1")
        cls.form_2 = Form.objects.create(name="form_2")
        cls.form_3 = Form.objects.create(name="form_3")

        cls.form_1.projects.add(cls.project)
        cls.form_2.projects.add(cls.project)
        cls.form_3.projects.add(cls.project)

        # missions
        cls.mission_form_1 = MissionForm.objects.create(name="mission_form_1", account=cls.account)
        cls.mission_form_2 = MissionForm.objects.create(name="mission_form_2", account=cls.account)

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(
                    mission_form=cls.mission_form_1, form=cls.form_1, min_cardinality=1, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_1, form=cls.form_2, min_cardinality=2, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_2, form=cls.form_3, min_cardinality=3, max_cardinality=3
                ),
            ]
        )

        cls.planning.missions.add(cls.mission_form_1)
        cls.planning_2.missions.add(cls.mission_form_2)

    def assertValidData(self, response, expected_length):
        self.assertEqual(len(response), expected_length)
        self.assertResponseCompliantToSwagger(response, "PlanningDropdown", True)

    def test_num_queries(self):
        self.client.force_authenticate(user=self.superuser)
        with self.assertNumQueries(1):
            res = self.client.get(reverse("planning-dropdown"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 4)

    def test_permissions(self):
        res = self.client.get(reverse("planning-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.get(reverse("planning-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.get(reverse("planning-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_read_perm)
        res = self.client.get(reverse("planning-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-dropdown"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_filters(self):
        self.client.force_authenticate(user=self.superuser)
        with self.subTest("ordering"):
            res = self.client.get(reverse("planning-dropdown"), data={"order": "-name"})
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidData(res_data, 4)

            self.assertEqual(
                res_data,
                [
                    {"value": p.id, "label": p.name}
                    for p in [self.planning_4, self.planning_3, self.planning_2, self.planning]
                ],
            )

        with self.subTest("form_ids"):
            res = self.client.get(reverse("planning-dropdown"), data={"form_ids": f"{self.form_1.pk}"})
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidData(res_data, 1)

            self.assertEqual(res_data, [{"value": self.planning.id, "label": self.planning.name}])

            res = self.client.get(reverse("planning-dropdown"), data={"form_ids": f"{self.form_1.pk},{self.form_2.pk}"})
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidData(res_data, 1)

            self.assertEqual(res_data, [{"value": self.planning.id, "label": self.planning.name}])

            res = self.client.get(reverse("planning-dropdown"), data={"form_ids": f"{self.form_1.pk},{self.form_3.pk}"})
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidData(res_data, 2)

            self.assertEqual(
                res_data,
                [
                    {"value": self.planning.id, "label": self.planning.name},
                    {"value": self.planning_2.id, "label": self.planning_2.name},
                ],
            )

            res = self.client.get(reverse("planning-dropdown"), data={"form_ids": "1000"})
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidData(res_data, 0)

    def test_should_see_plannings_related_to_account(self):
        self.client.force_authenticate(self.user_other_account)
        res = self.client.get(reverse("planning-dropdown"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)

        self.assertEqual(
            res_data, [{"value": self.planning_other_account.id, "label": self.planning_other_account.name}]
        )

    def test_response(self):
        self.client.force_authenticate(user=self.superuser)
        res = self.client.get(reverse("planning-dropdown"), data={"ordering": "-name"})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 4)

        self.assertEqual(
            res_data,
            [
                {"value": p.id, "label": p.name}
                for p in [self.planning, self.planning_2, self.planning_3, self.planning_4]
            ],
        )
