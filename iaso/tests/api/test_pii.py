import csv
import io
import json

from django.test import SimpleTestCase

from hat.audit.models import INSTANCE_API, log_modification
from iaso import models as m
from iaso.permissions.core_permissions import (
    CORE_ENTITIES_PERMISSION,
    CORE_FORMS_PERMISSION,
    CORE_SUBMISSIONS_PERMISSION,
    CORE_SUBMISSIONS_PII_PERMISSION,
)
from iaso.test import APITestCase
from iaso.utils.pii import filter_pii, filter_submission_files, get_allowed_fields, jsonlogic_vars


class FilterPiiTestCase(SimpleTestCase):
    def test_keeps_only_whitelisted_questions(self):
        allowed = frozenset({"muac", "_version"})
        self.assertEqual(
            filter_pii({"muac": "12.5", "first_name": "Amina", "_version": "1"}, allowed),
            {"muac": "12.5", "_version": "1"},
        )

    def test_is_case_insensitive(self):
        self.assertEqual(filter_pii({"MUAC": "12"}, frozenset({"muac"})), {"MUAC": "12"})

    def test_repeat_groups_keep_whitelisted_children_only(self):
        data = {"children": [{"child_name": "A", "child_age": 2}, {"child_name": "B"}], "name": "X"}
        self.assertEqual(filter_pii(data, frozenset({"child_age"})), {"children": [{"child_age": 2}]})

    def test_meta_keeps_only_technical_keys(self):
        allowed = get_allowed_fields(m.Form(non_pii_fields=[]), None)
        self.assertEqual(
            filter_pii({"meta": {"instanceID": "uuid:1", "instanceName": "Amina"}}, allowed),
            {"meta": {"instanceID": "uuid:1"}},
        )

    def test_list_of_values_is_a_leaf(self):
        self.assertEqual(filter_pii({"choices": ["a", "b"]}, frozenset()), {})
        self.assertEqual(filter_pii({"choices": ["a", "b"]}, frozenset({"choices"})), {"choices": ["a", "b"]})

    def test_form_without_configuration_is_not_filtered(self):
        self.assertIsNone(get_allowed_fields(m.Form(non_pii_fields=None), None))

    def test_files_of_hidden_questions_are_removed(self):
        files = ["https://s3/instancefiles/face_123.jpg", "https://s3/instancefiles/stock_456.jpg?sig=1"]
        self.assertEqual(
            filter_submission_files(files, {"stock_photo": "stock_456.jpg"}),
            ["https://s3/instancefiles/stock_456.jpg?sig=1"],
        )

    def test_jsonlogic_vars(self):
        logic = {"and": [{"==": [{"var": "gender"}, "F"]}, {">": [{"var": ["age__int__"]}, 3]}]}
        self.assertEqual(jsonlogic_vars(logic), {"gender", "age__int__"})


class PiiAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        source = m.DataSource.objects.create(name="Source")
        version = m.SourceVersion.objects.create(data_source=source, number=1)
        cls.account.default_version = version
        cls.account.save()
        cls.project = m.Project.objects.create(name="Project", app_id="project", account=cls.account)
        source.projects.add(cls.project)
        cls.org_unit = m.OrgUnit.objects.create(name="Clinic", version=version, validation_status="VALID")

        cls.form = m.Form.objects.create(
            name="Visit",
            form_id="visit",
            non_pii_fields=["muac", "district"],
            summary_fields=["muac"],
            possible_fields=[
                {"name": "first_name", "label": "First name", "type": "text"},
                {"name": "muac", "label": "MUAC", "type": "decimal"},
                {"name": "district", "label": "District", "type": "text"},
            ],
        )
        cls.form.projects.add(cls.project)
        cls.open_form = m.Form.objects.create(name="Open", form_id="open")
        cls.open_form.projects.add(cls.project)

        cls.entity_type = m.EntityType.objects.create(
            name="Child", account=cls.account, reference_form=cls.form, fields_list_view=["first_name", "muac"]
        )
        cls.entity = m.Entity.objects.create(entity_type=cls.entity_type, account=cls.account)
        cls.instance = cls.create_form_instance(
            form=cls.form,
            project=cls.project,
            org_unit=cls.org_unit,
            entity=cls.entity,
            json={"first_name": "Amina", "muac": "12.5", "district": "North", "_version": "1"},
        )
        cls.entity.attributes = cls.instance
        cls.entity.save()
        cls.open_instance = cls.create_form_instance(
            form=cls.open_form, project=cls.project, org_unit=cls.org_unit, json={"first_name": "Fatou"}
        )

        permissions = [CORE_SUBMISSIONS_PERMISSION, CORE_ENTITIES_PERMISSION, CORE_FORMS_PERMISSION]
        cls.user = cls.create_user_with_profile(username="user", account=cls.account, permissions=permissions)
        cls.pii_user = cls.create_user_with_profile(
            username="pii_user", account=cls.account, permissions=permissions + [CORE_SUBMISSIONS_PII_PERMISSION]
        )

    def test_instance_detail_hides_pii(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(self.client.get(f"/api/instances/{self.instance.id}/"), 200)
        self.assertEqual(data["file_content"], {"muac": "12.5", "district": "North", "_version": "1"})
        self.assertIsNone(data["file_url"])
        self.assertEqual(data["hidden_fields"], ["first_name"])
        self.assertEqual(data["summary_fields"], ["muac"])
        self.assertNotIn("Amina", json.dumps(data))

    def test_instance_detail_with_pii_permission(self):
        self.client.force_authenticate(self.pii_user)
        data = self.assertJSONResponse(self.client.get(f"/api/instances/{self.instance.id}/"), 200)
        self.assertEqual(data["file_content"]["first_name"], "Amina")
        self.assertEqual(data["hidden_fields"], [])

    def test_form_without_configuration_is_not_filtered(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(self.client.get(f"/api/instances/{self.open_instance.id}/"), 200)
        self.assertEqual(data["file_content"], {"first_name": "Fatou"})

    def test_instance_list_hides_pii(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(
            self.client.get("/api/instances/", {"form_ids": self.form.id, "limit": 10, "page": 1}), 200
        )
        self.assertEqual(data["instances"][0]["file_content"]["muac"], "12.5")
        self.assertNotIn("Amina", json.dumps(data))

    def _assert_csv_export_hides_pii_columns(self, params):
        m.FormVersion.objects.create(
            form=self.form,
            version_id="1",
            form_descriptor={
                "name": "visit",
                "type": "survey",
                "children": [
                    {"name": "first_name", "type": "text", "label": "First name"},
                    {"name": "muac", "type": "decimal", "label": "MUAC"},
                ],
            },
        )
        self.client.force_authenticate(self.user)
        response = self.client.get("/api/instances/", {"form_ids": self.form.id, "csv": "true", **params})
        self.assertEqual(response.status_code, 200)
        content = b"".join(response.streaming_content).decode()
        header = next(csv.reader(io.StringIO(content)))
        self.assertIn("muac", header)
        self.assertNotIn("first_name", header)
        self.assertNotIn("Amina", content)

    def test_csv_export_hides_pii_columns(self):
        self._assert_csv_export_hides_pii_columns({})

    def test_legacy_csv_export_hides_pii_columns(self):
        self._assert_csv_export_hides_pii_columns({"engine": "legacy"})

    def test_json_content_filter_on_hidden_question_is_refused(self):
        self.client.force_authenticate(self.user)
        logic = json.dumps({"==": [{"var": "first_name"}, "Amina"]})
        response = self.client.get("/api/instances/", {"form_ids": self.form.id, "jsonContent": logic})
        self.assertEqual(response.status_code, 403)
        logic = json.dumps({"==": [{"var": "muac"}, "12.5"]})
        response = self.client.get("/api/instances/", {"form_ids": self.form.id, "jsonContent": logic})
        self.assertEqual(response.status_code, 200)

    def test_entity_detail_and_list_hide_pii(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(self.client.get(f"/api/entities/{self.entity.id}/"), 200)
        self.assertNotIn("Amina", json.dumps(data))
        self.assertEqual(data["attributes"]["file_content"]["muac"], "12.5")

        data = self.assertJSONResponse(self.client.get("/api/entities/", {"entity_type_ids": self.entity_type.id}), 200)
        self.assertNotIn("Amina", json.dumps(data))
        self.assertEqual([column["name"] for column in data["columns"]], ["muac"])

    def test_entity_search_does_not_match_hidden_questions(self):
        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(self.client.get("/api/entities/", {"search": "Amina"}), 200)
        self.assertEqual(data["count"], 0)
        data = self.assertJSONResponse(self.client.get("/api/entities/", {"search": "North"}), 200)
        self.assertEqual(data["count"], 1)

        self.client.force_authenticate(self.pii_user)
        data = self.assertJSONResponse(self.client.get("/api/entities/", {"search": "Amina"}), 200)
        self.assertEqual(data["count"], 1)

    def test_submission_logs_hide_pii(self):
        original = m.Instance.objects.get(id=self.instance.id)
        self.instance.json = {**self.instance.json, "first_name": "Aminata"}
        self.instance.save()
        log_modification(original, self.instance, INSTANCE_API, user=self.pii_user)

        self.client.force_authenticate(self.user)
        data = self.assertJSONResponse(
            self.client.get(
                "/api/logs/",
                {
                    "objectId": self.instance.id,
                    "contentType": "iaso.instance",
                    "fields": "past_value,new_value,field_diffs",
                },
            ),
            200,
        )
        self.assertNotIn("Amina", json.dumps(data))

    def test_form_api_saves_pii_configuration(self):
        self.client.force_authenticate(self.pii_user)
        response = self.client.patch(
            f"/api/forms/{self.open_form.id}/",
            {"non_pii_fields": ["district"], "summary_fields": ["district"]},
            format="json",
        )
        self.assertJSONResponse(response, 200)
        self.open_form.refresh_from_db()
        self.assertEqual(self.open_form.non_pii_fields, ["district"])
        self.assertEqual(self.open_form.summary_fields, ["district"])
