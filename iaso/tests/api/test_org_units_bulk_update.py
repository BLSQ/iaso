from django.contrib.gis.geos import Polygon, Point, MultiPolygon
from django.test import tag


from iaso import models as m
from hat.audit import models as am
from iaso.test import APITestCase
from iaso.models import Task

from beanstalk_worker import task_service


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
        sw_version_2 = m.SourceVersion.objects.create(data_source=sw_source, number=1)
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

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_org_units"])
        cls.luke = cls.create_user_with_profile(
            username="luke", account=star_wars, permissions=["iaso_org_units"], org_units=[cls.jedi_council_endor]
        )
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_org_units"])

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

    @classmethod
    def setUp(cls):
        task_service.clear()

    @tag("iaso_only")
    def test_org_unit_bulkupdate_not_authenticated(self):
        """POST /orgunits/bulkupdate, no auth -> 403"""

        response = self.client.post(
            f"/api/tasks/create/orgunitsbulkupdate/",
            data={"select_all": True, "validation_status": m.OrgUnit.VALIDATION_REJECTED},
            format="json",
        )
        self.assertJSONResponse(response, 403)

        self.assertEqual(len(task_service.queue), 0)

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
        self.assertEqual(len(task_service.queue), 1)
        task_service.run_all()
        self.assertEqual(len(task_service.queue), 0)

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

        response = self.client.get("/api/tasks/%d/" % data["task"]["id"])
        self.assertEqual(response.status_code, 200)
        task = self.assertValidTaskAndInDB(response.json(), "ERRORED")
        self.assertEqual(task.result["message"], "No matching org unit found")

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
        self.assertEqual(len(task_service.queue), 1)
        task_service.run_all()
        self.assertEqual(len(task_service.queue), 0)

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertEqual(jedi_council.validation_status, m.OrgUnit.VALIDATION_VALID)

        response = self.client.get("/api/tasks/%d/" % data["task"]["id"])
        self.assertEqual(response.status_code, 200)
        task = self.assertValidTaskAndInDB(response.json(), "ERRORED")
        self.assertEqual(task.result["message"], "No matching org unit found")

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
        self.assertEqual(len(task_service.queue), 1)
        task_service.run_all()
        self.assertEqual(len(task_service.queue), 0)

        self.jedi_council_corruscant.refresh_from_db()
        self.assertEqual(self.jedi_council_corruscant.validation_status, m.OrgUnit.VALIDATION_REJECTED)
        self.assertNotIn(self.elite_group, self.jedi_council_corruscant.groups.all())

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels]:
            jedi_council.refresh_from_db()
            self.assertTrue(jedi_council.validated)

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(3, am.Modification.objects.count())

        # Task completion status
        response = self.client.get("/api/tasks/%d/" % data["task"]["id"])
        self.assertEqual(response.status_code, 200)
        self.assertValidTaskAndInDB(response.json(), "SUCCESS")

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

        self.assertEqual(len(task_service.queue), 1)
        task_service.run_all()
        self.assertEqual(len(task_service.queue), 0)

        for jedi_council in [self.jedi_council_endor, self.jedi_council_brussels, self.jedi_council_corruscant]:
            jedi_council.refresh_from_db()
            self.assertIn(self.another_group, jedi_council.groups.all())

        self.assertEqual(1, m.BulkOperation.objects.count())
        self.assertEqual(5, am.Modification.objects.count())

        response = self.client.get("/api/tasks/%d/" % data["task"]["id"])
        self.assertEqual(response.status_code, 200)
        self.assertValidTaskAndInDB(response.json(), "SUCCESS")

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

        task_model = Task.objects.get(id=data["task"]["id"])
        task_model.should_be_killed = True
        task_model.save()

        self.assertEqual(len(task_service.queue), 1)
        task_service.run_all()
        self.assertEqual(len(task_service.queue), 0)

        response = self.client.get("/api/tasks/%d/" % data["task"]["id"])
        self.assertEqual(response.status_code, 200)
        self.assertValidTaskAndInDB(response.json(), "KILLED")

    def assertValidTaskAndInDB(self, task_dict, status="QUEUED", name=None):
        self.assertEqual(task_dict["status"], status)

        task = Task.objects.get(id=task_dict["id"])
        self.assertTrue(task)
        if name:
            self.assertEqual(task.name, name)
        return task
