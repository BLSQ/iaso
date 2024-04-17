from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Polygon, Point, MultiPolygon
from django.test import tag

from beanstalk_worker.services import TestTaskService
from hat.audit import models as am
from iaso import models as m
from iaso.models import Task, QUEUED
from iaso.test import APITestCase


class OrgUnitsBulkUpdateAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="MCU")
        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )
        sw_source = m.DataSource.objects.create(name="Evil Empire")
        sw_source.projects.add(cls.project)
        cls.sw_source = sw_source
        sw_version_1 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=2)
        star_wars.default_version = sw_version_1
        star_wars.save()

        cls.jedi_squad = m.OrgUnitType.objects.create(name="Jedi Squad", short_name="Jds")

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_council.sub_unit_types.add(cls.jedi_squad)

        cls.mock_multipolygon = MultiPolygon(Polygon([[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]))
        cls.mock_point = Point(x=4, y=50, z=100)

        cls.elite_group = m.Group.objects.create(name="Elite councils")
        cls.unofficial_group = m.Group.objects.create(name="Unofficial Jedi councils")
        cls.another_group = m.Group.objects.create(name="Another group")

        cls.jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Corruscant Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="PvtAI4RUMkr",
        )
        cls.jedi_council_corruscant.groups.set([cls.elite_group])

        cls.jedi_council_endor = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_1,
            name="Endor Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        cls.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=cls.jedi_council_endor,
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
            source_ref="F9w3VW1cQmb",
        )
        cls.jedi_squad_endor = m.OrgUnit.objects.create(
            parent=cls.jedi_council_endor,
            org_unit_type=cls.jedi_squad,
            version=sw_version_1,
            name="Endor Jedi Squad 1",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.jedi_council_brussels = m.OrgUnit.objects.create(
            org_unit_type=cls.jedi_council,
            version=sw_version_2,
            name="Brussels Jedi Council",
            geom=cls.mock_multipolygon,
            simplified_geom=cls.mock_multipolygon,
            catchment=cls.mock_multipolygon,
            location=cls.mock_point,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=star_wars, permissions=["iaso_org_units", "iaso_data_tasks"]
        )
        cls.luke = cls.create_user_with_profile(
            username="luke", account=star_wars, permissions=["iaso_org_units"], org_units=[cls.jedi_council_endor]
        )
        cls.raccoon = cls.create_user_with_profile(
            username="raccoon", account=marvel, permissions=["iaso_org_units", "iaso_data_tasks"]
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

        cls.create_form_instance(
            form=cls.form_1, period="202003", org_unit=cls.jedi_council_corruscant, project=cls.project
        )

    @tag("iaso_only")
    def test_org_unit_bulkupdate_not_authenticated(self):
        """POST /orgunits/bulkupdate, no auth -> 401"""

        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={"select_all": True, "validation_status": m.OrgUnit.VALIDATION_REJECTED},
            format="json",
        )
        self.assertJSONResponse(response, 401)

        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_some_wrong_account(self):
        """POST /orgunits/bulkupdate (authenticated user, but no access to specified org units)"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={
                "select_all": False,
                "selected_ids": [self.jedi_council_brussels.pk, self.jedi_council_endor.pk],
                "validation_status": m.OrgUnit.VALIDATION_REJECTED,
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_bulk_update")
        self.assertEqual(task.launcher, self.raccoon)

        # Run the task
        task = self.runAndValidateTask(task, "ERRORED")
        self.assertEqual(task.result["message"], "No matching org unit found")

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_wrong_account(self):
        """POST /orgunits/bulkupdate (authenticated user, but no access any org unit)"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={"select_all": True, "validation_status": m.OrgUnit.VALIDATION_REJECTED},
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_bulk_update")
        self.assertEqual(task.launcher, self.raccoon)

        # Run the task
        task = self.runAndValidateTask(task, "ERRORED")
        self.assertEqual(task.result["message"], "No matching org unit found")

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_some(self):
        """POST /orgunits/bulkupdate happy path"""

        self.client.force_authenticate(self.yoda)
        operation_payload = {
            "select_all": False,
            "selected_ids": [self.jedi_council_brussels.pk, self.jedi_council_endor.pk],
            "groups_added": [self.unofficial_group.pk],
            "validation_status": m.OrgUnit.VALIDATION_REJECTED,
        }
        response = self.client.post(f"/api/tasks/create/orgunitsbulkupdate/", data=operation_payload, format="json")

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_REJECTED)
            self.assertIn(self.unofficial_group, jedi_council.groups.all())

        self.jedi_council_corruscant.refresh_from_db()
        self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_REJECTED)
        self.assertNotIn(self.unofficial_group, self.jedi_council_corruscant.groups.all())

        self.assertEqual(2, am.Modification.objects.count())

        modification_endor = am.Modification.objects.get(object_id=self.jedi_council_endor.pk)
        self.assertEqual(ContentType.objects.get_for_model(m.OrgUnit), modification_endor.content_type)
        self.assertEqual(self.yoda, modification_endor.user)
        self.assertEqual(am.ORG_UNIT_API_BULK, modification_endor.source)
        self.assertEqual(m.OrgUnit.VALIDATION_VALID, modification_endor.past_value[0]["fields"]["validation_status"])
        self.assertEqual(m.OrgUnit.VALIDATION_REJECTED, modification_endor.new_value[0]["fields"]["validation_status"])

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all(self):
        """POST /orgunits/bulkupdate happy path (select all)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={"select_all": True, "validation_status": m.OrgUnit.VALIDATION_VALID},
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        for jedi_council in [self.jedi_council_endor, self.jedi_council_corruscant, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

        self.assertEqual(5, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_select_all_with_search(self):
        """POST /orgunits/bulkupdate happy path (select all, but with search)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={
                "select_all": True,
                "validation_status": m.OrgUnit.VALIDATION_REJECTED,
                "searches": [{"group": f"{self.elite_group.pk}"}],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.jedi_council_corruscant.refresh_from_db()
        self.assertEqual(self.jedi_council_corruscant.validation_status, m.OrgUnit.VALIDATION_REJECTED)

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

        self.assertEqual(1, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_task_select_all_but_some(self):
        """POST /orgunits/bulkupdate/ happy path (select all except some)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={
                "select_all": True,
                "validation_status": m.OrgUnit.VALIDATION_REJECTED,
                "unselected_ids": [self.jedi_council_brussels.pk, self.jedi_council_endor.pk],
                "groups_removed": [self.elite_group.pk],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        # Run the task
        self.runAndValidateTask(task, "SUCCESS")

        self.jedi_council_corruscant.refresh_from_db()
        self.assertEqual(self.jedi_council_corruscant.validation_status, m.OrgUnit.VALIDATION_REJECTED)
        self.assertNotIn(self.elite_group, self.jedi_council_corruscant.groups.all())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertTrue(jedi_council.validated)

        self.assertEqual(3, am.Modification.objects.count())

    @tag("iaso_only")
    def test_org_unit_bulkupdate_task_select_all_with_multiple_searches(self):
        """POST /orgunits/bulkupdate happy path (select all, but with multiple searches)"""
        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={
                "select_all": True,
                "groups_added": [self.another_group.pk],
                "searches": [{"validation_status": "all"}, {"validation_status": m.OrgUnit.VALIDATION_REJECTED}],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)
        data = response.json()
        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_bulk_update")
        self.assertEqual(task.launcher, self.yoda)

        self.runAndValidateTask(task, "SUCCESS")

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertIn(self.another_group, jedi_council.groups.all())

        self.assertEqual(5, am.Modification.objects.count())

    def test_task_kill(self):
        """Launch the task and then kill it
        Note this actually doesn't work if it's killwed while in the transaction part.
        """

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={
                "select_all": True,
                "groups_added": [self.another_group.pk],
                "searches": [{"validation_status": "all"}, {"validation_status": m.OrgUnit.VALIDATION_REJECTED}],
            },
            format="json",
        )

        self.assertJSONResponse(response, 201)
        data = response.json()
        self.assertValidTaskAndInDB(data["task"])

        task = Task.objects.get(id=data["task"]["id"])
        task.should_be_killed = True
        task.save()

        self.runAndValidateTask(task, "KILLED")

    def runAndValidateTask(self, task, new_status):
        "Run all task in queue and validate that task is run"
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 1)
        task_service = TestTaskService()
        task_service.run_all()
        self.assertEqual(Task.objects.filter(status=QUEUED).count(), 0)

        response = self.client.get("/api/tasks/%d/" % task.id)
        self.assertEqual(response.status_code, 200)
        # Task completion status
        return self.assertValidTaskAndInDB(response.json(), new_status)

    def assertValidTaskAndInDB(self, task_dict, status="QUEUED", name=None):
        self.assertEqual(task_dict["status"], status, task_dict)

        task = Task.objects.get(id=task_dict["id"])
        self.assertTrue(task)
        if name:
            self.assertEqual(task.name, name)

        return task
