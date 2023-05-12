from unittest import mock
from uuid import uuid4
from beanstalk_worker.services import TestTaskService

from django.core.files import File
from django.core.files.uploadedfile import UploadedFile

from iaso import models as m
from iaso.test import APITestCase

import iaso.models.base as base
from iaso.tests.api.workflows.base import var_dump
from django.db import connection


def create_instance_and_entity(cls, entity_name, instance_json, orgunit=None, entity_type=None):

    if orgunit is None:
        orgunit = cls.default_orgunit

    if entity_type is None:
        entity_type = cls.default_entity_type

    tmp_inst = cls.create_form_instance(
        form=cls.default_form,
        period="202001",
        org_unit=orgunit,
        project=cls.default_project,
        uuid=uuid4,
    )

    tmp_inst.json = instance_json
    tmp_inst.save()

    same_entity_2 = m.Entity.objects.create(
        name=entity_name,
        entity_type=entity_type,
        attributes=tmp_inst,
        account=cls.default_account,
    )

    setattr(cls, entity_name, same_entity_2)

    print(entity_name, same_entity_2.id)


class EntitiesDuplicationAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # this needs to be run as a new DB is created every time
        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION fuzzystrmatch;")

        default_account = m.Account.objects.create(name="Default account")

        cls.default_account = default_account

        default_ds = m.DataSource.objects.create(name="Default Data Source")
        cls.default_ds = default_ds
        default_sv = m.SourceVersion.objects.create(data_source=default_ds, number=1)
        default_account.default_version = default_sv
        default_account.save()

        cls.default_orgunit_type = m.OrgUnitType.objects.create(
            name="Default Org Unit Type", short_name="default_ou_type"
        )

        cls.default_orgunit = m.OrgUnit.objects.create(
            name="Default Org Unit",
            source_ref="default_test_orgunit_ref",
            version=default_sv,
            org_unit_type=cls.default_orgunit_type,
        )

        cls.another_orgunit_type = m.OrgUnitType.objects.create(
            name="Another Org Unit Type", short_name="another_ou_type"
        )

        cls.another_orgunit = m.OrgUnit.objects.create(
            name="Another Org Unit",
            source_ref="another_test_orgunit_ref",
            version=default_sv,
            org_unit_type=cls.another_orgunit_type,
        )

        cls.default_sv = default_sv

        cls.default_project = m.Project.objects.create(
            name="Default Project", app_id="default.test.project", account=default_account
        )

        cls.user_without_ou = cls.create_user_with_profile(
            username="user_without_ou", account=default_account, permissions=["iaso_entity_duplicates_read"]
        )

        cls.user_with_default_ou_ro = cls.create_user_with_profile(
            username="user_with_default_ou_ro",
            account=default_account,
            permissions=["iaso_entity_duplicates_read"],
            org_units=[cls.default_orgunit],
        )

        cls.user_with_default_ou_rw = cls.create_user_with_profile(
            username="user_with_default_ou_rw",
            account=default_account,
            permissions=["iaso_entity_duplicates_read", "iaso_entity_duplicates_write"],
            org_units=[cls.default_orgunit],
        )

        cls.user_with_other_ou_ro = cls.create_user_with_profile(
            username="user_with_other_ou_ro",
            account=default_account,
            permissions=["iaso_entity_duplicates_read"],
            org_units=[cls.another_orgunit],
        )

        cls.user_with_other_ou_rw = cls.create_user_with_profile(
            username="user_with_other_ou_rw",
            account=default_account,
            permissions=["iaso_entity_duplicates_read", "iaso_entity_duplicates_write"],
            org_units=[cls.another_orgunit],
        )

        cls.default_form = m.Form.objects.create(name="Default Form", period_type=m.MONTH, single_per_period=True)

        default_form_file_mock = mock.MagicMock(spec=File)
        default_form_file_mock.name = "test.xml"
        with open("iaso/tests/fixtures/test_form_deduplication.xlsx", "rb") as xls_file:
            cls.default_form.form_versions.create(
                file=default_form_file_mock, xls_file=UploadedFile(xls_file), version_id="2020022401"
            )

        cls.default_form.update_possible_fields()
        cls.default_form.save()

        cls.default_entity_type = m.EntityType.objects.create(
            name="Default Entity Type", reference_form=cls.default_form
        )

        cls.another_entity_type = m.EntityType.objects.create(
            name="Another Entity Type", reference_form=cls.default_form
        )

        create_instance_and_entity(cls, "same_entity_1", {"Prenom": "same_instance", "Nom": "iaso", "Age": 20})
        create_instance_and_entity(cls, "same_entity_2", {"Prenom": "same_instance", "Nom": "iaso", "Age": 20})
        create_instance_and_entity(cls, "close_entity", {"Prenom": "same_instancX", "Nom": "iasX", "Age": 20})
        create_instance_and_entity(
            cls, "far_entity", {"Prenom": "Far. Ent.", "Nom": "Yeeeeeaaaahhhhhhhhhhh", "Age": 99}
        )
        create_instance_and_entity(
            cls,
            "same_entity_in_other_ou",
            {"Prenom": "same_instance", "Nom": "iaso", "Age": 20},
            orgunit=cls.another_orgunit,
        )
        create_instance_and_entity(
            cls,
            "same_entity_other_entity_type",
            {"Prenom": "same_instance", "Nom": "iaso", "Age": 20},
            entity_type=cls.another_entity_type,
        )

    def test_analyze_user_without_orgunit(self):
        self.client.force_authenticate(self.user_without_ou)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["name", "last_name"],
                "algorithm": "inverse",
                "parameters": {},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_analyze_with_wrong_algorithm_name(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["name", "last_name"],
                "algorithm": "wrong",
                "parameters": {},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_analyze_with_wrong_field_name(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["name", "wrong"],
                "algorithm": "inverse",
                "parameters": {},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_analyze_without_auth_should_fail(self):
        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["name", "last_name"],
                "algorithm": "inverse",
                "parameters": {},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_analyzes_user_with_readonly_permissions(self):
        self.client.force_authenticate(self.user_with_default_ou_ro)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["name", "last_name"],
                "algorithm": "inverse",
                "parameters": {},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)

    def test_analyzes_happy_path(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": {},
            },
            format="json",
        )

        var_dump(response)

        self.assertEqual(response.status_code, 201)
        assert "analyze_id" in response.data

        analyze_id = response.data["analyze_id"]

        task_service = TestTaskService()
        task_service.run_all()

        response_analyze = self.client.get(f"/api/entityduplicates_analyzes/{analyze_id}/")

        # var_dump(response_analyze)

        self.assertEqual(response_analyze.status_code, 200)

        response_data = response_analyze.data

        self.assertEqual(response_data["status"], "SUCCESS")
        self.assertEqual(response_data["entity_type_id"], str(self.default_entity_type.id))
        self.assertEqual(response_data["fields"], ["Prenom", "Nom"])
        self.assertEqual(response_data["algorithm"], "levenshtein")
        self.assertEqual(response_data["parameters"], {})
        self.assertEqual(response_data["created_by"]["id"], self.user_with_default_ou_rw.id)

        response_duplicate = self.client.get(f"/api/entityduplicates/")

        print("response_duplicate data")
        var_dump(response_duplicate.data)

        self.assertEqual(response_duplicate.status_code, 200)
        assert len(response_duplicate.data["results"]) == 6

        datas = [
            {"entity1": self.same_entity_2.id, "entity2": self.same_entity_1.id, "similarity_score": 100},
            {"entity1": self.same_entity_in_other_ou.id, "entity2": self.same_entity_1.id, "similarity_score": 100},
            {"entity1": self.same_entity_in_other_ou.id, "entity2": self.same_entity_2.id, "similarity_score": 100},
            {"entity1": self.close_entity.id, "entity2": self.same_entity_1.id, "similarity_score": 67},
            {"entity1": self.close_entity.id, "entity2": self.same_entity_2.id, "similarity_score": 67},
            {"entity1": self.same_entity_in_other_ou.id, "entity2": self.close_entity.id, "similarity_score": 67},
        ]
        for idx, datas in enumerate(datas):
            self.assertEqual(response_duplicate.data["results"][idx]["ignored"], False)
            self.assertEqual(response_duplicate.data["results"][idx]["similarity"], datas["similarity_score"])
            self.assertEqual(response_duplicate.data["results"][idx]["entity1"]["id"], datas["entity1"])
            self.assertEqual(response_duplicate.data["results"][idx]["entity2"]["id"], datas["entity2"])
            self.assertEqual(response_duplicate.data["results"][idx]["analyzis"][0]["analyze_id"], analyze_id)

    def test_detail_of_duplicate(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": {},
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        # we need to have some duplicates in DB

        duplicate = m.EntityDuplicate.objects.first()

        resp = self.client.get(f"/api/entityduplicates/{duplicate.id}/detail/")

        var_dump(resp)

    def test_partial_update_analyze(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": {},
            },
            format="json",
        )

        analyze_id = response.data["analyze_id"]

        # we didnt run task_service = TestTaskService() task_service.run_all() so it should still be queued

        response = self.client.patch(f"/api/entityduplicates_analyzes/{analyze_id}/", data={"status": base.KILLED})
        self.assertEqual(response.status_code, 200)

        analyze = m.EntityDuplicateAnalyze.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.KILLED)

        task_service = TestTaskService()
        task_service.run_all()  # nothing should run

        analyze = m.EntityDuplicateAnalyze.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.KILLED)

        response = self.client.patch(f"/api/entityduplicates_analyzes/{analyze_id}/", data={"status": base.QUEUED})
        self.assertEqual(response.status_code, 200)

        analyze = m.EntityDuplicateAnalyze.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.QUEUED)

        task_service = TestTaskService()
        task_service.run_all()  # Now it should run

        analyze = m.EntityDuplicateAnalyze.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.SUCCESS)

        # this should fail because we cant change status to QUEUED after it was run
        response = self.client.patch(f"/api/entityduplicates_analyzes/{analyze_id}/", data={"status": "QUEUED"})
        self.assertEqual(response.status_code, 400)

        analyze = m.EntityDuplicateAnalyze.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.SUCCESS)
