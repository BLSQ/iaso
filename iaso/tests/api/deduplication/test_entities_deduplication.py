from unittest import mock
from uuid import uuid4

from django.core.files import File
from django.core.files.uploadedfile import UploadedFile
from django.db import connection

import iaso.models.base as base

from beanstalk_worker.services import TestTaskService
from iaso import models as m
from iaso.models.deduplication import ValidationStatus
from iaso.test import APITestCase


def create_form_instance(form: m.Form = None, period: str = None, org_unit: m.OrgUnit = None, **kwargs):
    with open("iaso/tests/fixtures/test.xml", "rb") as xml_file:
        return m.Instance.objects.create(
            form=form, period=period, org_unit=org_unit, file=UploadedFile(xml_file), **kwargs
        )


def create_instance_and_entity(cls, entity_name, instance_json, form_version, orgunit=None, entity_type=None):
    if orgunit is None:
        orgunit = cls.default_orgunit

    if entity_type is None:
        entity_type = cls.default_entity_type

    tmp_inst = create_form_instance(
        form=cls.default_form,
        period="202001",
        org_unit=orgunit,
        project=cls.default_project,
        uuid=uuid4,
    )

    instance_json["_version"] = form_version

    tmp_inst.json = instance_json
    tmp_inst.save()

    same_entity_2 = m.Entity.objects.create(
        name=entity_name,
        entity_type=entity_type,
        attributes=tmp_inst,
        account=cls.default_account,
    )
    tmp_inst.entity = same_entity_2
    tmp_inst.save()

    setattr(cls, entity_name, same_entity_2)


class EntitiesDuplicationAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        # this needs to be run as a new DB is created every time
        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS fuzzystrmatch ;")

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
        form_version_id = "2020022401"
        with open("iaso/tests/fixtures/test.xml", "rb") as xml_file:
            with open("iaso/tests/fixtures/test_form_deduplication.xlsx", "rb") as xls_file:
                cls.default_form.form_versions.create(
                    file=UploadedFile(xml_file), xls_file=UploadedFile(xls_file), version_id=form_version_id
                )

        cls.default_form.update_possible_fields()
        cls.default_form.save()

        cls.default_entity_type = m.EntityType.objects.create(
            name="Default Entity Type", reference_form=cls.default_form, account=default_account
        )

        cls.another_entity_type = m.EntityType.objects.create(
            name="Another Entity Type", reference_form=cls.default_form, account=default_account
        )

        create_instance_and_entity(
            cls, "same_entity_1", {"Prenom": "same_instance", "Nom": "iaso", "Age": 20}, form_version_id
        )
        create_instance_and_entity(
            cls, "same_entity_2", {"Prenom": "same_instance", "Nom": "iaso", "Age": 20}, form_version_id
        )
        create_instance_and_entity(
            cls, "close_entity", {"Prenom": "same_instancX", "Nom": "iasX", "Age": 20}, form_version_id
        )
        create_instance_and_entity(
            cls, "far_entity", {"Prenom": "Far. Ent.", "Nom": "Yeeeeeaaaahhhhhhhhhhh", "Age": 99}, form_version_id
        )
        create_instance_and_entity(
            cls,
            "same_entity_in_other_ou",
            {"Prenom": "same_instance", "Nom": "iaso", "Age": 20},
            form_version_id,
            orgunit=cls.another_orgunit,
        )
        create_instance_and_entity(
            cls,
            "same_entity_other_entity_type",
            {"Prenom": "same_instance", "Nom": "iaso", "Age": 20},
            form_version_id,
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
                "parameters": [],
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
                "parameters": [],
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
                "parameters": [],
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
                "parameters": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_analyzes_user_with_readonly_permissions(self):
        self.client.force_authenticate(self.user_with_default_ou_ro)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["name", "last_name"],
                "algorithm": "inverse",
                "parameters": [],
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
                "fields": ["Prenom", "Nom", "Age"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        assert "analyze_id" in response.data

        analyze_id = response.data["analyze_id"]

        task_service = TestTaskService()
        task_service.run_all()

        response_analyze = self.client.get(f"/api/entityduplicates_analyzes/{analyze_id}/")

        self.assertEqual(response_analyze.status_code, 200)

        response_data = response_analyze.data

        self.assertEqual(response_data["status"], "SUCCESS")
        self.assertEqual(response_data["entity_type_id"], str(self.default_entity_type.id))
        self.assertEqual(response_data["fields"], ["Prenom", "Nom", "Age"])
        self.assertEqual(response_data["algorithm"], "levenshtein")
        self.assertEqual(response_data["parameters"], {})
        self.assertEqual(response_data["created_by"]["id"], self.user_with_default_ou_rw.id)

        response_duplicate = self.client.get("/api/entityduplicates/")

        self.assertEqual(response_duplicate.status_code, 200)
        assert len(response_duplicate.data["results"]) == 6

        datas = [
            {"entity1": self.same_entity_2.id, "entity2": self.same_entity_1.id, "similarity_score": 100},
            {"entity1": self.close_entity.id, "entity2": self.same_entity_1.id, "similarity_score": 78},
            {"entity1": self.same_entity_in_other_ou.id, "entity2": self.same_entity_1.id, "similarity_score": 100},
            {"entity1": self.same_entity_in_other_ou.id, "entity2": self.same_entity_2.id, "similarity_score": 100},
            {"entity1": self.close_entity.id, "entity2": self.same_entity_2.id, "similarity_score": 78},
            {"entity1": self.same_entity_in_other_ou.id, "entity2": self.close_entity.id, "similarity_score": 78},
        ]
        for data in datas:
            for result in response_duplicate.data["results"]:
                if result["entity1"]["id"] == data["entity1"] and result["entity2"]["id"] == data["entity2"]:
                    self.assertEqual(result["ignored"], False)
                    self.assertEqual(result["similarity"], data["similarity_score"])
                    self.assertEqual(result["analyzis"][0]["analyze_id"], analyze_id)
                    break

    def test_detail_of_duplicate(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom", "Age"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        # we need to have some duplicates in DB

        duplicate = m.EntityDuplicate.objects.first()

        resp = self.client.get(f"/api/entityduplicates/detail/?entities={duplicate.entity1.id},{duplicate.entity2.id}")

        self.assertEqual(resp.status_code, 200)  # check if response status is OK

        resp_data = resp.json()

        # verify the response structure
        self.assertIn("fields", resp_data)
        self.assertIn("descriptor1", resp_data)

        fields = resp_data["fields"]

        # we know that at least two fields were involved in duplicate detection
        self.assertGreaterEqual(len(fields), 2)

        for field in fields:
            self.assertIn("the_field", field)
            self.assertIn("entity1", field)
            self.assertIn("entity2", field)
            self.assertIn("final", field)

            self.assertIn("field", field["the_field"])
            self.assertIn("label", field["the_field"])

            self.assertIn("value", field["entity1"])
            self.assertIn("id", field["entity1"])

            self.assertIn("value", field["entity2"])
            self.assertIn("id", field["entity2"])

            self.assertIn("value", field["final"])
            self.assertIn("id", field["final"])

        # descriptor1 checking
        descriptor1 = resp_data["descriptor1"]

        self.assertIn("name", descriptor1)
        self.assertIn("type", descriptor1)
        self.assertIn("title", descriptor1)
        self.assertIn("version", descriptor1)
        self.assertIn("children", descriptor1)

        for child in descriptor1["children"]:
            self.assertIn("name", child)
            self.assertIn("type", child)

    def test_partial_update_analyze(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        analyze_id = response.data["analyze_id"]

        # we didnt run task_service = TestTaskService() task_service.run_all() so it should still be queued

        response = self.client.patch(f"/api/entityduplicates_analyzes/{analyze_id}/", data={"status": base.KILLED})
        self.assertEqual(response.status_code, 200)

        analyze = m.EntityDuplicateAnalyzis.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.KILLED)

        task_service = TestTaskService()
        task_service.run_all()  # nothing should run

        analyze = m.EntityDuplicateAnalyzis.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.KILLED)

        response = self.client.patch(f"/api/entityduplicates_analyzes/{analyze_id}/", data={"status": base.QUEUED})
        self.assertEqual(response.status_code, 200)

        analyze = m.EntityDuplicateAnalyzis.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.QUEUED)

        task_service = TestTaskService()
        task_service.run_all()  # Now it should run

        analyze = m.EntityDuplicateAnalyzis.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.SUCCESS)

        # this should fail because we cant change status to QUEUED after it was run
        response = self.client.patch(f"/api/entityduplicates_analyzes/{analyze_id}/", data={"status": "QUEUED"})
        self.assertEqual(response.status_code, 400)

        analyze = m.EntityDuplicateAnalyzis.objects.get(id=analyze_id)
        self.assertEqual(analyze.task.status, base.SUCCESS)

    def test_ignore_entity_duplicate(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        duplicate = m.EntityDuplicate.objects.first()

        self.assertEqual(duplicate.validation_status, ValidationStatus.PENDING)

        response = self.client.post(
            "/api/entityduplicates/",
            data={
                "ignore": True,
                "reason": "test",
                "entity1_id": duplicate.entity1.id,
                "entity2_id": duplicate.entity2.id,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn("entity1_id", response_data)
        self.assertIn("entity2_id", response_data)
        self.assertIn("ignored", response_data)

        # entity1_id should be the same as duplicate.entity1.id
        self.assertEqual(response_data["entity1_id"], duplicate.entity1.id)
        # entity2_id should be the same as duplicate.entity2.id
        self.assertEqual(response_data["entity2_id"], duplicate.entity2.id)
        # ignore should be True
        self.assertEqual(response_data["ignored"], True)

        duplicate = m.EntityDuplicate.objects.get(id=duplicate.id)
        self.assertEqual(duplicate.validation_status, ValidationStatus.IGNORED)
        self.assertEqual(duplicate.metadata["ignored_reason"], "test")

        # we cant ignore it again
        response = self.client.post(
            "/api/entityduplicates/",
            data={"ignore": True, "entity1_id": duplicate.entity1.id, "entity2_id": duplicate.entity2.id},
            format="json",
        )

        self.assertContains(response, "This duplicate has already been validated or ignored", status_code=400)

        # we can't merge it after it was ignored
        merged_data = {i: duplicate.entity1.id for i in duplicate.analyze.metadata["fields"]}
        response = self.client.post(
            "/api/entityduplicates/",
            data={"merge": merged_data, "entity1_id": duplicate.entity1.id, "entity2_id": duplicate.entity2.id},
            format="json",
        )

        self.assertContains(response, "This duplicate has already been validated or ignored", status_code=400)

    def test_merge_entity_duplicate(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        duplicate = m.EntityDuplicate.objects.first()

        self.assertEqual(duplicate.validation_status, ValidationStatus.PENDING)

        entity1 = duplicate.entity1
        entity2 = duplicate.entity2

        merged_data = {i: entity1.id for i in duplicate.analyze.metadata["fields"]}

        response = self.client.post(
            "/api/entityduplicates/",
            data={"merge": merged_data, "entity1_id": entity1.id, "entity2_id": entity2.id},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertIn("entity1_id", response_data)
        self.assertIn("entity2_id", response_data)
        self.assertIn("ignored", response_data)
        self.assertIn("new_entity_id", response_data)

        # entity1_id should be the same as entity1.id
        self.assertEqual(response_data["entity1_id"], entity1.id)
        # entity2_id should be the same as entity2.id
        self.assertEqual(response_data["entity2_id"], entity2.id)
        # ignore should be True
        self.assertEqual(response_data["ignored"], False)

        # Verify DB updates were correctly done
        entity1.refresh_from_db()
        entity2.refresh_from_db()
        self.assertIsNotNone(entity1.deleted_at)
        self.assertIsNotNone(entity2.deleted_at)
        self.assertEqual(entity1.merged_to_id, response_data["new_entity_id"])
        self.assertEqual(entity2.merged_to_id, response_data["new_entity_id"])

    def test_filter_search_term_ok(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        resp = self.client.get("/api/entityduplicates/?search=iaso")

        resp_json = resp.json()

        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp_json["results"]), 6)

    def test_detail_empty_form_version_correct_error(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom", "Age"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        # we need to have some duplicates in DB

        duplicate = m.EntityDuplicate.objects.first()

        # we need to remove the version from the json to test this case
        orig_json = duplicate.entity1.attributes.json
        orig_version_id = orig_json["_version"]
        del orig_json["_version"]
        duplicate.entity1.attributes.json = orig_json
        duplicate.entity1.attributes.save()

        resp = self.client.get(f"/api/entityduplicates/detail/?entities={duplicate.entity1.id},{duplicate.entity2.id}")

        self.assertContains(resp, "No form version for attibutes of entity", status_code=404)

        orig_json = duplicate.entity1.attributes.json
        orig_json["_version"] = orig_version_id
        duplicate.entity1.attributes.json = orig_json
        duplicate.entity1.attributes.save()

    def test_duplicate_visibility_across_accounts(self):
        # You shouldn't see duplicates from another account

        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom", "Age"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        assert "analyze_id" in response.data

        analyze_id = response.data["analyze_id"]

        task_service = TestTaskService()
        task_service.run_all()

        response_analyze = self.client.get(f"/api/entityduplicates_analyzes/{analyze_id}/")

        self.assertEqual(response_analyze.status_code, 200)

        response = self.client.get("/api/entityduplicates/")

        self.assertNotEqual(response.data["results"], [])

        account_2 = m.Account.objects.create(name="Account 2")

        user2 = self.create_user_with_profile(
            username="user__2",
            account=account_2,
            permissions=["iaso_entity_duplicates_read", "iaso_entity_duplicates_write"],
        )

        # Authenticate as user2 and check if we see the duplicate
        self.client.force_authenticate(user2)

        response = self.client.get("/api/entityduplicates/")

        self.assertEqual(response.data["results"], [])

    # WC2-532 Merge entities with instance containing emoji
    def test_merge_entity_duplicate_with_emoji(self):
        self.client.force_authenticate(self.user_with_default_ou_rw)

        response = self.client.post(
            "/api/entityduplicates_analyzes/",
            {
                "entity_type_id": self.default_entity_type.id,
                "fields": ["Prenom", "Nom"],
                "algorithm": "levenshtein",
                "parameters": [],
            },
            format="json",
        )

        task_service = TestTaskService()
        task_service.run_all()

        duplicate = m.EntityDuplicate.objects.first()

        self.assertEqual(duplicate.validation_status, ValidationStatus.PENDING)

        entity1 = duplicate.entity1
        entity2 = duplicate.entity2

        # Now add a form instance with an emoji to entity1
        with open("iaso/tests/fixtures/submission_with_emoji.xml", "rb") as xml_file:
            instance = m.Instance.objects.create(
                entity=entity1,
                form=self.default_form,
                org_unit=self.default_orgunit,
                file=UploadedFile(xml_file),
            )
        json_instance = instance.get_and_save_json_of_xml()
        # make sure the emoji is there
        self.assertEqual(json_instance["prevous_muac_color"], "🟡Yellow")

        merged_data = {i: entity1.id for i in duplicate.analyze.metadata["fields"]}

        response = self.client.post(
            "/api/entityduplicates/",
            data={"merge": merged_data, "entity1_id": entity1.id, "entity2_id": entity2.id},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        # Verify DB updates were correctly done
        entity1.refresh_from_db()
        entity2.refresh_from_db()
        self.assertIsNotNone(entity1.deleted_at)
        self.assertIsNotNone(entity2.deleted_at)
        self.assertEqual(entity1.merged_to_id, response_data["new_entity_id"])
        self.assertEqual(entity2.merged_to_id, response_data["new_entity_id"])

        merged = entity1.merged_to
        self.assertEqual(merged.instances.count(), 2)  # reference form + emoji form
        self.assertEqual(merged.instances.last().json["prevous_muac_color"], "🟡Yellow")
