from uuid import uuid4

from iaso import models as m
from iaso.models.microplanning import Planning
from iaso.models.team import Team
from iaso.test import APITestCase


APP_ID = "mission.import.test"


class InstanceImportMissionTestCase(APITestCase):
    """
    POST /api/instances/ : storage and validation of `missionId` and `planningId`.

    This endpoint is wrapped in @safe_api_import: it always returns a 200 and must
    never strand a batch of submissions. Validation therefore never raises; invalid
    references (another account, unknown id, mission not in planning, form not part
    of the mission...) null the FK, keep the submission and log. Tenancy breaches
    log at ERROR level, business-rule races (a planner editing a planning after a
    device has queued submissions) at WARNING level.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        cls.project = m.Project.objects.create(name="Project", app_id=APP_ID, account=cls.account)
        source = m.DataSource.objects.create(name="Source")
        source.projects.add(cls.project)
        cls.version = m.SourceVersion.objects.create(data_source=source, number=1)
        cls.account.default_version = cls.version
        cls.account.save()

        cls.user = cls.create_user_with_profile(username="user", account=cls.account)

        cls.org_unit_type = m.OrgUnitType.objects.create(name="Health facility")
        cls.sub_org_unit_type = m.OrgUnitType.objects.create(name="Health post")
        cls.org_unit_type.sub_unit_types.add(cls.sub_org_unit_type)

        cls.org_unit = m.OrgUnit.objects.create(
            name="OU",
            org_unit_type=cls.org_unit_type,
            version=cls.version,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.form = m.Form.objects.create(name="form")
        cls.form.projects.add(cls.project)
        cls.form.org_unit_types.add(cls.org_unit_type)
        cls.other_form = m.Form.objects.create(name="other form")
        cls.other_form.projects.add(cls.project)

        cls.team = Team.objects.create(project=cls.project, name="team", manager=cls.user)
        cls.planning = Planning.objects.create(
            project=cls.project,
            name="planning",
            team=cls.team,
            org_unit=cls.org_unit,
            started_at="2026-01-01",
            ended_at="2026-12-31",
        )

        cls.mission_form = m.MissionForm.objects.create(name="mission form", account=cls.account)
        m.MissionFormThroughForm.objects.create(mission_form=cls.mission_form, form=cls.form)
        cls.mission_org_unit_type = m.MissionOrgUnitType.objects.create(
            name="mission out", account=cls.account, org_unit_type=cls.org_unit_type
        )
        cls.entity_type = m.EntityType.objects.create(name="entity type", account=cls.account)
        cls.mission_entity_type = m.MissionEntityType.objects.create(
            name="mission entity", account=cls.account, entity_type=cls.entity_type
        )
        cls.planning.missions.set([cls.mission_form, cls.mission_org_unit_type, cls.mission_entity_type])

        # Another account, used for the tenancy tests.
        cls.other_account = m.Account.objects.create(name="Other account")
        cls.other_mission = m.MissionForm.objects.create(name="other mission", account=cls.other_account)
        other_project = m.Project.objects.create(name="Other project", app_id="other.app", account=cls.other_account)
        other_team = Team.objects.create(project=other_project, name="other team", manager=cls.user)
        cls.other_planning = Planning.objects.create(
            project=other_project,
            name="other planning",
            team=other_team,
            org_unit=cls.org_unit,
        )

    def post_instance(self, **extra):
        instance_uuid = str(uuid4())
        body = [
            {
                "id": instance_uuid,
                "file": f"/storage/emulated/0/odk/instances/{instance_uuid}.xml",
                "name": "submission",
                "orgUnitId": self.org_unit.id,
                "formId": self.form.id,
                **extra,
            }
        ]
        self.client.force_authenticate(self.user)
        response = self.client.post(f"/api/instances/?app_id={APP_ID}", data=body, format="json")
        return response, instance_uuid

    def get_instance(self, instance_uuid):
        return m.Instance.objects.get(uuid=instance_uuid)

    def test_no_mission_id_no_planning_id(self):
        """Older app versions send neither: both FKs stay null."""
        response, instance_uuid = self.post_instance()
        self.assertEqual(response.status_code, 200)
        instance = self.get_instance(instance_uuid)
        self.assertIsNone(instance.planning)
        self.assertIsNone(instance.mission)

    def test_valid_planning_id(self):
        response, instance_uuid = self.post_instance(planningId=self.planning.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.get_instance(instance_uuid).planning, self.planning)

    def test_planning_from_another_account_is_refused(self):
        """The submission is saved but never linked to another account's planning."""
        response, instance_uuid = self.post_instance(planningId=self.other_planning.id)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(self.get_instance(instance_uuid).planning)
        self.assertEqual(m.Instance.objects.filter(planning=self.other_planning).count(), 0)

    def test_unknown_planning_is_refused(self):
        response, instance_uuid = self.post_instance(planningId=987654)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(self.get_instance(instance_uuid).planning)

    def test_soft_deleted_planning_is_refused(self):
        deleted_planning = Planning.objects.create(
            project=self.project,
            name="deleted planning",
            team=self.team,
            org_unit=self.org_unit,
        )
        deleted_planning.delete()

        response, instance_uuid = self.post_instance(planningId=deleted_planning.id)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(self.get_instance(instance_uuid).planning)

    def test_mission_from_another_account_is_refused(self):
        """The submission is saved but never linked to another account's mission."""
        response, instance_uuid = self.post_instance(planningId=self.planning.id, missionId=self.other_mission.id)
        self.assertEqual(response.status_code, 200)
        instance = self.get_instance(instance_uuid)
        self.assertEqual(instance.planning, self.planning)
        self.assertIsNone(instance.mission)
        self.assertEqual(m.Instance.objects.filter(mission=self.other_mission).count(), 0)

    def test_form_filling_mission_happy_path(self):
        response, instance_uuid = self.post_instance(planningId=self.planning.id, missionId=self.mission_form.id)
        self.assertEqual(response.status_code, 200)
        instance = self.get_instance(instance_uuid)
        self.assertEqual(instance.planning, self.planning)
        self.assertEqual(instance.mission_id, self.mission_form.id)

    def test_mission_without_planning_is_nulled(self):
        response, instance_uuid = self.post_instance(missionId=self.mission_form.id)
        self.assertEqual(response.status_code, 200)
        instance = self.get_instance(instance_uuid)
        self.assertIsNone(instance.planning)
        self.assertIsNone(instance.mission)

    def test_mission_not_in_planning_is_nulled(self):
        lone_mission = m.MissionForm.objects.create(name="lone mission", account=self.account)
        m.MissionFormThroughForm.objects.create(mission_form=lone_mission, form=self.form)

        response, instance_uuid = self.post_instance(planningId=self.planning.id, missionId=lone_mission.id)
        self.assertEqual(response.status_code, 200)
        instance = self.get_instance(instance_uuid)
        self.assertEqual(instance.planning, self.planning)
        self.assertIsNone(instance.mission)

    def test_form_filling_mission_with_unrelated_form_is_nulled(self):
        """The submitted form is not one the FORM_FILLING mission asks for."""
        response, instance_uuid = self.post_instance(
            planningId=self.planning.id, missionId=self.mission_form.id, formId=self.other_form.id
        )
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(self.get_instance(instance_uuid).mission)

    def test_org_unit_type_mission_happy_path(self):
        response, instance_uuid = self.post_instance(
            planningId=self.planning.id, missionId=self.mission_org_unit_type.id
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.get_instance(instance_uuid).mission_id, self.mission_org_unit_type.id)

    def test_org_unit_type_mission_sub_type_match(self):
        """The mission targets a sub unit type of the submission's org unit type."""
        sub_mission = m.MissionOrgUnitType.objects.create(
            name="sub mission", account=self.account, org_unit_type=self.sub_org_unit_type
        )
        self.planning.missions.add(sub_mission)

        response, instance_uuid = self.post_instance(planningId=self.planning.id, missionId=sub_mission.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.get_instance(instance_uuid).mission_id, sub_mission.id)

    def test_org_unit_type_mission_mismatch_is_nulled(self):
        """The mission targets an org unit type unrelated to the submission's."""
        unrelated_type = m.OrgUnitType.objects.create(name="Unrelated type")
        unrelated_mission = m.MissionOrgUnitType.objects.create(
            name="unrelated mission", account=self.account, org_unit_type=unrelated_type
        )
        self.planning.missions.add(unrelated_mission)

        response, instance_uuid = self.post_instance(planningId=self.planning.id, missionId=unrelated_mission.id)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(self.get_instance(instance_uuid).mission)

    def test_invalid_reference_does_not_strand_the_batch(self):
        """One submission with a cross-account planning must not prevent the others from being saved."""
        good_uuid = str(uuid4())
        bad_uuid = str(uuid4())
        body = [
            {
                "id": bad_uuid,
                "file": f"/storage/{bad_uuid}.xml",
                "name": "bad",
                "orgUnitId": self.org_unit.id,
                "formId": self.form.id,
                "planningId": self.other_planning.id,
            },
            {
                "id": good_uuid,
                "file": f"/storage/{good_uuid}.xml",
                "name": "good",
                "orgUnitId": self.org_unit.id,
                "formId": self.form.id,
                "planningId": self.planning.id,
                "missionId": self.mission_form.id,
            },
        ]
        self.client.force_authenticate(self.user)
        response = self.client.post(f"/api/instances/?app_id={APP_ID}", data=body, format="json")
        self.assertEqual(response.status_code, 200)

        self.assertIsNone(self.get_instance(bad_uuid).planning)
        good = self.get_instance(good_uuid)
        self.assertEqual(good.planning, self.planning)
        self.assertEqual(good.mission_id, self.mission_form.id)

    def test_entity_type_mission_is_always_assigned(self):
        response, instance_uuid = self.post_instance(planningId=self.planning.id, missionId=self.mission_entity_type.id)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.get_instance(instance_uuid).mission_id, self.mission_entity_type.id)
