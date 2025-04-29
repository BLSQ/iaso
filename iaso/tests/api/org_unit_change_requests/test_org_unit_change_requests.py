import csv
import datetime
import io

from decimal import Decimal

import time_machine

from iaso import models as m
from iaso.api.org_unit_change_requests.views import OrgUnitChangeRequestViewSet
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase
from iaso.utils.models.common import get_creator_name


class OrgUnitChangeRequestAPITestCase(TaskAPITestCase):
    """
    Test actions on the ViewSet.
    """

    DT = datetime.datetime(2023, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        org_unit = m.OrgUnit.objects.create(
            org_unit_type=org_unit_type,
            version=version,
            source_ref="112244",
            uuid="1539f174-4c53-499c-85de-7a58458c49ef",
            closed_date=cls.DT.date(),
        )

        # Create a bunch of related objects. This is useful to detect N+1.
        group_1 = m.Group.objects.create(name="Group 1", source_version=version)
        group_2 = m.Group.objects.create(name="Group 2", source_version=version)
        group_3 = m.Group.objects.create(name="Group 3", source_version=version)
        org_unit.groups.add(group_1, group_2, group_3)

        form_1 = m.Form.objects.create(name="Form 1")
        form_2 = m.Form.objects.create(name="Form 2")
        form_3 = m.Form.objects.create(name="Form 3")
        instance_1 = m.Instance.objects.create(form=form_1, org_unit=org_unit)
        instance_2 = m.Instance.objects.create(form=form_2, org_unit=org_unit)
        instance_3 = m.Instance.objects.create(form=form_3, org_unit=org_unit)
        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, form=form_1, instance=instance_1)
        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, form=form_2, instance=instance_2)
        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, form=form_3, instance=instance_3)

        account = m.Account.objects.create(name="Account", default_version=version)
        project = m.Project.objects.create(name="Project", account=account, app_id="foo.bar.baz")
        user = cls.create_user_with_profile(username="user", account=account)
        user_with_review_perm = cls.create_user_with_profile(
            username="user_with_review_perm", account=account, permissions=["iaso_org_unit_change_request_review"]
        )

        data_source.projects.set([project])
        org_unit_type.projects.set([project])
        user.iaso_profile.org_units.set([org_unit])

        cls.form_3 = form_3
        cls.instance_1 = instance_1
        cls.instance_2 = instance_2
        cls.instance_3 = instance_3
        cls.org_unit = org_unit
        cls.org_unit_type = org_unit_type
        cls.project = project
        cls.user = user
        cls.user_with_review_perm = user_with_review_perm
        cls.version = version

    def test_list_ok(self):
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Bar")

        self.client.force_authenticate(self.user)

        with self.assertNumQueries(13):
            # filter_for_user_and_app_id
            #   1. OrgUnit exists() => SELECT 1 AS "a"
            # get_queryset
            #   2. SELECT user Projects IDs
            #   3. COUNT(*)
            #   4. SELECT OrgUnitChangeRequest
            # prefetch
            #   5. PREFETCH OrgUnit.groups
            #   6. PREFETCH OrgUnit.reference_instances__form
            #   7. PREFETCH OrgUnitChangeRequest.new_groups
            #   8. PREFETCH OrgUnitChangeRequest.old_groups
            #   9. PREFETCH OrgUnitChangeRequest.new_reference_instances__form
            #  10. PREFETCH OrgUnitChangeRequest.old_reference_instances__form
            #  11. PREFETCH OrgUnitChangeRequest.org_unit_type.projects
            # extra field `select_all_count` at the same level as `count` for pagination
            #  12. COUNT(*) -> `self.get_queryset()` is called 2 times…
            #  13. COUNT(status=new)
            response = self.client.get("/api/orgunits/changes/")
            self.assertJSONResponse(response, 200)

        self.assertEqual(2, len(response.data["results"]))
        self.assertEqual(2, response.data["count"])
        self.assertEqual(2, response.data["select_all_count"])

    def test_list_without_auth(self):
        response = self.client.get("/api/orgunits/changes/")
        self.assertJSONResponse(response, 401)

    def test_retrieve_ok(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(10):
            response = self.client.get(f"/api/orgunits/changes/{change_request.pk}/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.data["id"], change_request.pk)

    def test_retrieve_should_not_include_soft_deleted_intances(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        change_request.new_reference_instances.set([self.instance_1.pk])
        change_request.old_reference_instances.set([self.instance_2.pk])

        m.OrgUnitReferenceInstance.objects.filter(org_unit=self.org_unit).delete()
        m.OrgUnitReferenceInstance.objects.create(org_unit=self.org_unit, form=self.form_3, instance=self.instance_3)

        self.client.force_authenticate(self.user)

        with self.assertNumQueries(10):
            response = self.client.get(f"/api/orgunits/changes/{change_request.pk}/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(response.data["id"], change_request.pk)
            self.assertEqual(len(response.data["new_reference_instances"]), 1)
            self.assertEqual(response.data["new_reference_instances"][0]["id"], self.instance_1.pk)
            self.assertEqual(len(response.data["old_reference_instances"]), 1)
            self.assertEqual(response.data["old_reference_instances"][0]["id"], self.instance_2.pk)
            self.assertEqual(len(response.data["org_unit"]["reference_instances"]), 1)
            self.assertEqual(response.data["org_unit"]["reference_instances"][0]["id"], self.instance_3.pk)

        # Soft delete instances.
        self.instance_1.deleted = True
        self.instance_1.save()
        self.instance_2.deleted = True
        self.instance_2.save()
        self.instance_3.deleted = True
        self.instance_3.save()

        with self.assertNumQueries(9):
            response = self.client.get(f"/api/orgunits/changes/{change_request.pk}/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(response.data["id"], change_request.pk)
            self.assertEqual(len(response.data["new_reference_instances"]), 0)
            self.assertEqual(len(response.data["old_reference_instances"]), 0)
            self.assertEqual(len(response.data["org_unit"]["reference_instances"]), 0)

    def test_retrieve_without_auth(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        response = self.client.get(f"/api/orgunits/changes/{change_request.pk}/")
        self.assertJSONResponse(response, 401)

    @time_machine.travel(DT, tick=False)
    def test_create_ok(self):
        self.client.force_authenticate(self.user)
        data = {
            "org_unit_id": self.org_unit.id,
            "new_name": "I want this new name",
            "new_org_unit_type_id": self.org_unit_type.pk,
        }
        response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        change_request = m.OrgUnitChangeRequest.objects.get(new_name=data["new_name"])
        self.assertEqual(change_request.new_name, data["new_name"])
        self.assertEqual(change_request.new_org_unit_type, self.org_unit_type)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.requested_fields, ["new_name", "new_org_unit_type"])

    @time_machine.travel(DT, tick=False)
    def test_create_ok_erase_fields(self):
        self.client.force_authenticate(self.user)
        data = {
            "org_unit_id": self.org_unit.id,
            "new_parent_id": None,
            "new_name": "",
            "new_groups": [],
            "new_location": None,
            "new_location_accuracy": None,
            "new_org_unit_type_id": self.org_unit_type.pk,  # At least one field is required to create a change request.
            "new_opening_date": None,
            "new_closed_date": None,
            "new_reference_instances": [],
        }
        response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        change_request = m.OrgUnitChangeRequest.objects.get(new_name=data["new_name"])
        self.assertEqual(change_request.new_name, "")
        self.assertEqual(change_request.new_groups.count(), 0)
        self.assertEqual(change_request.new_location, None)
        self.assertEqual(change_request.new_location_accuracy, None)
        self.assertEqual(change_request.new_org_unit_type, self.org_unit_type)
        self.assertEqual(change_request.new_opening_date, None)
        self.assertEqual(change_request.new_closed_date, None)
        self.assertEqual(change_request.new_reference_instances.count(), 0)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(
            change_request.requested_fields,
            [
                "new_parent",
                "new_name",
                "new_org_unit_type",
                "new_groups",
                "new_location",
                "new_location_accuracy",
                "new_opening_date",
                "new_closed_date",
                "new_reference_instances",
            ],
        )

    @time_machine.travel(DT, tick=False)
    def test_create_ok_using_uuid_as_for_org_unit_id(self):
        self.client.force_authenticate(self.user)
        data = {
            "org_unit_id": self.org_unit.uuid,
            "new_name": "I want this new name",
            "new_org_unit_type_id": self.org_unit_type.pk,
        }
        with self.assertNumQueries(11):
            response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        change_request = m.OrgUnitChangeRequest.objects.get(new_name=data["new_name"])
        self.assertEqual(change_request.new_name, data["new_name"])
        self.assertEqual(change_request.new_org_unit_type, self.org_unit_type)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.requested_fields, ["new_name", "new_org_unit_type"])

    @time_machine.travel(DT, tick=False)
    def test_create_ok_from_mobile(self):
        """
        The mobile adds `?app_id=.bar.baz` in the query params.
        """
        self.client.force_authenticate(self.user)
        data = {
            "uuid": "e05933f4-8370-4329-8cf5-197941785a24",
            "org_unit_id": self.org_unit.id,
            "new_name": "Bar",
        }
        with self.assertNumQueries(12):
            response = self.client.post("/api/orgunits/changes/?app_id=foo.bar.baz", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        change_request = m.OrgUnitChangeRequest.objects.get(uuid=data["uuid"])
        self.assertEqual(change_request.new_name, data["new_name"])
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.requested_fields, ["new_name"])

    @time_machine.travel(DT, tick=False)
    def test_create_ok_with_new_accuracy_more_digits(self):
        """
        accuracy is only 2 digits.
        """
        self.client.force_authenticate(self.user)
        data = {
            "uuid": "e05933f4-8370-4329-8cf5-197941785a24",
            "org_unit_id": self.org_unit.id,
            "new_location_accuracy": 1.2345,
        }

        with self.assertNumQueries(12):
            response = self.client.post("/api/orgunits/changes/?app_id=foo.bar.baz", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        change_request = m.OrgUnitChangeRequest.objects.get(uuid=data["uuid"])
        self.assertEqual(change_request.new_location_accuracy, Decimal("1.23"))
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.requested_fields, ["new_location_accuracy"])

    def test_create_without_auth(self):
        data = {
            "uuid": "e05933f4-8370-4329-8cf5-197941785a24",
            "org_unit_id": self.org_unit.id,
            "new_name": "Foo",
        }
        response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertJSONResponse(response, 401)

    def test_create_without_perm(self):
        self.client.force_authenticate(self.user)

        unauthorized_org_unit = m.OrgUnit.objects.create()
        data = {
            "org_unit_id": unauthorized_org_unit.id,
            "new_name": "I want this new name",
        }
        response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    def test_partial_update_without_perm(self):
        self.client.force_authenticate(self.user)

        kwargs = {
            "status": m.OrgUnitChangeRequest.Statuses.NEW,
            "org_unit": self.org_unit,
            "new_name": "Foo",
        }
        change_request = m.OrgUnitChangeRequest.objects.create(**kwargs)

        data = {
            "status": change_request.Statuses.REJECTED,
            "rejection_comment": "Not good enough.",
        }
        response = self.client.patch(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 403)

    @time_machine.travel(DT, tick=False)
    def test_partial_update_reject(self):
        self.client.force_authenticate(self.user_with_review_perm)

        kwargs = {
            "status": m.OrgUnitChangeRequest.Statuses.NEW,
            "org_unit": self.org_unit,
            "created_by": self.user,
            "new_name": "Foo",
        }
        change_request = m.OrgUnitChangeRequest.objects.create(**kwargs)

        data = {
            "status": change_request.Statuses.REJECTED,
            "rejection_comment": "Not good enough.",
        }
        response = self.client.patch(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        change_request.refresh_from_db()
        self.assertEqual(change_request.status, change_request.Statuses.REJECTED)
        self.org_unit.refresh_from_db()
        self.assertEqual(self.org_unit.validation_status, m.OrgUnit.VALIDATION_REJECTED)

    @time_machine.travel(DT, tick=False)
    def test_partial_update_approve(self):
        self.client.force_authenticate(self.user_with_review_perm)

        kwargs = {
            "org_unit": self.org_unit,
            "created_by": self.user,
            "new_name": "Foo",
            "new_closed_date": None,
        }
        change_request = m.OrgUnitChangeRequest.objects.create(**kwargs)

        data = {
            "status": change_request.Statuses.APPROVED,
            "approved_fields": ["new_name", "new_closed_date"],
        }
        response = self.client.patch(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        change_request.refresh_from_db()
        self.assertEqual(change_request.status, change_request.Statuses.APPROVED)
        self.org_unit.refresh_from_db()
        self.assertEqual(self.org_unit.name, "Foo")
        self.assertIsNone(self.org_unit.closed_date)
        self.assertEqual(self.org_unit.validation_status, m.OrgUnit.VALIDATION_VALID)

    def test_partial_update_approve_fail_wrong_status(self):
        self.client.force_authenticate(self.user_with_review_perm)

        kwargs = {
            "status": m.OrgUnitChangeRequest.Statuses.APPROVED,
            "org_unit": self.org_unit,
            "approved_fields": ["new_name"],
        }
        change_request = m.OrgUnitChangeRequest.objects.create(**kwargs)

        data = {
            "status": change_request.Statuses.APPROVED,
            "approved_fields": ["new_name"],
        }
        response = self.client.patch(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Status must be `new` but current status is `approved`.", response.content.decode())

    def test_update_should_be_forbidden(self):
        self.client.force_authenticate(self.user_with_review_perm)
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        data = {"new_name": "Baz"}
        response = self.client.put(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 405)

    def test_delete_should_be_forbidden(self):
        self.client.force_authenticate(self.user_with_review_perm)
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        response = self.client.delete(f"/api/orgunits/changes/{change_request.pk}/", format="json")
        self.assertEqual(response.status_code, 405)

    def test_bulk_review_without_perm(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/orgunits/changes/bulk_review/", data={}, format="json")
        self.assertEqual(response.status_code, 403)

    @time_machine.travel(DT, tick=False)
    def test_bulk_review_approve(self):
        self.client.force_authenticate(self.user_with_review_perm)

        change_request_1 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW,
            org_unit=self.org_unit,
            created_by=self.user,
            new_name="foo",
            requested_fields=["new_name"],
        )
        org_unit_2 = m.OrgUnit.objects.create(
            name="baz",
            org_unit_type=self.org_unit_type,
            version=self.version,
            parent=self.org_unit,
        )
        change_request_2 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW,
            org_unit=org_unit_2,
            created_by=self.user,
            new_name="new baz",
            requested_fields=["new_name"],
        )

        data = {
            "select_all": 0,
            "selected_ids": [change_request_1.pk, change_request_2.pk],
            "unselected_ids": [],
            "status": m.OrgUnitChangeRequest.Statuses.APPROVED,
        }
        response = self.client.patch("/api/orgunits/changes/bulk_review/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_change_requests_bulk_approve")

        self.assertEqual(task.launcher, self.user_with_review_perm)
        self.assertCountEqual(task.params["kwargs"]["change_requests_ids"], [change_request_1.pk, change_request_2.pk])

        self.runAndValidateTask(task, "SUCCESS")

        task.refresh_from_db()
        self.assertEqual(task.progress_message, "Bulk approved 2 change requests.")

        change_request_1.refresh_from_db()
        self.assertEqual(change_request_1.status, m.OrgUnitChangeRequest.Statuses.APPROVED)
        self.assertEqual(change_request_1.updated_by, self.user_with_review_perm)
        change_request_1.org_unit.refresh_from_db()
        self.assertEqual(change_request_1.org_unit.name, "foo")
        self.assertEqual(change_request_1.org_unit.parent, None)  # Should be unmodified.

        change_request_2.refresh_from_db()
        self.assertEqual(change_request_2.status, m.OrgUnitChangeRequest.Statuses.APPROVED)
        self.assertEqual(change_request_2.updated_by, self.user_with_review_perm)
        change_request_2.org_unit.refresh_from_db()
        self.assertEqual(change_request_2.org_unit.name, "new baz")
        self.assertEqual(change_request_2.org_unit.parent, self.org_unit)  # Should be unmodified.

    @time_machine.travel(DT, tick=False)
    def test_bulk_review_approve_should_be_filtered(self):
        self.client.force_authenticate(self.user_with_review_perm)

        user_1 = self.user_with_review_perm
        user_2 = self.user

        change_request_1 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW, org_unit=self.org_unit, created_by=user_1, new_name="foo"
        )
        change_request_2 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW, org_unit=self.org_unit, created_by=user_2, new_name="bar"
        )
        self.assertEqual(2, m.OrgUnitChangeRequest.objects.count())

        data = {
            "select_all": 1,
            "status": m.OrgUnitChangeRequest.Statuses.APPROVED,
        }

        querystring = f"?users={user_2.id}"
        response = self.client.patch(f"/api/orgunits/changes/bulk_review/{querystring}", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_change_requests_bulk_approve")

        self.assertEqual(task.launcher, self.user_with_review_perm)
        self.assertCountEqual(task.params["kwargs"]["change_requests_ids"], [change_request_2.pk])

        self.runAndValidateTask(task, "SUCCESS")

        change_request_1.refresh_from_db()
        change_request_2.refresh_from_db()

        # This change request should have been excluded from the querystring filter.
        self.assertEqual(change_request_1.status, m.OrgUnitChangeRequest.Statuses.NEW)

        # This change request should have been approved.
        self.assertEqual(change_request_2.status, m.OrgUnitChangeRequest.Statuses.APPROVED)

    @time_machine.travel(DT, tick=False)
    def test_bulk_review_reject(self):
        self.client.force_authenticate(self.user_with_review_perm)

        change_request_1 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW, org_unit=self.org_unit, created_by=self.user, new_name="foo"
        )
        change_request_2 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW, org_unit=self.org_unit, created_by=self.user, new_name="bar"
        )
        change_request_3 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW, org_unit=self.org_unit, created_by=self.user, new_name="baz"
        )

        data = {
            "select_all": 1,
            "selected_ids": [],
            "unselected_ids": [change_request_3.pk],
            "status": m.OrgUnitChangeRequest.Statuses.REJECTED,
            "rejection_comment": "No way.",
        }
        response = self.client.patch("/api/orgunits/changes/bulk_review/", data=data, format="json")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        task = self.assertValidTaskAndInDB(data["task"], status="QUEUED", name="org_unit_change_requests_bulk_reject")

        self.assertEqual(task.launcher, self.user_with_review_perm)
        self.assertCountEqual(task.params["kwargs"]["change_requests_ids"], [change_request_1.pk, change_request_2.pk])
        self.assertCountEqual(task.params["kwargs"]["rejection_comment"], "No way.")

        self.runAndValidateTask(task, "SUCCESS")

        task.refresh_from_db()
        self.assertEqual(task.progress_message, "Bulk rejected 2 change requests.")

        change_request_1.refresh_from_db()
        self.assertEqual(change_request_1.status, m.OrgUnitChangeRequest.Statuses.REJECTED)
        self.assertEqual(change_request_1.updated_by, self.user_with_review_perm)

        change_request_2.refresh_from_db()
        self.assertEqual(change_request_2.status, m.OrgUnitChangeRequest.Statuses.REJECTED)
        self.assertEqual(change_request_2.updated_by, self.user_with_review_perm)

        change_request_3.refresh_from_db()
        self.assertEqual(change_request_3.status, m.OrgUnitChangeRequest.Statuses.NEW)
        self.assertEqual(change_request_3.updated_by, None)

    def test_export_to_csv(self):
        """
        It tests the CSV export for the org change requests list.
        """
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Bar")

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/orgunits/changes/export_to_csv/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get("Content-Disposition"),
            "attachment; filename=review-change-proposals--" + datetime.datetime.now().strftime("%Y-%m-%d") + ".csv",
        )

        response_csv = response.getvalue().decode("utf-8")
        response_string = "".join(s for s in response_csv)
        reader = csv.reader(io.StringIO(response_string), delimiter=",")

        data = list(reader)
        self.assertEqual(len(data), 3)  # Header + 2 change requests

        data_headers = data[0]
        self.assertEqual(data_headers, OrgUnitChangeRequestViewSet.CSV_HEADER_COLUMNS)

        first_data_row = data[1]

        # Helper function to determine if a field has changed
        def get_conclusion(field_name, old_value, new_value):
            field_mapping = {
                "name": "new_name",
                "parent": "new_parent",
                "ref_ext_parent_1": "new_parent",
                "ref_ext_parent_2": "new_parent",
                "ref_ext_parent_3": "new_parent",
                "opening_date": "new_opening_date",
                "closing_date": "new_closed_date",
                "groups": "new_groups",
                "localisation": "new_location",
                "reference_submission": "new_reference_instances",
            }
            requested_field = field_mapping.get(field_name)
            if requested_field not in change_request.requested_fields:
                return "same"
            if old_value == new_value:
                return "same"
            return "updated"

        # Get parent reference extensions
        def get_parent_ref_ext(parent, level):
            if not parent:
                return None

            # Get ancestors up to the specified level
            ancestors = list(parent.ancestors().order_by("path"))
            if level <= len(ancestors):
                return ancestors[level - 1].source_ref
            return None

        # Get location string
        def get_location_str(location):
            if not location:
                return None
            return f"{location.y}, {location.x}"

        # Get reference instance IDs
        def get_reference_instance_ids(instances):
            if not instances.exists():
                return ""
            return ",".join(sorted(str(instance.id) for instance in instances.all()))

        # Basic expected data
        expected_row_data = [
            str(change_request.id),
            str(change_request.org_unit_id),
            change_request.org_unit.source_ref,
            change_request.org_unit.name,
            change_request.org_unit.parent.name if change_request.org_unit.parent else None,
            change_request.org_unit.org_unit_type.name if change_request.org_unit.org_unit_type else None,
            ",".join(group.name for group in change_request.org_unit.groups.all()),
            datetime.datetime.strftime(change_request.created_at, "%Y-%m-%d"),
            get_creator_name(change_request.created_by) if change_request.created_by else None,
            datetime.datetime.strftime(change_request.updated_at, "%Y-%m-%d"),
            get_creator_name(change_request.updated_by) if change_request.updated_by else None,
        ]

        # Name changes
        name_before = change_request.old_name if change_request.kind == change_request.Kind.ORG_UNIT_CHANGE else ""
        name_after = change_request.new_name if change_request.new_name else change_request.org_unit.name
        name_conclusion = get_conclusion("name", name_before, name_after)

        expected_row_data.extend([name_before, name_after, name_conclusion])

        # Parent changes
        parent_before = change_request.old_parent.name if change_request.old_parent else ""
        parent_after = (
            change_request.new_parent.name
            if change_request.new_parent
            else change_request.org_unit.parent.name
            if change_request.org_unit.parent
            else None
        )

        expected_row_data.extend([parent_before, parent_after])

        # Reference extensions for parents
        for level in range(1, 4):
            parent_before = change_request.old_parent if change_request.old_parent else None
            parent_after = change_request.new_parent if change_request.new_parent else change_request.org_unit.parent

            ref_ext_before = get_parent_ref_ext(parent_before, level)
            ref_ext_after = get_parent_ref_ext(parent_after, level)
            ref_ext_conclusion = get_conclusion(f"ref_ext_parent_{level}", ref_ext_before, ref_ext_after)

            expected_row_data.extend([ref_ext_before, ref_ext_after, ref_ext_conclusion])

        # Opening date changes
        opening_date_before = (
            change_request.old_opening_date.strftime("%Y-%m-%d") if change_request.old_opening_date else ""
        )
        opening_date_after = (
            change_request.new_opening_date.strftime("%Y-%m-%d")
            if change_request.new_opening_date
            else (
                change_request.org_unit.opening_date.strftime("%Y-%m-%d")
                if change_request.org_unit.opening_date
                else None
            )
        )
        opening_date_conclusion = get_conclusion("opening_date", opening_date_before, opening_date_after)

        expected_row_data.extend([opening_date_before, opening_date_after, opening_date_conclusion])

        # Closing date changes
        closing_date_before = (
            change_request.old_closed_date.strftime("%Y-%m-%d") if change_request.old_closed_date else ""
        )
        closing_date_after = (
            change_request.new_closed_date.strftime("%Y-%m-%d")
            if change_request.new_closed_date
            else (
                change_request.org_unit.closed_date.strftime("%Y-%m-%d")
                if change_request.org_unit.closed_date
                else None
            )
        )
        closing_date_conclusion = get_conclusion("closing_date", closing_date_before, closing_date_after)

        expected_row_data.extend([closing_date_before, closing_date_after, closing_date_conclusion])

        # Groups changes
        groups_before = ",".join(group.name for group in change_request.old_groups.all())
        groups_after = (
            ",".join(group.name for group in change_request.new_groups.all())
            if change_request.new_groups.exists()
            else ",".join(group.name for group in change_request.org_unit.groups.all())
        )
        groups_conclusion = get_conclusion("groups", groups_before, groups_after)

        expected_row_data.extend([groups_before, groups_after, groups_conclusion])

        # Location changes
        location_before = get_location_str(change_request.old_location)
        location_after = (
            get_location_str(change_request.new_location)
            if change_request.new_location
            else get_location_str(change_request.org_unit.location)
        )
        location_conclusion = get_conclusion("localisation", location_before, location_after)

        expected_row_data.extend([location_before, location_after, location_conclusion])

        # Reference instances changes
        reference_before = get_reference_instance_ids(change_request.old_reference_instances)
        reference_after = (
            get_reference_instance_ids(change_request.new_reference_instances)
            if change_request.new_reference_instances.exists()
            else get_reference_instance_ids(change_request.org_unit.reference_instances)
        )

        expected_row_data.extend([reference_before, reference_after])

        # Convert None values to empty strings for comparison
        expected_row_data = ["" if v is None else str(v) for v in expected_row_data]
        first_data_row = ["" if v is None else str(v) for v in first_data_row]

        # Sort instance IDs in both lists before comparison
        for i, (expected, actual) in enumerate(zip(expected_row_data, first_data_row)):
            if "," in expected and "," in actual:  # Check if this is a comma-separated list of IDs
                expected_sorted = ",".join(sorted(expected.split(",")))
                actual_sorted = ",".join(sorted(actual.split(",")))
                self.assertEqual(expected_sorted, actual_sorted, f"Difference at index {i}")
            else:
                self.assertEqual(expected, actual, f"Difference at index {i}")

    def test_export_to_csv_with_new_change_request(self):
        """
        Test that NEW change requests have correct conclusions based on field changes.
        """
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit, new_name="Foo", requested_fields=["new_name"]
        )

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/orgunits/changes/export_to_csv/")
        self.assertEqual(response.status_code, 200)

        response_csv = response.getvalue().decode("utf-8")
        reader = csv.reader(io.StringIO(response_csv), delimiter=",")
        data = list(reader)

        # Skip header row
        first_data_row = data[1]

        # Check that the name conclusion is "updated" for a NEW change request with a name change
        name_conclusion_index = 13  # Index of "Name conclusion" column
        self.assertEqual(first_data_row[name_conclusion_index], "updated")

    def test_export_to_csv_with_approved_change_request(self):
        """
        Test that APPROVED change requests have correct conclusions based on field changes.
        """
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            requested_fields=["new_name", "new_groups"],
            approved_fields=["new_name"],
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/orgunits/changes/export_to_csv/")
        self.assertEqual(response.status_code, 200)

        response_csv = response.getvalue().decode("utf-8")
        reader = csv.reader(io.StringIO(response_csv), delimiter=",")
        data = list(reader)

        # Skip header row
        first_data_row = data[1]

        # Check that the name conclusion is "updated" for an APPROVED change request with a name change
        name_conclusion_index = 13  # Index of "Name conclusion" column
        self.assertEqual(first_data_row[name_conclusion_index], "updated")

        # Check that the groups conclusion is "same" for an APPROVED change request
        # where the field was requested but not changed
        groups_conclusion_index = 33  # Index of "Groups conclusion" column
        self.assertEqual(first_data_row[groups_conclusion_index], "same")

    def test_export_to_csv_with_rejected_change_request(self):
        """
        Test that REJECTED change requests have correct conclusions based on field changes.
        """
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            requested_fields=["new_name", "new_groups"],
            status=m.OrgUnitChangeRequest.Statuses.REJECTED,
        )

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/orgunits/changes/export_to_csv/")
        self.assertEqual(response.status_code, 200)

        response_csv = response.getvalue().decode("utf-8")
        reader = csv.reader(io.StringIO(response_csv), delimiter=",")
        data = list(reader)

        # Skip header row
        first_data_row = data[1]

        # Check that the name conclusion is "updated" for a REJECTED change request with a name change
        name_conclusion_index = 13  # Index of "Name conclusion" column
        self.assertEqual(first_data_row[name_conclusion_index], "updated")

        # Check that the groups conclusion is "same" for a REJECTED change request
        # where the field was requested but not changed
        groups_conclusion_index = 33  # Index of "Groups conclusion" column
        self.assertEqual(first_data_row[groups_conclusion_index], "same")
