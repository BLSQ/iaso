from beanstalk_worker.services import TestTaskService
from hat.audit.models import ORG_UNIT_API_BULK, Modification
from iaso import models as m
from iaso.models import ERRORED, KILLED, QUEUED, SUCCESS
from iaso.permissions.core_permissions import CORE_DATA_TASKS_PERMISSION, CORE_ORG_UNITS_PERMISSION
from iaso.tests.graphql.base import GraphQLTestCase


BULK_UPDATE = """
mutation ($filters: OrgUnitFilter!, $update: OrgUnitBulkUpdate!) {
  bulkUpdateOrgUnits(filters: $filters, update: $update) {
    task { id name status createdBy { username } }
    errors { code message field }
  }
}
"""

TASK = """
query ($id: Int!, $afterId: Int) {
  task(id: $id) {
    id status progressValue endValue progressMessage result launcher { username }
    errors { message field ... on OrgUnitBulkUpdateError { code } }
  }
  taskLogs(taskId: $id, afterId: $afterId) { id message createdAt }
}
"""


class OrgUnitsBulkUpdateTestCase(GraphQLTestCase):
    """Districts of the North and South Regions, updated by a district supervisor (restricted to the North Region,
    editing districts only) or the national admin."""

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Ministry of Health")
        project = m.Project.objects.create(name="Census", app_id="census", account=account)
        source = m.DataSource.objects.create(name="National health facility registry")
        source.projects.add(project)
        cls.version = version = m.SourceVersion.objects.create(data_source=source, number=1)

        cls.region_type = m.OrgUnitType.objects.create(name="Region")
        cls.district_type = m.OrgUnitType.objects.create(name="District")
        cls.hf_type = m.OrgUnitType.objects.create(name="Health facility")
        for org_unit_type in (cls.region_type, cls.district_type, cls.hf_type):
            org_unit_type.projects.add(project)

        cls.north_region = m.OrgUnit.objects.create(name="North Region", org_unit_type=cls.region_type, version=version)
        cls.kanda_district = m.OrgUnit.objects.create(
            name="Kanda District", parent=cls.north_region, org_unit_type=cls.district_type, version=version
        )
        cls.bo_district = m.OrgUnit.objects.create(
            name="Bo District", parent=cls.north_region, org_unit_type=cls.district_type, version=version
        )
        cls.south_region = m.OrgUnit.objects.create(name="South Region", org_unit_type=cls.region_type, version=version)
        cls.river_district = m.OrgUnit.objects.create(
            name="River District", parent=cls.south_region, org_unit_type=cls.district_type, version=version
        )

        cls.public_facilities = m.Group.objects.create(name="Public facilities", source_version=version)
        cls.malaria_hotspots = m.Group.objects.create(name="Malaria hotspots", source_version=version)
        cls.malaria_hotspots.org_units.add(cls.kanda_district, cls.bo_district)
        other_source = m.DataSource.objects.create(name="Partner registry")
        cls.partner_group = m.Group.objects.create(
            name="Campaign 2024 sites",
            source_version=m.SourceVersion.objects.create(data_source=other_source, number=1),
        )

        cls.district_supervisor = cls.create_user_with_profile(
            username="district_supervisor",
            account=account,
            permissions=[CORE_ORG_UNITS_PERMISSION],
            org_units=[cls.north_region],
        )
        cls.district_supervisor.iaso_profile.editable_org_unit_types.add(cls.district_type)
        cls.national_admin = cls.create_user_with_profile(
            username="national_admin",
            account=account,
            permissions=[CORE_ORG_UNITS_PERMISSION, CORE_DATA_TASKS_PERMISSION],
        )
        cls.viewer = cls.create_user_with_profile(username="viewer", account=account, permissions=[])

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.district_supervisor)

    # -- helpers --

    def queued(self, filters=None, **update):
        payload = self.data(BULK_UPDATE, {"filters": filters or {}, "update": update})["bulkUpdateOrgUnits"]
        self.assertEqual(payload["errors"], [])
        self.assertEqual(payload["task"]["status"], QUEUED)
        return payload["task"]

    def run_tasks(self):
        TestTaskService().run_all()

    def ran(self, filters=None, status=SUCCESS, **update):
        """The task as `task(id:)` reads it once it ran, and its logs."""
        task = self.queued(filters, **update)
        self.run_tasks()
        data = self.execute(TASK, {"id": task["id"]})["data"]
        self.assertEqual(data["task"]["status"], status, data["task"])
        return data["task"], data["taskLogs"]

    def refused(self, filters=None, **update):
        """The payload's `errors`, as `(code, field, message)`, after checking no task was queued."""
        payload = self.data(BULK_UPDATE, {"filters": filters or {}, "update": update})["bulkUpdateOrgUnits"]
        self.assertIsNone(payload["task"])
        self.assertFalse(m.Task.objects.exists())
        return [(error["code"], error["field"], error["message"]) for error in payload["errors"]]

    def denied(self, code, **update):
        """A top-level GraphQL error (not about the input): its message."""
        body = self.execute(BULK_UPDATE, {"filters": {}, "update": update})
        (error,) = body["errors"]
        self.assertEqual(error["extensions"]["code"], code, error)
        self.assertFalse(m.Task.objects.exists())
        return error["message"]

    def task_errors(self, task):
        """A task's refusal: its `errors` as `(code, field, message)`."""
        self.assertTrue(task["progressMessage"].startswith("Nothing updated: "), task["progressMessage"])
        return [(error["code"], error["field"], error["message"]) for error in task["errors"]]

    def statuses(self, *org_units):
        return [m.OrgUnit.objects.get(pk=org_unit.pk).validation_status for org_unit in org_units]

    # -- the update --

    def test_validation_status_of_the_filtered_org_units(self):
        task, logs = self.ran({"orgUnitTypeId": self.district_type.id}, validationStatus="REJECTED")
        self.assertEqual(task["result"], {"result": SUCCESS, "data": {"updated": 2, "skipped": []}})
        self.assertEqual(task["progressMessage"], "2 org units updated")
        self.assertEqual(task["launcher"], {"username": "district_supervisor"})
        # within the user's org units only: not the South Region's district
        self.assertEqual(
            self.statuses(self.kanda_district, self.bo_district, self.river_district), ["REJECTED", "REJECTED", "NEW"]
        )
        self.assertEqual([log["message"] for log in logs][-1], "2 org units updated")

    def test_type_and_groups(self):
        self.ran(
            {"idIn": [self.kanda_district.id]},
            orgUnitTypeId=self.hf_type.id,
            groupIdsAdded=[self.public_facilities.id],
            groupIdsRemoved=[self.malaria_hotspots.id],
        )
        kanda_district = m.OrgUnit.objects.get(pk=self.kanda_district.pk)
        self.assertEqual(kanda_district.org_unit_type, self.hf_type)
        self.assertEqual(list(kanda_district.groups.all()), [self.public_facilities])
        self.assertEqual(list(self.bo_district.groups.all()), [self.malaria_hotspots])

    def test_each_update_is_logged(self):
        self.ran({"idIn": [self.kanda_district.id]}, validationStatus="VALID", orgUnitTypeId=self.hf_type.id)
        (modification,) = Modification.objects.filter(source=ORG_UNIT_API_BULK)
        self.assertEqual(modification.user, self.district_supervisor)
        self.assertEqual(modification.object_id, str(self.kanda_district.id))
        # as v1: the groups aren't part of an org unit's log entry
        self.assertEqual(modification.past_value[0]["fields"]["validation_status"], "NEW")
        self.assertEqual(modification.new_value[0]["fields"]["validation_status"], "VALID")
        self.assertEqual(modification.new_value[0]["fields"]["org_unit_type"], self.hf_type.id)

    def test_types_the_user_cant_edit_are_skipped(self):
        task, _logs = self.ran({}, validationStatus="VALID")  # the North Region is a region: not a district
        self.assertEqual(task["result"]["data"], {"updated": 2, "skipped": [self.north_region.id]})
        self.assertIn(f"1 skipped: of a type the user can't edit (ids {self.north_region.id})", task["progressMessage"])
        self.assertEqual(self.statuses(self.north_region, self.kanda_district), ["NEW", "VALID"])

    def test_filters_applied_when_the_task_runs(self):
        task = self.queued({"nameIContains": "o", "createdAtGte": "2000-01-01T00:00:00Z"}, validationStatus="VALID")
        params = m.Task.objects.get(pk=task["id"]).params["kwargs"]
        self.assertEqual(params["filters"], {"nameIContains": "o", "createdAtGte": "2000-01-01T00:00:00+00:00"})
        late = m.OrgUnit.objects.create(
            name="Lowland District", parent=self.north_region, org_unit_type=self.district_type, version=self.version
        )
        self.run_tasks()
        self.assertEqual(self.statuses(self.kanda_district, self.bo_district, late), ["NEW", "VALID", "VALID"])

    def test_all_or_nothing_read_only_source(self):
        self.version.data_source.read_only = True
        self.version.data_source.save()
        task, _logs = self.ran(
            {"idIn": [self.kanda_district.id, self.bo_district.id]}, status=ERRORED, validationStatus="VALID"
        )
        self.assertEqual(
            self.task_errors(task),
            [
                (
                    "NOT_EDITABLE",
                    ["filters"],
                    f"Org units in a read-only source: ids {self.kanda_district.id}, {self.bo_district.id}",
                )
            ],
        )
        self.assertEqual(task["result"]["errors"][0]["code"], "NOT_EDITABLE")
        self.assertEqual(self.statuses(self.kanda_district, self.bo_district), ["NEW", "NEW"])
        self.assertFalse(Modification.objects.exists())

    def test_killed_task_updates_nothing(self):
        task = self.queued({}, validationStatus="VALID")
        m.Task.objects.filter(pk=task["id"]).update(should_be_killed=True)
        self.run_tasks()
        self.assertEqual(m.Task.objects.get(pk=task["id"]).status, KILLED)
        self.assertEqual(self.statuses(self.kanda_district, self.bo_district), ["NEW", "NEW"])

    def test_nothing_matches(self):
        task, _logs = self.ran({"name": "East Region"}, validationStatus="VALID")
        self.assertEqual(task["result"]["data"], {"updated": 0, "skipped": []})

    # -- moves --

    def test_move_under_another_parent(self):
        self.client.force_authenticate(self.national_admin)
        river_clinic = m.OrgUnit.objects.create(
            name="River Clinic", parent=self.river_district, org_unit_type=self.hf_type, version=self.version
        )
        task, _logs = self.ran({"idIn": [self.river_district.id]}, parentId=self.north_region.id)
        self.assertEqual(task["result"]["data"], {"updated": 1, "skipped": []})
        river_district = m.OrgUnit.objects.get(pk=self.river_district.pk)
        self.assertEqual(river_district.parent, self.north_region)
        self.assertEqual(list(river_district.path), [str(self.north_region.id), str(river_district.id)])
        # its descendants follow
        river_clinic = m.OrgUnit.objects.get(pk=river_clinic.pk)
        self.assertEqual(
            list(river_clinic.path), [str(self.north_region.id), str(river_district.id), str(river_clinic.id)]
        )
        (modification,) = Modification.objects.filter(source=ORG_UNIT_API_BULK)
        self.assertEqual(modification.past_value[0]["fields"]["parent"], self.south_region.id)
        self.assertEqual(modification.new_value[0]["fields"]["parent"], self.north_region.id)

    def test_no_move_under_itself_or_a_descendant(self):
        self.client.force_authenticate(self.national_admin)
        task, _logs = self.ran(
            {"idIn": [self.north_region.id, self.river_district.id]}, status=ERRORED, parentId=self.kanda_district.id
        )
        self.assertEqual(
            self.task_errors(task),
            [
                (
                    "INVALID",
                    ["update", "parentId"],
                    (
                        f"Org units can't move under themselves or one of their descendants ({self.kanda_district.id}): "
                        f"ids {self.north_region.id}"
                    ),
                )
            ],
        )
        # all or nothing
        self.assertEqual(m.OrgUnit.objects.get(pk=self.river_district.pk).parent, self.south_region)
        self.assertIsNone(m.OrgUnit.objects.get(pk=self.north_region.pk).parent)

    def test_no_move_to_another_source_version(self):
        self.client.force_authenticate(self.national_admin)
        version_2 = m.SourceVersion.objects.create(data_source=self.version.data_source, number=2)
        east_region = m.OrgUnit.objects.create(name="East Region", org_unit_type=self.region_type, version=version_2)
        task, _logs = self.ran({"idIn": [east_region.id]}, status=ERRORED, parentId=self.north_region.id)
        self.assertEqual([code for code, _field, _message in self.task_errors(task)], ["INVALID"])
        self.assertIsNone(m.OrgUnit.objects.get(pk=east_region.pk).parent)

    def test_every_refusal_of_the_task_at_once(self):
        self.client.force_authenticate(self.national_admin)
        self.version.data_source.read_only = True
        self.version.data_source.save()
        version_2 = m.SourceVersion.objects.create(data_source=self.version.data_source, number=2)
        east_region = m.OrgUnit.objects.create(name="East Region", org_unit_type=self.region_type, version=version_2)
        task, _logs = self.ran(
            {"idIn": [self.north_region.id, east_region.id]}, status=ERRORED, parentId=self.kanda_district.id
        )
        self.assertEqual(
            [(code, field) for code, field, _message in self.task_errors(task)],
            [
                ("NOT_EDITABLE", ["filters"]),
                ("INVALID", ["update", "parentId"]),
                ("INVALID", ["update", "parentId"]),
            ],
        )

    # -- refused before queuing --

    def test_refusals(self):
        (nothing,) = self.refused({})
        self.assertEqual(nothing[:2], ("INVALID", ["update"]))
        self.assertIn("a parentId", nothing[2])
        self.assertEqual(self.refused({}, validationStatus=None)[0][:2], ("INVALID", ["update"]))
        self.assertEqual(
            self.refused({}, orgUnitTypeId=self.hf_type.id + 100),
            [
                (
                    "NOT_FOUND",
                    ["update", "orgUnitTypeId"],
                    f"Org unit type {self.hf_type.id + 100} does not exist",
                )
            ],
        )
        self.assertEqual(
            self.refused({}, groupIdsAdded=[self.public_facilities.id, self.partner_group.id]),
            [("NOT_FOUND", ["update", "groupIdsAdded", "1"], f"Group {self.partner_group.id} does not exist")],
        )
        self.assertEqual(
            self.refused(
                {},
                groupIdsAdded=[self.malaria_hotspots.id],
                groupIdsRemoved=[self.public_facilities.id, self.malaria_hotspots.id],
            ),
            [
                (
                    "INVALID",
                    ["update", "groupIdsRemoved", "1"],
                    f"Group {self.malaria_hotspots.id} is both added and removed",
                )
            ],
        )
        # a parent the user can't see
        self.assertEqual(
            self.refused({}, parentId=self.river_district.id),
            [("NOT_FOUND", ["update", "parentId"], f"Org unit {self.river_district.id} does not exist")],
        )
        # a filter on an org unit the user can't see
        self.assertEqual(
            self.refused({"ancestorId": self.south_region.id}, validationStatus="VALID"),
            [("INVALID", ["filters", "ancestorId"], f"Org unit {self.south_region.id} does not exist")],
        )

    def test_every_refusal_at_once(self):
        refusals = self.refused(
            {"ancestorId": self.south_region.id, "locationWithinBbox": {"minx": 0, "miny": 10, "maxx": 1, "maxy": 5}},
            orgUnitTypeId=self.hf_type.id + 100,
            parentId=self.river_district.id,
            groupIdsAdded=[self.malaria_hotspots.id],
            groupIdsRemoved=[self.malaria_hotspots.id],
        )
        self.assertEqual(
            [(code, field) for code, field, _message in refusals],
            [
                ("NOT_FOUND", ["update", "parentId"]),
                ("NOT_FOUND", ["update", "orgUnitTypeId"]),
                ("INVALID", ["update", "groupIdsRemoved", "0"]),
                ("INVALID", ["filters", "ancestorId"]),
                ("INVALID", ["filters", "locationWithinBbox"]),
            ],
        )

    def test_permission(self):
        self.client.force_authenticate(self.viewer)
        self.assertIn("permission", self.denied("FORBIDDEN", validationStatus="VALID"))
        self.client.logout()
        self.denied("UNAUTHENTICATED", validationStatus="VALID")

    def test_one_per_operation(self):
        body = self.execute(
            "mutation { a: bulkUpdateOrgUnits(filters: {}, update: {validationStatus: VALID}) { errors { code } } "
            "b: bulkUpdateOrgUnits(filters: {}, update: {validationStatus: NEW}) { errors { code } } }"
        )
        self.assertIn("At most 1 `bulkUpdateOrgUnits` per operation", body["errors"][0]["message"])
        self.assertFalse(m.Task.objects.exists())

    # -- following the task --

    def test_logs_after_an_id(self):
        _task, logs = self.ran({}, validationStatus="VALID")
        self.assertGreater(len(logs), 1)
        task_id = m.Task.objects.get().id
        newer = self.execute(TASK, {"id": task_id, "afterId": logs[0]["id"]})["data"]["taskLogs"]
        self.assertEqual(newer, logs[1:])

    def test_tasks_of_others(self):
        task = self.queued({}, validationStatus="VALID")
        # without the "data tasks" permission, only one's own tasks
        self.client.force_authenticate(self.viewer)
        self.assertEqual(self.execute(TASK, {"id": task["id"]})["data"], {"task": None, "taskLogs": []})
        self.client.force_authenticate(self.national_admin)
        self.assertEqual(self.execute(TASK, {"id": task["id"]})["data"]["task"]["id"], task["id"])
