import unittest

from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from django.utils.timezone import now
from rest_framework import status

from iaso.models import (
    Account,
    Assignment,
    DataSource,
    Form,
    MissionForm,
    MissionFormThroughForm,
    OrgUnit,
    OrgUnitType,
    Planning,
    SourceVersion,
    Team,
)
from iaso.test import APITestCase


@unittest.skip("V1 has been disabled")
class V1MobilePlanningListAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = account = Account.objects.create(name="test")
        cls.user = user = cls.create_user_with_profile(username="test", account=cls.account)
        cls.project1 = project1 = account.project_set.create(name="project1")
        cls.team1 = team1 = Team.objects.create(project=project1, name="team1", manager=user)
        source = DataSource.objects.create(name="Source de test")
        source.projects.add(project1)
        version = SourceVersion.objects.create(data_source=source, number=1)
        cls.org_unit_type = org_unit_type = OrgUnitType.objects.create(name="test type")
        cls.root_org_unit = root_org_unit = OrgUnit.objects.create(
            version=version,
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.child1 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child1",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child2 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child2",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child3 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child3",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child4 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child4",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )
        cls.child5 = OrgUnit.objects.create(
            version=version,
            parent=root_org_unit,
            name="child4",
            org_unit_type=org_unit_type,
            validation_status=OrgUnit.VALIDATION_VALID,
        )

        cls.form1 = Form.objects.create(name="form1")
        cls.form2 = Form.objects.create(name="form2")
        cls.form1.projects.add(project1)
        cls.form1.org_unit_types.add(org_unit_type)
        cls.form2.projects.add(project1)
        cls.form2.org_unit_types.add(org_unit_type)

        cls.mission1 = MissionForm.objects.create(
            name="mission1",
            account=account,
        )
        MissionFormThroughForm.objects.create(
            mission_form=cls.mission1, form=cls.form1, min_cardinality=1, max_cardinality=1
        )
        cls.mission2 = MissionForm.objects.create(
            name="mission2",
            account=account,
        )
        MissionFormThroughForm.objects.create(
            mission_form=cls.mission2, form=cls.form2, min_cardinality=1, max_cardinality=1
        )

        cls.planning = planning = Planning.objects.create(
            project=project1,
            name="planning1",
            team=cls.team1,
            org_unit=root_org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-10",
        )
        planning.target_org_unit_types.set([org_unit_type])
        Assignment.objects.create(
            planning=planning,
            user=cls.user,
            org_unit=cls.child1,
        )

        p = Planning.objects.create(
            project=project1,
            name="planning2",
            team=team1,
            org_unit=root_org_unit,
            started_at="2025-01-01",
            ended_at="2025-01-10",
            published_at="2025-01-01",
        )
        p.missions.set([cls.mission1, cls.mission2])
        p.assignment_set.create(org_unit=cls.child1, user=cls.user)
        p.assignment_set.create(org_unit=cls.child2, user=cls.user)

        # This one should not be returned because started_at is None
        p4 = Planning.objects.create(
            project=project1,
            name="planning4",
            team=team1,
            org_unit=root_org_unit,
            started_at=None,
            ended_at="2025-01-10",
        )
        p4.assignment_set.create(org_unit=cls.child3, user=cls.user)
        p4.assignment_set.create(org_unit=cls.child4, user=cls.user)

        # This one should not be returned because ended_at is None
        p5 = Planning.objects.create(
            project=project1,
            name="planning5",
            team=team1,
            org_unit=root_org_unit,
            started_at="2025-01-10",
            ended_at=None,
        )
        p5.assignment_set.create(org_unit=cls.child3, user=user)
        p5.assignment_set.create(org_unit=cls.child4, user=user)

        Planning.objects.filter(assignment__user=user).distinct()
        Planning.objects.update(published_at=now())

    def test_permissions(self):
        res = self.client.get(reverse("mobileplanning-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("mobileplanning-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.user)
        ContentType.objects.clear_cache()

        with self.assertNumQueries(9):
            res = self.client.get(reverse("mobileplanning-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        plannings = res_data["plannings"]
        self.assertEqual(len(plannings), 2)

    def test_list(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(reverse("mobileplanning-list"))
        r = self.assertJSONResponse(response, status.HTTP_200_OK)
        plannings = r["plannings"]
        self.assertEqual(len(plannings), 2)
        # planning 1
        p1 = plannings[0]
        self.assertEqual(p1["name"], "planning1")
        self.assertEqual(p1["assignments"], [{"org_unit_id": self.child1.id, "form_ids": []}])

        p2 = plannings[1]
        self.assertEqual(p2["name"], "planning2")
        self.assertEqual(
            p2["assignments"],
            [
                {"org_unit_id": self.child1.id, "form_ids": [self.form1.pk, self.form2.pk]},
                {"org_unit_id": self.child2.id, "form_ids": [self.form1.pk, self.form2.pk]},
            ],
        )
        # Response look like
        # [
        #     {
        #         "id": 161,
        #         "name": "planning1",
        #         "description": "",
        #         "created_at": "2022-05-25T16:00:37.029707Z",
        #         "assignments": [{"org_unit": 3557, "form_ids": []}],
        #     },
        #     {
        #         "id": 162,
        #         "name": "planning2",
        #         "description": "",
        #         "created_at": "2022-05-25T16:00:37.034614Z",
        #         "assignments": [{"org_unit": 3557, "form_ids": []}, {"org_unit": 3558, "form_ids": []}],
        #     },
        # ]

        # user without any assignment, should get no planning
        user = self.create_user_with_profile(username="user2", account=self.account)
        self.client.force_authenticate(user)

        response = self.client.get(reverse("mobileplanning-list"))
        r = self.assertJSONResponse(response, 200)
        self.assertEqual(len(r["plannings"]), 0)
