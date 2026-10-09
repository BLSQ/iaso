from typing import Any

from django.urls import reverse
from rest_framework import status

from iaso.models import (
    Account,
    EntityType,
    Form,
    MissionEntityType,
    MissionForm,
    MissionFormThroughForm,
    MissionOrgUnitType,
    OrgUnit,
    OrgUnitType,
    Planning,
    Project,
    Team,
)
from iaso.permissions.core_permissions import CORE_PLANNING_READ_PERMISSION, CORE_SUBMISSIONS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class PlanningMissionAPITestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpClass(cls) -> None:
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

        cls.planning_other_account = Planning.objects.create(
            name="planning_other_account",
            project=cls.project_other_account,
            team=cls.team_other_account,
            org_unit=cls.org_unit,
        )

        # create missions

        # entity types
        cls.et = EntityType.objects.create(name="et", account=cls.account)
        cls.et_2 = EntityType.objects.create(name="et2", account=cls.account)
        cls.et_3 = EntityType.objects.create(name="et3", account=cls.account)

        # out

        cls.out = OrgUnitType.objects.create(name="out")
        cls.out_2 = OrgUnitType.objects.create(name="out2")
        cls.out_3 = OrgUnitType.objects.create(name="out2")

        cls.out.projects.add(cls.project)
        cls.out_2.projects.add(cls.project)

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
                    mission_form=cls.mission_form_1, form=cls.form_3, min_cardinality=3, max_cardinality=3
                ),
            ]
        )

        cls.mission_out_1 = MissionOrgUnitType.objects.create(
            name="mission_out_1", account=cls.account, org_unit_type=cls.out, min_cardinality=1, max_cardinality=3
        )
        cls.mission_out_2 = MissionOrgUnitType.objects.create(
            name="mission_out_2", account=cls.account, org_unit_type=cls.out_2, min_cardinality=2, max_cardinality=4
        )

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(
                    mission_form=cls.mission_out_1, form=cls.form_1, min_cardinality=1, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_out_1, form=cls.form_2, min_cardinality=2, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_out_2, form=cls.form_3, min_cardinality=3, max_cardinality=3
                ),
            ]
        )

        cls.mission_et_1 = MissionEntityType.objects.create(
            name="mission_et_1", account=cls.account, entity_type=cls.et
        )
        cls.mission_et_2 = MissionEntityType.objects.create(
            name="mission_et_2", account=cls.account, entity_type=cls.et_2
        )

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(
                    mission_form=cls.mission_et_1, form=cls.form_1, min_cardinality=1, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_et_1, form=cls.form_2, min_cardinality=2, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_et_2, form=cls.form_3, min_cardinality=3, max_cardinality=3
                ),
            ]
        )

        cls.planning.missions.set(
            [
                cls.mission_form_1,
                cls.mission_form_2,
                cls.mission_out_1,
                cls.mission_out_2,
                cls.mission_et_1,
                cls.mission_et_2,
            ]
        )

    def assertValidData(self, res_data: Any, expected_length: int) -> None:
        self.assertResponseCompliantToSwagger(res_data, "PaginatedPlanningMissionPolymorphicListList")
        self.assertEqual(len(res_data["results"]), expected_length)

    def test_permissions(self) -> None:
        res = self.client.get(reverse("planning-missions", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user_no_perm)
        res = self.client.get(reverse("planning-missions", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_other_perm)
        res = self.client.get(reverse("planning-missions", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.user_read_perm)
        res = self.client.get(reverse("planning-missions", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-missions", kwargs={"pk": self.planning.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self) -> None:
        self.client.force_authenticate(self.superuser)
        with self.assertNumQueries(6):
            res = self.client.get(reverse("planning-missions", kwargs={"pk": self.planning.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, expected_length=6)

    def test_should_raise_a_404_if_planning_does_not_exist(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-missions", kwargs={"pk": 1000}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_raise_a_404_if_planning_does_not_belong_to_user(self):
        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-missions", kwargs={"pk": self.planning_other_account.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_response(self) -> None:
        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("planning-missions", kwargs={"pk": self.planning.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 6)
        results = res_data["results"]

        first_result = results[0]
        self.assertEqual(first_result["id"], self.mission_form_1.id)
        self.assertEqual(first_result["name"], "mission_form_1")
        self.assertEqual(first_result["mission_type"], MissionForm.MISSION_TYPE)
        self.assertIsNotNone(first_result["created_at"])

        second_result = results[1]
        self.assertEqual(second_result["id"], self.mission_form_2.id)
        self.assertEqual(second_result["name"], "mission_form_2")
        self.assertEqual(second_result["mission_type"], MissionForm.MISSION_TYPE)
        self.assertIsNotNone(second_result["created_at"])

        third_result = results[2]
        self.assertEqual(third_result["id"], self.mission_out_1.pk)
        self.assertEqual(third_result["name"], "mission_out_1")
        self.assertEqual(third_result["mission_type"], MissionOrgUnitType.MISSION_TYPE)
        self.assertEqual(third_result["org_unit_type"], {"id": self.out.pk, "name": "out"})
        self.assertIsNotNone(third_result["created_at"])

        fourth_result = results[3]
        self.assertEqual(fourth_result["id"], self.mission_out_2.pk)
        self.assertEqual(fourth_result["name"], "mission_out_2")
        self.assertEqual(fourth_result["mission_type"], MissionOrgUnitType.MISSION_TYPE)
        self.assertEqual(fourth_result["org_unit_type"], {"id": self.out_2.pk, "name": "out2"})
        self.assertIsNotNone(fourth_result["created_at"])

        fifth_result = results[4]
        self.assertEqual(fifth_result["id"], self.mission_et_1.pk)
        self.assertEqual(fifth_result["name"], "mission_et_1")
        self.assertEqual(fifth_result["mission_type"], MissionEntityType.MISSION_TYPE)
        self.assertEqual(fifth_result["entity_type"], {"id": self.et.pk, "name": "et"})
        self.assertIsNotNone(fifth_result["created_at"])

        sixth_result = results[5]
        self.assertEqual(sixth_result["id"], self.mission_et_2.pk)
        self.assertEqual(sixth_result["name"], "mission_et_2")
        self.assertEqual(sixth_result["mission_type"], MissionEntityType.MISSION_TYPE)
        self.assertEqual(sixth_result["entity_type"], {"id": self.et_2.pk, "name": "et2"})
        self.assertIsNotNone(sixth_result["created_at"])
