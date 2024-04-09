import csv
import datetime
import io

from iaso.api.org_unit_change_requests.views import OrgUnitChangeRequestViewSet
from iaso.utils.models.common import get_creator_name
import time_machine

from django.contrib.auth.models import Group

from iaso.test import APITestCase
from django.contrib.gis.geos import Point
from iaso import models as m


class OrgUnitChangeRequestAPITestCase(APITestCase):
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
            org_unit_type=org_unit_type, version=version, uuid="1539f174-4c53-499c-85de-7a58458c49ef"
        )

        account = m.Account.objects.create(name="Account", default_version=version)
        project = m.Project.objects.create(name="Project", account=account, app_id="foo.bar.baz")
        user = cls.create_user_with_profile(username="user", account=account)
        user_with_review_perm = cls.create_user_with_profile(
            username="user_with_review_perm", account=account, permissions=["iaso_org_unit_change_request_review"]
        )

        data_source.projects.set([project])
        org_unit_type.projects.set([project])
        user.iaso_profile.org_units.set([org_unit])

        cls.org_unit = org_unit
        cls.org_unit_type = org_unit_type
        cls.project = project
        cls.user = user
        cls.user_with_review_perm = user_with_review_perm
        cls.org_unit_change_request_csv_columns = OrgUnitChangeRequestViewSet.org_unit_change_request_csv_columns()
        cls.version = version

    def test_list_ok(self):
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Bar")

        self.client.force_authenticate(self.user)

        with self.assertNumQueries(8):
            # filter_for_user_and_app_id
            #   1. SELECT OrgUnit
            # get_queryset
            #   2. COUNT(*)
            #   3. SELECT OrgUnitChangeRequest
            #   4. PREFETCH OrgUnit.groups
            #   5. PREFETCH OrgUnitChangeRequest.new_groups
            #   6. PREFETCH OrgUnitChangeRequest.new_reference_instances
            #   7. PREFETCH OrgUnitChangeRequest.old_groups
            #   8. PREFETCH OrgUnitChangeRequest.old_reference_instances
            response = self.client.get("/api/orgunits/changes/")
            self.assertJSONResponse(response, 200)
            self.assertEqual(2, len(response.data["results"]))

    def test_list_without_auth(self):
        response = self.client.get("/api/orgunits/changes/")
        self.assertJSONResponse(response, 401)

    def test_retrieve_ok(self):
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        self.client.force_authenticate(self.user)
        with self.assertNumQueries(8):
            response = self.client.get(f"/api/orgunits/changes/{change_request.pk}/")
        self.assertJSONResponse(response, 200)
        self.assertEqual(response.data["id"], change_request.pk)

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

    @time_machine.travel(DT, tick=False)
    def test_create_ok_using_uuid_as_for_org_unit_id(self):
        self.client.force_authenticate(self.user)
        data = {
            "org_unit_id": self.org_unit.uuid,
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
        response = self.client.post("/api/orgunits/changes/?app_id=foo.bar.baz", data=data, format="json")
        self.assertEqual(response.status_code, 201)
        change_request = m.OrgUnitChangeRequest.objects.get(uuid=data["uuid"])
        self.assertEqual(change_request.new_name, data["new_name"])
        self.assertEqual(change_request.created_at, self.DT)
        self.assertEqual(change_request.created_by, self.user)
        self.assertEqual(change_request.updated_at, self.DT)

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

    @time_machine.travel(DT, tick=False)
    def test_partial_update_approve(self):
        self.client.force_authenticate(self.user_with_review_perm)

        kwargs = {
            "org_unit": self.org_unit,
            "created_by": self.user,
            "new_name": "Foo",
        }
        change_request = m.OrgUnitChangeRequest.objects.create(**kwargs)

        data = {
            "status": change_request.Statuses.APPROVED,
            "approved_fields": ["new_name"],
        }
        response = self.client.patch(f"/api/orgunits/changes/{change_request.pk}/", data=data, format="json")
        self.assertEqual(response.status_code, 200)

        change_request.refresh_from_db()
        self.assertEqual(change_request.status, change_request.Statuses.APPROVED)

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

    def test_export_to_csv(self):
        """
        It tests the csv export for the org change requests list
        """
        group_1 = m.Group.objects.create(
            name="Group 1", source_ref="qRsdUL2Oa4d", source_version=self.version, block_of_countries=False
        )
        group_2 = m.Group.objects.create(
            name="Group 2", source_ref="KOSuvYwass8", source_version=self.version, block_of_countries=False
        )
        self.org_unit.groups.set([group_1, group_2])
        org_unit_parent = m.OrgUnit.objects.create(name="parent")
        self.org_unit.parent = org_unit_parent
        self.org_unit.save()
        self.org_unit.refresh_from_db()

        m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Foo")
        change_request = m.OrgUnitChangeRequest.objects.create(org_unit=self.org_unit, new_name="Bar")

        change_request.created_by = self.user
        change_request.updated_by = self.user
        change_request.save()
        change_request.refresh_from_db()

        self.client.force_authenticate(self.user)

        response = self.client.get("/api/orgunits/changes/export_to_csv/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get("Content-Disposition"),
            "attachment; filename=review-change-proposals--" + datetime.datetime.now().strftime("%Y-%m-%d") + ".csv",
        )

        response_string = "\n".join(s.decode("U8") for s in response).replace("\r\n\n", "\r\n")
        reader = csv.reader(io.StringIO(response_string), delimiter=",")
        data = list(reader)
        self.assertEqual(len(data), 4)

        data_headers = data[1]
        self.assertEqual(
            data_headers,
            self.org_unit_change_request_csv_columns,
        )

        first_data_row = data[2]
        expected_row_data = [
            str(change_request.id),
            change_request.org_unit.name,
            change_request.org_unit.parent.name if change_request.org_unit.parent else "",
            change_request.org_unit.org_unit_type.name,
            ",".join(group.name for group in change_request.org_unit.groups.all()),
            str(change_request.get_status_display()),
            datetime.datetime.strftime(change_request.created_at, "%Y-%m-%d"),
            get_creator_name(change_request.created_by) if change_request.created_by else "",
            datetime.datetime.strftime(change_request.updated_at, "%Y-%m-%d"),
            get_creator_name(change_request.updated_by) if change_request.updated_by else "",
        ]
        self.assertEqual(
            first_data_row,
            expected_row_data,
        )
