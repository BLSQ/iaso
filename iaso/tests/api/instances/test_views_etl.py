from django.urls import reverse
from rest_framework import status

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, OrgUnit, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class ETLInstanceTestCase(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.john_doe = self.create_user_with_profile(username="john_doe", account=self.account)

        self.john_wick = self.create_user_with_profile(
            username="john_wick", account=self.account, permissions=[CORE_FORMS_PERMISSION]
        )
        self.superuser = self.create_user_with_profile(username="superuser", account=self.account, is_superuser=True)

        # create some projects
        self.project_1 = Project.objects.create(name="project_1", account=self.account)
        self.project_2 = Project.objects.create(name="project_2", account=self.account)
        self.project_3_without_account = Project.objects.create(name="project_3")

        # create forms
        self.form_1 = Form.objects.create(name="form_1", form_id="sample1")
        self.form_2 = Form.objects.create(name="form_2", form_id="sample2")
        self.form_3 = Form.objects.create(name="form_3", form_id="sample2")

        # create orgunits
        self.ou_1 = OrgUnit.objects.create(name="ou_1")
        self.ou_2 = OrgUnit.objects.create(name="ou_2", parent=self.ou_1)

        # create validation workflow
        self.vf = ValidationWorkflow.objects.create(name="test-vf", account=self.account)
        self.first_node = ValidationNodeTemplate.objects.create(name="Node 1", workflow=self.vf)
        self.second_node = ValidationNodeTemplate.objects.create(name="Node 2", workflow=self.vf)
        self.second_node.previous_node_templates.add(self.first_node)

        self.vf.form_set.add(self.form_1)

        # create instances

        self.instance_1 = self.create_form_instance(
            project=self.project_1,
            form=self.form_1,
            org_unit=self.ou_1,
            period="202001",
        )

        self.instance_2 = self.create_form_instance(
            project=self.project_2,
            form=self.form_2,
            org_unit=self.ou_2,
            period="202001",
        )

        self.instance_3 = self.create_form_instance(
            project=self.project_3_without_account,
            form=self.form_3,
            org_unit=self.ou_2,
        )

        ValidationWorkflowEngine.start(self.vf, self.john_doe, self.instance_1)
        ValidationWorkflowEngine.complete_node(
            self.instance_1.get_next_pending_nodes().first(), self.john_wick, self.instance_1, False, "Nope"
        )
        ValidationWorkflowEngine.start(self.vf, self.john_doe, self.instance_1)

    def assertValidData(self, data, expected_length):
        self.assertValidListData(list_data=data, results_key="results", expected_length=expected_length, paginated=True)
        self.assertResponseCompliantToSwagger(data, "PaginatedETLInstanceListList")

    def test_permissions(self):
        res = self.client.get(reverse("api-etl:instances-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("api-etl:instances-list"))
        self.assertJSONResponse(res, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:instances-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("api-etl:instances-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_filters(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:instances-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        res = self.client.get(reverse("api-etl:instances-list"), data={"form_ids": [self.form_1.pk, self.form_2.pk]})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        res = self.client.get(reverse("api-etl:instances-list"), data={"form_ids": [self.form_1.pk]})

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)

        self.assertEqual(res_data["results"][0]["form_id"], self.form_1.pk)

        res = self.client.get(reverse("api-etl:instances-list"), data={"form_ids": [self.form_2.pk]})

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)

        self.assertEqual(res_data["results"][0]["form_id"], self.form_2.pk)

        res = self.client.get(reverse("api-etl:instances-list"), data={"form_ids": [self.form_2.pk + 9999]})
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 0)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(10):
            # 1-2: PERMISSIONS
            # 3-5: queryset filter
            # 6-8: serializer
            # 8-10: get_and_save_json_of_xml method
            res = self.client.get(reverse("api-etl:instances-list"))

        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_response(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:instances-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        self.assertNotIn(self.instance_3.pk, [x["id"] for x in res_data["results"]])

        first_instance = res_data["results"][0]
        self.assertEqual(first_instance["id"], self.instance_1.pk)
        self.assertEqual(first_instance["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
        self.assertIsNotNone(first_instance["file_url"])
        self.assertIsNotNone(first_instance["file_content"])
        self.assertEqual(first_instance["form_id"], self.form_1.pk)

        org_unit = first_instance["org_unit"]

        self.assertEqual(org_unit["id"], self.ou_1.pk)
        self.assertEqual(org_unit["name"], "ou_1")
        self.assertIsNone(org_unit["parent_id"])
        self.assertIsNone(org_unit["org_unit_type_id"])
        self.assertEqual(org_unit["validation_status"], "NEW")
        self.assertIsNone(org_unit["aliases"])
        self.assertIsNotNone(org_unit["created_at"])
        self.assertIsNotNone(org_unit["updated_at"])

        history = first_instance["history"]

        self.assertEqual(len(history), 2)

        self.assertEqual(history[0]["validation_status"], ValidationWorkflowArtefactStatus.PENDING)
        self.assertIsNotNone(history[0]["submitted_at"])
        self.assertIsNotNone(history[0]["last_updated"])

        self.assertEqual(history[1]["validation_status"], ValidationWorkflowArtefactStatus.REJECTED)
        self.assertIsNotNone(history[1]["submitted_at"])
        self.assertIsNotNone(history[1]["last_updated"])

        second_instance = res_data["results"][1]
        self.assertEqual(second_instance["id"], self.instance_2.pk)
        self.assertEqual(second_instance["general_validation_status"], "")
        self.assertIsNotNone(second_instance["file_url"])
        self.assertIsNotNone(second_instance["file_content"])
        self.assertEqual(second_instance["form_id"], self.form_2.pk)

        org_unit = second_instance["org_unit"]

        self.assertEqual(org_unit["id"], self.ou_2.pk)
        self.assertEqual(org_unit["name"], "ou_2")
        self.assertEqual(org_unit["parent_id"], self.ou_1.pk)
        self.assertIsNone(org_unit["org_unit_type_id"])
        self.assertEqual(org_unit["validation_status"], "NEW")
        self.assertIsNone(org_unit["aliases"])
        self.assertIsNotNone(org_unit["created_at"])
        self.assertIsNotNone(org_unit["updated_at"])

        history = second_instance["history"]

        self.assertEqual(history, [])
        self.assertEqual(len(history), 0)

    def test_instance_without_file(self):
        self.client.force_authenticate(self.john_wick)

        self.instance_1.file = None
        self.instance_1.save()

        res = self.client.get(reverse("api-etl:instances-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
