import typing

from django.utils.timezone import now

from iaso import models as m
from iaso.models import Form
from iaso.test import APITestCase


class MobileFormsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="Marvel")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars, permissions=["iaso_forms"])
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel, permissions=["iaso_forms"])
        cls.iron_man = cls.create_user_with_profile(username="iron_man", account=marvel)

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")
        cls.sith_guild = m.OrgUnitType.objects.create(name="Sith guild", short_name="Sith")

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.project_2 = m.Project.objects.create(
            name="New Land Speeder concept", app_id="stars.empire.agriculture.land_speeder", account=star_wars
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", created_at=cls.now)

        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
            created_at=cls.now,
        )
        cls.form_2.form_versions.create(file=cls.create_file_mock(name="testf1.xml"), version_id="2020022401")
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.form_2.org_unit_types.add(cls.jedi_academy)

        cls.form_2.instances.create(file=cls.create_file_mock(name="testi1.xml"))
        cls.form_2.instances.create(
            file=cls.create_file_mock(name="testi2.xml"), device=m.Device.objects.create(test_device=True)
        )
        cls.form_2.save()

        cls.project_1.unit_types.add(cls.jedi_council)
        cls.project_1.unit_types.add(cls.jedi_academy)
        cls.project_1.forms.add(cls.form_1)
        cls.project_1.forms.add(cls.form_2)
        cls.project_1.save()

        # Set reference forms.
        cls.jedi_council.reference_forms.add(cls.form_2)
        cls.jedi_council.save()
        cls.jedi_academy.reference_forms.add(cls.form_1)
        cls.jedi_academy.save()

    def test_forms_list_without_auth(self):
        """GET /mobile/forms/ without auth: 0 result"""

        response = self.client.get("/api/mobile/forms/")
        self.assertJSONResponse(response, 200)

        self.assertValidFormListData(response.json(), 0)

    def test_forms_list_empty_for_user(self):
        """GET /mobile/forms/ with a user that has no access to any form"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get("/api/mobile/forms/")
        self.assertJSONResponse(response, 200)

        self.assertValidFormListData(response.json(), 0)

    def test_forms_list_ok(self):
        """GET /mobile/forms/  happy path: we expect one result as one form has no version"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/forms/", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)
        self.assertValidFormListData(response.json(), 1)

    def test_forms_list_ok_hide_derived_forms(self):
        """GET /mobile/forms/ web app happy path: we expect 1 results if one of the form is marked as derived"""

        response = self.client.get(f"/api/mobile/forms/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertValidFormListData(response.json(), 1)

        self.form_2.derived = True
        self.form_2.save()

        response = self.client.get(f"/api/mobile/forms/?app_id={self.project_1.app_id}")
        self.assertJSONResponse(response, 200)
        self.assertValidFormListData(response.json(), 0)

    def test_forms_list_date_to_inclusive(self):
        """GET /mobile/forms/ web app happy path: to_date should be inclusive"""

        date_to = self.now.strftime("%Y-%m-%d")
        self.client.force_authenticate(self.yoda)
        response = self.client.get(
            f"/api/mobile/forms/?date_to={date_to}", headers={"Content-Type": "application/json"}
        )
        self.assertJSONResponse(response, 200)
        self.assertValidFormListData(response.json(), 1)

    def test_forms_list_paginated(self):
        """GET /mobile/forms/ paginated happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/forms/?limit=1&page=1", headers={"Content-Type": "application/json"})
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidFormListData(response_data, 1, True)
        self.assertEqual(response_data["page"], 1)
        self.assertEqual(response_data["pages"], 1)
        self.assertEqual(response_data["limit"], 1)
        self.assertEqual(response_data["count"], 1)

    def test_forms_list_csv_with_flag(self):
        """GET /mobile/forms/ csv happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/forms/?csv=1", headers={"Content-Type": "application/json"})
        self.assertFileResponse(response, 200, "text/csv", expected_attachment_filename="forms.csv", streaming=True)

    def test_forms_list_csv_using_header(self):
        """GET /mobile/forms/ csv happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/forms/?format=csv", headers={"Content-Type": "text/csv"})
        self.assertFileResponse(response, 200, "text/csv; charset=utf-8")

    def test_forms_list_xslx(self):
        """GET /mobile/forms/ xslx happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get("/api/mobile/forms/?xlsx=1", headers={"Content-Type": "application/json"})
        self.assertFileResponse(
            response,
            200,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            expected_attachment_filename="forms.xlsx",
        )

    def test_forms_retrieve_without_auth(self):
        """GET /mobile/forms/<form_id> without auth should result in a 404"""

        response = self.client.get(f"/api/mobile/forms/{self.form_1.id}/")
        self.assertJSONResponse(response, 404)

    def test_forms_retrieve_wrong_auth(self):
        """GET /mobile/forms/<form_id> with auth of unrelated user should result in a 404"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.get(f"/api/mobile/forms/{self.form_1.id}/")
        self.assertJSONResponse(response, 404)

    def test_forms_retrieve_not_found(self):
        """GET /mobile/forms/<form_id>: id does not exist"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/mobile/forms/292003030/")
        self.assertJSONResponse(response, 404)

    def test_forms_retrieve_ok_1(self):
        """GET /mobile/forms/<form_id> happy path (simple form)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/mobile/forms/{self.form_2.id}/")
        self.assertJSONResponse(response, 200)
        self.assertValidFormData(response.json())

    def test_forms_retrieve_ok_2(self):
        """GET /mobile/forms/<form_id> happy path (more complex form, additional fields)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.get(f"/api/mobile/forms/{self.form_2.id}/")
        self.assertJSONResponse(response, 200)

        form_data = response.json()
        self.assertValidFullFormData(form_data)
        self.assertEqual(1, form_data["instances_count"])

    def test_forms_create_ok(self):
        """POST /mobile/forms/ happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/mobile/forms/",
            data={
                "name": "test form 1",
                "period_type": "MONTH",
                "project_ids": [self.project_1.id],
                "org_unit_type_ids": [self.jedi_council.id, self.jedi_academy.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)

        response_data = response.json()
        self.assertValidFormData(response_data)
        form = m.Form.objects.get(pk=response_data["id"])
        self.assertEqual(1, form.projects.count())
        self.assertEqual(2, form.org_unit_types.count())

    def test_forms_create_ok_extended(self):
        """POST /mobile/forms/ happy path (more fields)"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/mobile/forms/",
            data={
                "name": "test form 2",
                "period_type": "QUARTER",
                "device_field": "deviceid",
                "location_field": "position",
                "single_per_period": True,
                "periods_before_allowed": 2,
                "periods_after_allowed": 10,
                "project_ids": [self.project_1.id],
                "org_unit_type_ids": [self.jedi_council.id, self.jedi_academy.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 201)

        response_data = response.json()
        self.assertValidFormData(response_data)
        self.assertHasField(response_data, "location_field", str)
        self.assertHasField(response_data, "device_field", str)
        self.assertEqual(response_data["periods_before_allowed"], 2)
        self.assertEqual(response_data["periods_after_allowed"], 10)

    def test_forms_create_without_auth(self):
        """POST /mobile/forms/ without auth: 401"""

        response = self.client.post(f"/api/mobile/forms/", data={"name": "test form"}, format="json")
        self.assertJSONResponse(response, 401)

    def test_forms_create_wrong_permission(self):
        """POST /mobile/forms/ with auth but not the proper permission: 403"""

        self.client.force_authenticate(self.iron_man)
        response = self.client.post(f"/api/mobile/forms/", data={"name": "test form"}, format="json")
        self.assertJSONResponse(response, 403)

    def test_forms_create_invalid_1(self):
        """POST /mobile/forms/ with a lot of missing/invalid data"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/mobile/forms/", data={"period_type": "LOL", "single_per_period": "Oui"}, format="json"
        )
        self.assertJSONResponse(response, 400)

        response_data = response.json()
        self.assertHasError(response.json(), "name")
        self.assertHasError(response_data, "period_type")
        self.assertHasError(response_data, "single_per_period")
        self.assertHasError(response_data, "project_ids")
        self.assertHasError(response_data, "org_unit_type_ids")

    def test_forms_create_invalid_2(self):
        """POST /mobile/forms/ specific check for allow_empty"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(f"/api/mobile/forms/", data={"project_ids": []}, format="json")
        self.assertJSONResponse(response, 400)

        response_data = response.json()
        self.assertHasError(response_data, "project_ids")

    def test_forms_create_invalid_3(self):
        """POST /mobile/forms/ with wrong values for None period type"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/mobile/forms/",
            data={
                "name": "test form 2",
                "period_type": None,
                "single_per_period": True,
                "periods_before_allowed": 3,
                "periods_after_allowed": 3,
                "project_ids": [self.project_1.id],
                "org_unit_type_ids": [self.jedi_council.id, self.jedi_academy.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 400)

        response_data = response.json()
        self.assertHasError(response_data, "periods_before_allowed")
        self.assertHasError(response_data, "periods_after_allowed")

    def test_forms_create_wrong_project(self):
        """POST /mobile/forms/ - user has no access to the project"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.post(
            f"/api/mobile/forms/",
            data={
                "name": "test form",
                "form_id": "test_001",
                "period_type": "MONTH",
                "single_per_period": False,
                "project_ids": [self.project_1.id],
                "org_unit_type_ids": [self.jedi_council.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "project_ids", "Invalid project ids")

    def test_forms_create_wrong_org_unit_types(self):
        """POST /mobile/forms/ - mismatch between project and org unit types"""

        self.client.force_authenticate(self.yoda)
        response = self.client.post(
            f"/api/mobile/forms/",
            data={
                "name": "another test form",
                "form_id": "test_002",
                "period_type": "MONTH",
                "single_per_period": False,
                "project_ids": [self.project_1.id],
                "org_unit_type_ids": [self.sith_guild.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 400)
        self.assertHasError(response.json(), "org_unit_type_ids", "Invalid org unit type ids")

    def test_forms_update_ok(self):
        """PUT /mobile/forms/<form_id>: happy path (validation is already covered by create tests)"""

        """POST /mobile/forms/ happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.put(
            f"/api/mobile/forms/{self.form_2.id}/",
            data={
                "name": "test form 2 (updated)",
                "period_type": "QUARTER",
                "single_per_period": True,
                "device_field": "deviceid",
                "location_field": "location",
                "project_ids": [self.project_1.id, self.project_2.id],
                "org_unit_type_ids": [self.jedi_council.id],
            },
            format="json",
        )
        self.assertJSONResponse(response, 200)

        response_data = response.json()
        self.assertValidFormData(response_data)
        self.assertEqual(response_data["name"], "test form 2 (updated)")
        self.assertEqual(response_data["period_type"], "QUARTER")
        self.assertTrue(response_data["single_per_period"])
        self.assertEqual(response_data["device_field"], "deviceid")
        self.assertEqual(response_data["location_field"], "location")

        form = m.Form.objects.get(pk=response_data["id"])
        self.assertEqual(2, form.projects.count())
        self.assertEqual(1, form.org_unit_types.count())

    def test_forms_destroy_ok(self):
        """DELETE /mobile/forms/<form_id> happy path"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f"/api/mobile/forms/{self.form_2.id}/", format="json")
        self.assertJSONResponse(response, 204)

        self.assertIsNotNone(Form.objects_only_deleted.get(pk=self.form_2.id))
        self.assertFalse(Form.objects.filter(pk=self.form_2.id).exists())

    def test_forms_destroy_with_instances(self):
        """DELETE /mobile/forms/<form_id> form has instance: cannot be deleted"""

        self.client.force_authenticate(self.yoda)
        response = self.client.delete(f"/api/mobile/forms/{self.form_2.id}/", format="json")
        self.assertJSONResponse(response, 204)

    def test_forms_can_restore_deleted_form(self):
        """PATCH /mobile/forms/<form_id>/?only_deleted=1"""
        self.form_2.delete()

        self.assertIsNotNone(Form.objects_only_deleted.get(pk=self.form_2.id))
        self.assertFalse(Form.objects.filter(pk=self.form_2.id).exists())

        self.client.force_authenticate(self.yoda)
        response = self.client.patch(
            f"/api/mobile/forms/{self.form_2.id}/?only_deleted=1",
            format="json",
            headers={"accept": "application/json"},
            data={
                "deleted_at": None,
            },
        )

        self.assertJSONResponse(response, 200)

        self.assertIsNotNone(Form.objects.get(pk=self.form_2.id))
        self.assertFalse(Form.objects_only_deleted.filter(pk=self.form_2.id).exists())

    def test_forms_destroy_wrong_auth(self):
        """DELETE /mobile/forms/<form_id> with user that cannot access form -> 404"""

        self.client.force_authenticate(self.raccoon)
        response = self.client.delete(f"/api/mobile/forms/{self.form_1.id}/", format="json")
        self.assertJSONResponse(response, 404)

    def test_forms_destroy_no_auth(self):
        """DELETE /mobile/forms/<form_id> without auth -> 401"""

        response = self.client.delete(f"/api/mobile/forms/{self.form_1.id}/", format="json")
        self.assertJSONResponse(response, 401)

    # noinspection DuplicatedCode
    def assertValidFormListData(self, list_data: typing.Mapping, expected_length: int, paginated: bool = False):
        self.assertValidListData(
            list_data=list_data, expected_length=expected_length, results_key="forms", paginated=paginated
        )

        for form_data in list_data["forms"]:
            self.assertValidFormData(form_data)

    # noinspection DuplicatedCode
    def assertValidFormData(self, form_data: typing.Mapping):
        self.assertHasField(form_data, "id", int)
        self.assertHasField(form_data, "name", str)
        self.assertHasField(form_data, "periods_before_allowed", int)
        self.assertHasField(form_data, "periods_after_allowed", int)
        self.assertHasField(form_data, "created_at", float)
        self.assertHasField(form_data, "updated_at", float)
        self.assertHasField(form_data, "reference_form_of_org_unit_types", list)

    # noinspection DuplicatedCode
    def assertValidFullFormData(self, form_data: typing.Mapping):
        self.assertValidFormData(form_data)

        self.assertHasField(form_data, "device_field", str)
        self.assertHasField(form_data, "location_field", str)
        self.assertHasField(form_data, "form_id", str)
        self.assertHasField(form_data, "period_type", str)
        self.assertHasField(form_data, "single_per_period", bool)
        self.assertHasField(form_data, "org_unit_types", list)
        self.assertHasField(form_data, "projects", list)
        self.assertHasField(form_data, "instances_count", int)
        self.assertHasField(form_data, "instance_updated_at", float)

        for org_unit_type_data in form_data["org_unit_types"]:
            self.assertIsInstance(org_unit_type_data, dict)
            self.assertHasField(org_unit_type_data, "id", int)

        for org_unit_type_data in form_data["reference_form_of_org_unit_types"]:
            self.assertIsInstance(org_unit_type_data, dict)
            self.assertHasField(org_unit_type_data, "id", int)

        for project_data in form_data["projects"]:
            self.assertIsInstance(project_data, dict)
            self.assertHasField(project_data, "id", int)

        self.assertHasField(form_data, "instance_updated_at", float)
        self.assertHasField(form_data, "instances_count", int)
        self.assertHasField(form_data, "latest_form_version", dict)
        self.assertHasField(form_data["latest_form_version"], "id", int)
        self.assertHasField(form_data["latest_form_version"], "version_id", str)
        self.assertHasField(form_data["latest_form_version"], "file", str)
        self.assertHasField(form_data["latest_form_version"], "created_at", float)
        self.assertHasField(form_data["latest_form_version"], "updated_at", float)
