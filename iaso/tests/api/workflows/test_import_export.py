from iaso.models import Workflow
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.tests.api.workflows.base import BaseWorkflowsAPITestCase
from iaso.tests.utils.test_utils import var_dump, obj_compare
from iaso.models import Account, EntityType
from uuid import uuid4

BASE_API = "/api/workflows/"


class WorkflowsImportExportAPITestCase(BaseWorkflowsAPITestCase):
    def test_workflow_export_without_auth(self):
        response = self.client.get(f"{BASE_API}export/{self.workflow_et_adults_blue.pk}/", format="json")

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "not_authenticated")
        self.assertEqual(response.data["detail"], "Authentication credentials were not provided.")

    def test_workflow_export_user_anonymous(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.get(f"{BASE_API}export/{self.workflow_et_adults_blue.pk}/", format="json")

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_workflow_export_with_auth_no_permissions(self):
        self.client.force_authenticate(user=self.blue_adult_np)
        response = self.client.get(f"{BASE_API}export/{self.workflow_et_adults_blue.pk}/", format="json")

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_workflow_import_without_auth(self):
        response = self.client.post(f"{BASE_API}import/", format="json", data={})

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "not_authenticated")
        self.assertEqual(response.data["detail"], "Authentication credentials were not provided.")

    def test_workflow_import_user_anonymous(self):
        self.client.force_authenticate(user=self.anon)
        response = self.client.post(f"{BASE_API}import/", format="json", data={})

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_workflow_import_with_auth_no_permissions(self):
        self.client.force_authenticate(user=self.blue_adult_np)
        response = self.client.post(f"{BASE_API}import/", format="json", data={})

        self.assertJSONResponse(response, 403)
        self.assertEqual(response.data["detail"].code, "permission_denied")
        self.assertEqual(response.data["detail"], "You do not have permission to perform this action.")

    def test_workflow_export_import_simple(self):
        self.client.force_authenticate(user=self.blue_adult_1)

        r = self.client.get(f"{BASE_API}export/{self.workflow_et_adults_blue.pk}/", format="json")

        orig_wf = self.workflow_et_adults_blue
        orig_versions_count = orig_wf.workflow_versions.count()

        self.assertJSONResponse(r, 200)
        self.assertEqual(len(r.data["versions"]), orig_versions_count)
        self.assertEqual(r.data["entity_type"], orig_wf.entity_type.name)

        last_version = r.data["versions"][0]
        self.assertEqual(last_version["uuid"], orig_wf.workflow_versions.latest("created_at").uuid)
        self.assertEqual(last_version["status"], orig_wf.workflow_versions.latest("created_at").status)

        r2 = self.client.post(f"{BASE_API}import/", format="json", data=r.data)
        self.assertJSONResponse(r2, 200)
        self.assertEqual(r2.data["status"], f"Workflow {orig_wf.uuid} imported successfully")

        after_import_wf = Workflow.objects.get(pk=self.workflow_et_adults_blue.pk)

        res = obj_compare(orig_wf, after_import_wf)
        self.assertEqual(res, ({}, {}))

    def test_workflow_import_export_modify(self):
        self.client.force_authenticate(user=self.blue_adult_1)

        r = self.client.get(f"{BASE_API}export/{self.workflow_et_adults_blue.pk}/", format="json")

        orig_wf = self.workflow_et_adults_blue
        orig_versions_count = orig_wf.workflow_versions.count()
        orig_versions = list(orig_wf.workflow_versions.all())

        self.assertJSONResponse(r, 200)
        self.assertEqual(len(r.data["versions"]), orig_versions_count)
        self.assertEqual(r.data["entity_type"], orig_wf.entity_type.name)

        last_version = r.data["versions"][0]
        self.assertEqual(last_version["uuid"], orig_wf.workflow_versions.latest("created_at").uuid)
        self.assertEqual(last_version["status"], orig_wf.workflow_versions.latest("created_at").status)

        # Simulate a modification of the exported workflow
        r.data["versions"][2]["status"] = WorkflowVersionsStatus.DRAFT.value

        r2 = self.client.post(f"{BASE_API}import/", format="json", data=r.data)
        self.assertJSONResponse(r2, 200)
        self.assertEqual(r2.data["status"], f"Workflow {orig_wf.uuid} imported successfully")

        after_import_wf = Workflow.objects.get(pk=self.workflow_et_adults_blue.pk)
        after_import_first_version = after_import_wf.workflow_versions.first()

        res = obj_compare(orig_versions[0], after_import_first_version)

        assert "status" in res[0]
        assert "status" in res[1]
        assert "updated_at" in res[0]
        assert "updated_at" in res[1]

    def test_workflow_export_import_complex(self):
        self.client.force_authenticate(user=self.blue_adult_1)

        r = self.client.get(
            f"{BASE_API}export/{self.workflow_et_adults_blue_with_followups_and_changes.pk}/", format="json"
        )

        orig_wf = self.workflow_et_adults_blue_with_followups_and_changes
        orig_versions_count = orig_wf.workflow_versions.count()
        orig_version = orig_wf.workflow_versions.filter(status="DRAFT").first()
        orig_version_change = orig_version.changes.first()
        orig_version_first_followup = orig_version.follow_ups.order_by("created_at").first()

        self.assertJSONResponse(r, 200)
        self.assertEqual(len(r.data["versions"]), orig_versions_count)
        self.assertEqual(r.data["entity_type"], orig_wf.entity_type.name)

        exp_version = r.data["versions"][1]
        self.assertEqual(exp_version["uuid"], orig_version.uuid)
        self.assertEqual(exp_version["status"], orig_version.status)

        r.data["versions"][1]["changes"][0]["mapping"] = {"ton_champ": "ton_champ"}
        r.data["versions"][1]["follow_ups"][0]["condition"] = {"!=": [2, 2]}

        r2 = self.client.post(f"{BASE_API}import/", format="json", data=r.data)
        self.assertJSONResponse(r2, 200)
        self.assertEqual(r2.data["status"], f"Workflow {orig_wf.uuid} imported successfully")

        after_import_wf = Workflow.objects.get(pk=self.workflow_et_adults_blue_with_followups_and_changes.pk)
        after_import_first_version = after_import_wf.workflow_versions.filter(status="DRAFT").first()
        after_import_version_change = after_import_first_version.changes.first()
        after_import_version_first_followup = after_import_first_version.follow_ups.order_by("created_at").first()

        res = obj_compare(orig_wf, after_import_wf)
        self.assertEqual(res, ({}, {}))

        res1 = obj_compare(orig_version, after_import_first_version)
        self.assertEqual(res1, ({}, {}))

        res2 = obj_compare(orig_version_change, after_import_version_change)
        assert "id" in res2[0]
        assert "id" in res2[1]
        assert "mapping" in res2[0]
        assert "mapping" in res2[1]
        assert "updated_at" in res2[0]
        assert "updated_at" in res2[1]

        res3 = obj_compare(orig_version_first_followup, after_import_version_first_followup)
        assert "id" in res3[0]
        assert "id" in res3[1]
        assert "condition" in res3[0]
        assert "condition" in res3[1]
        assert "updated_at" in res3[0]
        assert "updated_at" in res3[1]

    # To verify that we are fixing bug WC2-262
    def test_simulate_import_on_another_instance(self):
        self.client.force_authenticate(user=self.blue_adult_1)

        r = self.client.get(
            f"{BASE_API}export/{self.workflow_et_adults_blue_with_followups_and_changes.pk}/", format="json"
        )

        orig_wf = self.workflow_et_adults_blue_with_followups_and_changes
        orig_versions_count = orig_wf.workflow_versions.count()
        orig_version = orig_wf.workflow_versions.filter(status="DRAFT").first()
        orig_version_change = orig_version.changes.first()
        orig_version_first_followup = orig_version.follow_ups.order_by("created_at").first()

        self.assertJSONResponse(r, 200)
        self.assertEqual(len(r.data["versions"]), orig_versions_count)
        self.assertEqual(r.data["entity_type"], orig_wf.entity_type.name)

        exp_version = r.data["versions"][1]
        self.assertEqual(exp_version["uuid"], orig_version.uuid)
        self.assertEqual(exp_version["status"], orig_version.status)

        r.data["versions"][1]["changes"][0]["mapping"] = {"ton_champ": "ton_champ"}
        r.data["versions"][1]["follow_ups"][0]["condition"] = {"!=": [2, 2]}

        blue_adults = Account.objects.get(name="Blue Adults")

        another_entity_type = EntityType.objects.create(
            name="Another entity type",
            created_at=self.now,
            account=blue_adults,
            reference_form=self.form_children_blue,
        )

        r.data["entity_type"] = another_entity_type.name
        r.data["uuid"] = uuid4()
        r.data["versions"][0]["uuid"] = uuid4()
        r.data["versions"][1]["uuid"] = uuid4()

        r2 = self.client.post(f"{BASE_API}import/", format="json", data=r.data)
        self.assertJSONResponse(r2, 200)
        self.assertEqual(r2.data["status"], f"Workflow {r.data['uuid']} imported successfully")
