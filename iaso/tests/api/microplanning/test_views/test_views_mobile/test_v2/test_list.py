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
    MissionOrgUnitType,
    OrgUnit,
    OrgUnitType,
    Planning,
    SourceVersion,
    Team,
)
from iaso.test import APITestCase


class V2MobilePlanningListAPITestCase(APITestCase):
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

        p6 = Planning.objects.create(
            project=project1,
            name="planning6",
            team=team1,
            org_unit=root_org_unit,
            started_at="2025-01-10",
            ended_at="2025-01-10",
        )
        p6.assignment_set.create(org_unit=cls.child1, user=user)
        cls.mission = mission = MissionOrgUnitType.objects.create(
            name="mission3",
            description="description3",
            account=account,
            org_unit_type=org_unit_type,
            min_cardinality=2,
            max_cardinality=4,
        )
        p6.missions.set([mission])

        Planning.objects.filter(assignment__user=user).distinct()
        Planning.objects.update(published_at=now())

    def assertValidData(self, data, expected_length: int):
        self.assertValidListData(
            list_data=data, expected_length=expected_length, paginated=True, results_key="plannings"
        )

    def test_v1_upgrade_required(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(reverse("mobileplanning-list"))
        self.assertJSONResponse(response, status.HTTP_426_UPGRADE_REQUIRED)

    def test_permissions(self):
        res = self.client.get(reverse("v2_mobileplanning-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.user)
        res = self.client.get(reverse("v2_mobileplanning-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.user)
        ContentType.objects.clear_cache()

        with self.assertNumQueries(14):
            res = self.client.get(reverse("v2_mobileplanning-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidData(res_data, 3)

    def test_list(self):
        self.assertEqual(Planning.objects.filter(assignment__user=self.user).distinct().count(), 5)

        self.client.force_authenticate(self.user)

        response = self.client.get(reverse("v2_mobileplanning-list"))
        r = self.assertJSONResponse(response, 200)
        self.assertValidData(r, 3)
        plannings = r["plannings"]

        # planning 1
        p1 = plannings[0]
        self.assertEqual(p1["name"], "planning6")
        self.assertEqual(len(p1["assignments"]), 1)

        self.assertEqual(
            p1["assignments"],
            [
                {
                    "org_unit_id": self.child1.id,
                    "missions": [
                        {
                            "id": self.mission.id,
                            "name": self.mission.name,
                            "description": self.mission.description,
                            "mission_type": "ORG_UNIT_AND_FORM",
                            "org_unit_type": {
                                "id": self.org_unit_type.id,
                                "name": "test type",
                            },
                            "min_cardinality": 2,
                            "max_cardinality": 4,
                            "mission_forms": [],
                        }
                    ],
                }
            ],
        )

        p2 = plannings[1]
        self.assertEqual(p2["name"], "planning2")
        self.assertEqual(len(p2["assignments"]), 2)

        self.assertEqual(
            p2["assignments"],
            [
                {
                    "org_unit_id": self.child1.id,
                    "missions": [
                        {
                            "id": self.mission1.id,
                            "name": self.mission1.name,
                            "description": self.mission1.description,
                            "mission_type": "FORM_FILLING",
                            "mission_forms": [
                                {
                                    "form": {"id": self.form1.id, "name": self.form1.name},
                                    "min_cardinality": 1,
                                    "max_cardinality": 1,
                                }
                            ],
                        },
                        {
                            "id": self.mission2.id,
                            "name": self.mission2.name,
                            "description": self.mission2.description,
                            "mission_type": "FORM_FILLING",
                            "mission_forms": [
                                {
                                    "form": {"id": self.form2.id, "name": self.form2.name},
                                    "min_cardinality": 1,
                                    "max_cardinality": 1,
                                }
                            ],
                        },
                    ],
                },
                {
                    "org_unit_id": self.child2.id,
                    "missions": [
                        {
                            "id": self.mission1.id,
                            "name": self.mission1.name,
                            "description": self.mission1.description,
                            "mission_type": "FORM_FILLING",
                            "mission_forms": [
                                {
                                    "form": {"id": self.form1.id, "name": self.form1.name},
                                    "min_cardinality": 1,
                                    "max_cardinality": 1,
                                }
                            ],
                        },
                        {
                            "id": self.mission2.id,
                            "name": self.mission2.name,
                            "description": self.mission2.description,
                            "mission_type": "FORM_FILLING",
                            "mission_forms": [
                                {
                                    "form": {"id": self.form2.id, "name": self.form2.name},
                                    "min_cardinality": 1,
                                    "max_cardinality": 1,
                                }
                            ],
                        },
                    ],
                },
            ],
        )

        p3 = plannings[2]

        self.assertEqual(p3["name"], "planning1")
        self.assertEqual(len(p3["assignments"]), 0)

        # user without any assignment, should get no planning
        user = self.create_user_with_profile(username="user2", account=self.account)
        self.client.force_authenticate(user)

        response = self.client.get(reverse("v2_mobileplanning-list"), format="json")
        r = self.assertJSONResponse(response, 200)
        self.assertValidData(r, 0)
