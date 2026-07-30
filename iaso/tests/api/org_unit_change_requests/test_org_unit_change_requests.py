import csv
import datetime
import io

from decimal import Decimal

import time_machine

from django.contrib.gis.geos import MultiPolygon, Polygon
from rest_framework import status

from hat.audit import models as audit_models
from iaso import models as m
from iaso.api.org_unit_change_requests.views import OrgUnitChangeRequestViewSet
from iaso.permissions.core_permissions import CORE_ORG_UNITS_CHANGE_REQUEST_REVIEW_PERMISSION
from iaso.tests.tasks.task_api_test_case import TaskAPITestCase


def parse_csv_rows(response):
    """Parse a CSV `HttpResponse` into a list of dicts keyed by column name, e.g.
    `row["Name conclusion"]` instead of a magic-index `row[13]`.
    """
    response_csv = response.getvalue().decode("utf-8")
    header, *rows = csv.reader(io.StringIO(response_csv))
    return [dict(zip(header, row)) for row in rows]


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
            username="user_with_review_perm",
            account=account,
            permissions=[CORE_ORG_UNITS_CHANGE_REQUEST_REVIEW_PERMISSION],
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

        with self.assertNumQueries(11):
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
            response = self.client.get("/api/orgunits/changes/")
            self.assertJSONResponse(response, status.HTTP_200_OK)

        self.assertEqual(2, len(response.data["results"]))
        self.assertEqual(2, response.data["count"])

    def test_list_without_auth(self):
        response = self.client.get("/api/orgunits/changes/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_ok(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(10):
            response = self.client.get(f"/api/orgunits/changes/{change_request.pk}/")
        self.assertJSONResponse(response, status.HTTP_200_OK)
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
            self.assertJSONResponse(response, status.HTTP_200_OK)
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
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertEqual(response.data["id"], change_request.pk)
            self.assertEqual(len(response.data["new_reference_instances"]), 0)
            self.assertEqual(len(response.data["old_reference_instances"]), 0)
            self.assertEqual(len(response.data["org_unit"]["reference_instances"]), 0)

    def test_retrieve_without_auth(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        response = self.client.get(f"/api/orgunits/changes/{change_request.pk}/")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    @time_machine.travel(DT, tick=False)
    def test_create_ok(self):
        self.client.force_authenticate(self.user)
        data = {
            "org_unit_id": self.org_unit.id,
            "new_name": "I want this new name",
            "new_org_unit_type_id": self.org_unit_type.pk,
        }
        response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        change_request = m.OrgUnitChangeRequest.objects.get(new_name=data["new_name"])
        self.assertEqual(change_request.new_name, data["new_name"])
        self.assertEqual(change_request.new_org_unit_type, self.org_unit_type)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.requested_fields, ["new_name", "new_org_unit_type"])

    @time_machine.travel(DT, tick=False)
    def test_create_same_uuid_ok(self):
        self.client.force_authenticate(self.user)
        data = {
            "uuid": "9eedf036-b444-47ad-b8a2-7169b87e89bf",
            "org_unit_id": self.org_unit.id,
            "new_name": "I want this new name",
            "new_org_unit_type_id": self.org_unit_type.pk,
        }
        response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        change_request = m.OrgUnitChangeRequest.objects.get(new_name=data["new_name"])
        self.assertEqual(change_request.uuid.__str__(), data["uuid"])
        self.assertEqual(change_request.new_name, data["new_name"])
        self.assertEqual(change_request.new_org_unit_type, self.org_unit_type)
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)
        self.assertEqual(change_request.requested_fields, ["new_name", "new_org_unit_type"])
        self.assertEqual(m.OrgUnitChangeRequest.objects.count(), 1)

        new_data = {
            "uuid": data["uuid"],
            "org_unit_id": data["org_unit_id"],
            "new_name": "I want this new name 2",
            "new_org_unit_type_id": data["new_org_unit_type_id"],
        }
        response = self.client.post("/api/orgunits/changes/", data=new_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(m.OrgUnitChangeRequest.objects.count(), 1)
        change_request = m.OrgUnitChangeRequest.objects.get(uuid=data["uuid"])
        self.assertEqual(change_request.uuid.__str__(), data["uuid"])
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
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
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
        with self.assertNumQueries(12):
            response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
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
        with self.assertNumQueries(11):
            # 1. SELECT org unit by id
            # 2. SELECT EXISTS change request by uuid
            # 3. SELECT project (+ account + default_version via select_related)
            # 4–5. Org unit in user scope (profile + path / project filters)
            # 6. INSERT change request
            # 7–8. Old groups: SELECT + M2M insert
            # 9–11. Old + new reference instances: SELECTs + M2M insert
            response = self.client.post("/api/orgunits/changes/?app_id=foo.bar.baz", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
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

        with self.assertNumQueries(11):
            response = self.client.post("/api/orgunits/changes/?app_id=foo.bar.baz", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
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
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_create_without_perm(self):
        self.client.force_authenticate(self.user)

        unauthorized_org_unit = m.OrgUnit.objects.create()
        data = {
            "org_unit_id": unauthorized_org_unit.id,
            "new_name": "I want this new name",
        }
        response = self.client.post("/api/orgunits/changes/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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
        self.assertEqual(response.status_code, status.HTTP_200_OK)

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
        self.assertEqual(response.status_code, status.HTTP_200_OK)

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
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Status must be `new` but current status is `approved`.", response.content.decode())

    @time_machine.travel(DT, tick=False)
    def test_partial_update_approve_new_geom(self):
        self.client.force_authenticate(self.user_with_review_perm)

        new_geom = MultiPolygon(Polygon([(0, 0), (0, 1), (1, 1), (0, 0)], srid=4326), srid=4326)
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            created_by=self.user,
            new_geom=new_geom,
            requested_fields=["new_geom"],
        )

        data = {
            "status": change_request.Statuses.APPROVED,
            "approved_fields": ["new_geom"],
        }
        response = self.client.patch(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        change_request.refresh_from_db()
        self.assertEqual(change_request.status, change_request.Statuses.APPROVED)
        self.org_unit.refresh_from_db()
        self.assertEqual(self.org_unit.geom, new_geom)
        self.assertIsNotNone(self.org_unit.simplified_geom)
        self.assertEqual(self.org_unit.validation_status, m.OrgUnit.VALIDATION_VALID)

    @time_machine.travel(DT, tick=False)
    def test_partial_update_approve_new_code(self):
        self.client.force_authenticate(self.user_with_review_perm)

        new_code = "000000000000001"
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            created_by=self.user,
            new_code=new_code,
            requested_fields=["new_code"],
        )

        data = {
            "status": change_request.Statuses.APPROVED,
            "approved_fields": ["new_code"],
        }
        response = self.client.patch(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        change_request.refresh_from_db()
        self.assertEqual(change_request.status, change_request.Statuses.APPROVED)
        self.org_unit.refresh_from_db()
        self.assertEqual(self.org_unit.code, new_code)

    def test_update_should_be_forbidden(self):
        self.client.force_authenticate(self.user_with_review_perm)
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        data = {"new_name": "Baz"}
        response = self.client.put(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_should_be_forbidden(self):
        self.client.force_authenticate(self.user_with_review_perm)
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        response = self.client.delete(f"/api/orgunits/changes/{change_request.pk}/", format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_bulk_review_without_perm(self):
        self.client.force_authenticate(self.user)
        response = self.client.patch("/api/orgunits/changes/bulk_review/", data={}, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
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
        self.assertEqual(response.status_code, status.HTTP_200_OK)
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

    def test_bulk_delete_without_perm(self):
        self.client.force_authenticate(self.user)
        data = {
            "select_all": 1,
        }
        response = self.client.post("/api/orgunits/changes/bulk_delete/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @time_machine.travel(DT, tick=False)
    def test_bulk_delete(self):
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
        }
        response = self.client.post("/api/orgunits/changes/bulk_delete/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        self.assertEqual(data, {"result": "success"})

        change_request_1.refresh_from_db()
        self.assertEqual(change_request_1.deleted_at, self.DT)
        self.assertEqual(change_request_1.updated_by, self.user_with_review_perm)

        change_request_2.refresh_from_db()
        self.assertEqual(change_request_2.deleted_at, self.DT)
        self.assertEqual(change_request_2.updated_by, self.user_with_review_perm)

        change_request_3.refresh_from_db()
        self.assertEqual(change_request_3.deleted_at, None)
        self.assertEqual(change_request_3.updated_by, None)

        modification_log_1 = audit_models.Modification.objects.get(object_id=change_request_1.pk)
        self.assertEqual(modification_log_1.source, audit_models.ORG_UNIT_CHANGE_REQUEST_API)
        self.assertEqual(modification_log_1.user, self.user_with_review_perm)
        past_values = modification_log_1.past_value[0]["fields"]
        self.assertEqual(past_values["deleted_at"], None)
        self.assertEqual(past_values["updated_by"], None)
        new_values = modification_log_1.new_value[0]["fields"]
        self.assertEqual(new_values["deleted_at"], self.DT.strftime("%Y-%m-%dT%H:%M:%SZ"))
        self.assertEqual(new_values["updated_by"], self.user_with_review_perm.pk)

        modification_log_2 = audit_models.Modification.objects.get(object_id=change_request_2.pk)
        self.assertEqual(modification_log_2.source, audit_models.ORG_UNIT_CHANGE_REQUEST_API)
        self.assertEqual(modification_log_2.user, self.user_with_review_perm)
        past_values = modification_log_2.past_value[0]["fields"]
        self.assertEqual(past_values["deleted_at"], None)
        self.assertEqual(past_values["updated_by"], None)
        new_values = modification_log_2.new_value[0]["fields"]
        self.assertEqual(new_values["deleted_at"], self.DT.strftime("%Y-%m-%dT%H:%M:%SZ"))
        self.assertEqual(new_values["updated_by"], self.user_with_review_perm.pk)

    @time_machine.travel(DT, tick=False)
    def test_bulk_restore(self):
        self.client.force_authenticate(self.user_with_review_perm)

        change_request_1 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW,
            org_unit=self.org_unit,
            created_by=self.user,
            new_name="foo",
            deleted_at=self.DT,
        )
        change_request_2 = m.OrgUnitChangeRequest.objects.create(
            status=m.OrgUnitChangeRequest.Statuses.NEW,
            org_unit=self.org_unit,
            created_by=self.user,
            new_name="bar",
            deleted_at=self.DT,
        )

        data = {
            "select_all": 1,
            "selected_ids": [],
            "unselected_ids": [],
            "restore": 1,
        }
        response = self.client.post("/api/orgunits/changes/bulk_delete/", data=data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        self.assertEqual(data, {"result": "success"})

        change_request_1.refresh_from_db()
        self.assertEqual(change_request_1.deleted_at, None)
        self.assertEqual(change_request_1.updated_by, self.user_with_review_perm)

        change_request_2.refresh_from_db()
        self.assertEqual(change_request_2.deleted_at, None)
        self.assertEqual(change_request_2.updated_by, self.user_with_review_perm)

        modification_log_1 = audit_models.Modification.objects.get(object_id=change_request_1.pk)
        self.assertEqual(modification_log_1.source, audit_models.ORG_UNIT_CHANGE_REQUEST_API)
        self.assertEqual(modification_log_1.user, self.user_with_review_perm)
        past_values = modification_log_1.past_value[0]["fields"]
        self.assertEqual(past_values["deleted_at"], self.DT.strftime("%Y-%m-%dT%H:%M:%SZ"))
        self.assertEqual(past_values["updated_by"], None)
        new_values = modification_log_1.new_value[0]["fields"]
        self.assertEqual(new_values["deleted_at"], None)
        self.assertEqual(new_values["updated_by"], self.user_with_review_perm.pk)

        modification_log_2 = audit_models.Modification.objects.get(object_id=change_request_2.pk)
        self.assertEqual(modification_log_2.source, audit_models.ORG_UNIT_CHANGE_REQUEST_API)
        self.assertEqual(modification_log_2.user, self.user_with_review_perm)
        past_values = modification_log_2.past_value[0]["fields"]
        self.assertEqual(past_values["deleted_at"], self.DT.strftime("%Y-%m-%dT%H:%M:%SZ"))
        self.assertEqual(past_values["updated_by"], None)
        new_values = modification_log_2.new_value[0]["fields"]
        self.assertEqual(new_values["deleted_at"], None)
        self.assertEqual(new_values["updated_by"], self.user_with_review_perm.pk)

    # Golden CSV for `test_export_to_csv`, for two vanilla change requests (no
    # `requested_fields`) on `self.org_unit` from `setUpTestData`. Only the truly
    # dynamic values (ids, dates, reference instance ids) are placeholders: everything
    # else is a hardcoded expected value, on purpose, so this test doesn't re-derive
    # its expectations with the same logic as the view (which would let a shared bug
    # hide from the test).

    # I know the tuple of fields is long, and csv is quite large, so not too bad
    EXPORT_TO_CSV_TEMPLATE = (
        # Headers
        "Id,Org unit ID,External reference,Name,Parent,Org unit type,Groups,Created,Created by,Updated,Updated by,"
        "Name before change,Name after change,Name conclusion,"
        "Parent 1 before change,Parent 1 after change,"
        "Ref Ext parent 1 before change,Ref Ext parent 1 after change,Ref Ext parent 1 conclusion,"
        "Ref Ext parent 2 before change,Ref Ext parent 2 after change,Ref Ext parent 2 conclusion,"
        "Ref Ext parent 3 before change,Ref Ext parent 3 after change,Ref Ext parent 3 conclusion,"
        "Opening date before change,Opening date after change,Opening date conclusion,"
        "Closing date before change,Closing date after change,Closing date conclusion,"
        "Groups before change,Groups after change,Groups conclusion,"
        "Localisation before change,Localisation after change,Localisation conclusion,"
        "Geometry before change,Geometry after change,Geometry conclusion,"
        "Code before change,Code after change,Code conclusion,"
        "Reference submission before,Reference submission after\n"
        # Line 2
        '{id_foo},{org_unit_id},112244,,,Org unit type,"Group 1,Group 2,Group 3",{created_foo},,{updated_foo},,,'
        "Foo,same,,,,,same,,,same,,,same,,,same,"
        '{closing_date},{closing_date},same,"Group 1,Group 2,Group 3","Group 1,Group 2,Group 3",same,,,same,,,same,,,same,'
        '"{references}","{references}"\n'
        # Line 3
        '{id_bar},{org_unit_id},112244,,,Org unit type,"Group 1,Group 2,Group 3",{created_bar},,{updated_bar},,,'
        "Bar,same,,,,,same,,,same,,,same,,,same,"
        '{closing_date},{closing_date},same,"Group 1,Group 2,Group 3","Group 1,Group 2,Group 3",same,,,same,,,same,,,same,'
        '"{references}","{references}"\n'
    )

    def test_export_to_csv(self):
        """
        It tests the CSV export for the org change requests list, by comparing the
        actual CSV against a template where only the genuinely dynamic values are
        substituted in.
        """
        change_request_foo = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        change_request_bar = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Bar")

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/orgunits/changes/export_to_csv/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.get("Content-Disposition"),
            "attachment; filename=review-change-proposals--" + datetime.datetime.now().strftime("%Y-%m-%d") + ".csv",
        )

        response_csv = response.getvalue().decode("utf-8")
        data = list(csv.reader(io.StringIO(response_csv)))
        self.assertEqual(len(data), 3)  # Header + 2 change requests

        reference_ids = ",".join(str(pk) for pk in sorted([self.instance_1.pk, self.instance_2.pk, self.instance_3.pk]))
        expected_csv = self.EXPORT_TO_CSV_TEMPLATE.format(
            id_foo=change_request_foo.id,
            id_bar=change_request_bar.id,
            org_unit_id=self.org_unit.id,
            created_foo=change_request_foo.created_at.strftime("%Y-%m-%d"),
            updated_foo=change_request_foo.updated_at.strftime("%Y-%m-%d"),
            created_bar=change_request_bar.created_at.strftime("%Y-%m-%d"),
            updated_bar=change_request_bar.updated_at.strftime("%Y-%m-%d"),
            closing_date=self.DT.strftime("%Y-%m-%d"),
            references=reference_ids,
        )
        expected_data = list(csv.reader(io.StringIO(expected_csv)))

        self.assertEqual(data[0], OrgUnitChangeRequestViewSet.CSV_HEADER_COLUMNS)
        self.assertEqual(expected_data[0], OrgUnitChangeRequestViewSet.CSV_HEADER_COLUMNS)

        # The queryset is only ordered by `org_unit__name`, which is identical for
        # both change requests here, so rows aren't guaranteed to come back in
        # creation order: sort both sides by `Id` before comparing everything at once.
        data[1:] = sorted(data[1:], key=lambda row: int(row[0]))
        expected_data[1:] = sorted(expected_data[1:], key=lambda row: int(row[0]))
        self.assertEqual(data, expected_data)

    def test_export_to_csv_with_new_change_request(self):
        """
        Test that NEW change requests have correct conclusions based on field changes.
        """
        change_request = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit, new_name="Foo", requested_fields=["new_name"]
        )

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/orgunits/changes/export_to_csv/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        first_data_row = parse_csv_rows(response)[0]

        # Check that the name conclusion is "updated" for a NEW change request with a name change
        self.assertEqual(first_data_row["Name conclusion"], "updated")

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
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        first_data_row = parse_csv_rows(response)[0]

        # Check that the name conclusion is "updated" for an APPROVED change request with a name change
        self.assertEqual(first_data_row["Name conclusion"], "updated")

        # Check that the groups conclusion is "same" for an APPROVED change request
        # where the field was requested but not changed
        self.assertEqual(first_data_row["Groups conclusion"], "same")

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
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        first_data_row = parse_csv_rows(response)[0]

        # Check that the name conclusion is "updated" for a REJECTED change request with a name change
        self.assertEqual(first_data_row["Name conclusion"], "updated")

        # Check that the groups conclusion is "same" for a REJECTED change request
        # where the field was requested but not changed
        self.assertEqual(first_data_row["Groups conclusion"], "same")

    def test_export_to_csv_ref_ext_parent_should_report_ancestor_source_ref(self):
        """
        Regression test: the "Ref Ext parent N" columns are supposed to report the
        `source_ref` of the org unit's ancestors (e.g. its country/region code), but
        currently always come back empty.

        `self.org_unit` (source_ref="112244") has no parent, so it is its own sole
        "ancestor" at level 1. A change request on a *child* of `self.org_unit` should
        therefore report "112244" in "Ref Ext parent 1 after change" — but the query
        that's supposed to populate this (a `Prefetch("ancestors", ..., to_attr=
        "cached_ancestors")` in `OrgUnitChangeRequestViewSet.export_to_csv`) silently
        never runs, because `ancestors()` is a plain method (from django_ltree's
        `TreeModel`), not a real Django relation that `prefetch_related()` can use.
        See `get_parent_ref_ext` in `iaso.api.org_unit_change_requests.csv_export`.
        """
        child_org_unit = m.OrgUnit.objects.create(
            org_unit_type=self.org_unit_type,
            version=self.version,
            parent=self.org_unit,
            source_ref="55667788",
        )
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=child_org_unit, new_name="Child renamed")

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/orgunits/changes/export_to_csv/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        row = next(r for r in parse_csv_rows(response) if r["Id"] == str(change_request.id))

        self.assertEqual(row["Ref Ext parent 1 after change"], self.org_unit.source_ref)
