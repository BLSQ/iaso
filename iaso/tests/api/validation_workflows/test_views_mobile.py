import uuid

from datetime import datetime

from django.urls import reverse
from rest_framework import status

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, Project, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.permissions.core_permissions import CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase


class MobileValidationWorkflowAPITestCase(APITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(name="account2")

        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick", account=self.account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )

        self.jane_doe = self.create_user_with_profile(
            username="jane.doe", account=self.other_account, permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION]
        )
        self.superuser = self.create_user_with_profile(
            username="john.super",
            account=self.other_account,
            permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION],
            is_staff=True,
            is_superuser=True,
        )

        # setup the validation workflow
        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Validation workflow", account=self.account, description="Description"
        )

        self.first_node = ValidationNodeTemplate.objects.create(
            name="First node", workflow=self.validation_workflow, color="#ffffff"
        )

        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node", workflow=self.validation_workflow, color="#12fa4b"
        )
        self.second_node.previous_node_templates.add(self.first_node)

        self.third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.validation_workflow, color="#6e6593"
        )
        self.third_node.previous_node_templates.add(self.second_node)
        self.form = Form.objects.create(name="Form")
        self.other_form = Form.objects.create(name="Form 2")

        self.validation_workflow.form_set.set([self.form, self.other_form])

        self.other_project = Project.objects.create(account=self.other_account, app_id="1.2")
        self.other_project.forms.add(self.other_form)

        self.project = Project.objects.create(account=self.account, app_id="1.1")
        self.project.forms.add(self.form)

        self.instance = self.create_form_instance(
            form=self.form,
            project=self.project,
            uuid=str(uuid.uuid4()),
        )

        self.other_instance = self.create_form_instance(
            form=self.other_form,
            project=self.other_project,
            uuid=str(uuid.uuid4()),
        )

    def setup_start(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

    def setup_approve(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        i = 0
        while self.instance.get_next_pending_nodes(self.validation_workflow).count():
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_nodes(self.validation_workflow).first(),
                self.john_wick,
                approved=True,
                comment=f"LGTM {i}",
            )
            i += 1

    def setup_reject(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        i = 0
        while self.instance.get_next_pending_nodes(self.validation_workflow).count():
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_nodes(self.validation_workflow).first(),
                self.john_wick,
                approved=i != 1,
                comment=f"LGTM {i}" if i != 1 else "Nope",
            )
            i += 1

    def test_permissions(self):
        res = self.client.get(reverse("mobile_validation_workflows-list"))

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("mobile_validation_workflows-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("mobile_validation_workflows-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("mobile_validation_workflows-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_is_paginated(self):
        instance = self.create_form_instance(
            form=self.form,
            project=self.project,
            uuid=str(uuid.uuid4()),
        )

        self.client.force_authenticate(self.john_wick)

        self.setup_start()
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, instance)

        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=2, paginated=True)

        res = self.client.get(reverse("mobile_validation_workflows-list"), data={"limit": 1})

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

    def test_filter_app_id(self):
        self.setup_start()
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("mobile_validation_workflows-list"), data={"app_id": "xxxx"})

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=0, paginated=True)

        res = self.client.get(reverse("mobile_validation_workflows-list"), data={"app_id": "1.1"})

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        self.instance.form = None
        self.instance.save()

        res = self.client.get(reverse("mobile_validation_workflows-list"), data={"app_id": "1.1"})

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=0, paginated=True)

        self.instance.project = None
        self.instance.form = self.form

        self.instance.save()

        res = self.client.get(reverse("mobile_validation_workflows-list"), data={"app_id": "1.1"})

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=0, paginated=True)

    def test_filter_last_sync(self):
        self.setup_start()

        self.assertGreater(
            self.instance.get_next_pending_nodes(self.validation_workflow).first().updated_at, self.instance.updated_at
        )
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(
            reverse("mobile_validation_workflows-list"), data={"last_sync": datetime.now().isoformat()}
        )

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=0, paginated=True)

        res = self.client.get(
            reverse("mobile_validation_workflows-list"), data={"last_sync": self.instance.updated_at.isoformat()}
        )

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        res = self.client.get(
            reverse("mobile_validation_workflows-list"),
            data={
                "last_sync": self.instance.get_next_pending_nodes(self.validation_workflow)
                .first()
                .updated_at.isoformat()
            },
        )

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

    def test_should_not_contain_instances_where_form_are_soft_deleted(self):
        self.client.force_authenticate(self.john_wick)

        self.setup_start()

        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        self.form.delete()

        self.form.refresh_from_db()

        self.assertIsNotNone(self.form.deleted_at)

        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=0, paginated=True)

    def test_should_only_contain_instances_related_to_account(self):
        self.client.force_authenticate(self.john_wick)

        self.setup_start()

        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        self.assertEqual(res_data["results"][0]["instance_id"], self.instance.uuid)

        self.client.logout()
        self.client.force_authenticate(self.jane_doe)

        ValidationWorkflowEngine.start(self.validation_workflow, self.jane_doe, self.other_instance)

        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        self.assertEqual(res_data["results"][0]["instance_id"], self.other_instance.uuid)

    def test_should_only_contain_instances_with_validation_process(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=0, paginated=True)

    def test_data_pending(self):
        self.client.force_authenticate(self.john_wick)

        self.setup_start()

        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        instance_data = res_data["results"][0]

        self.assertEqual(instance_data["instance_id"], self.instance.uuid)
        self.assertEqual(instance_data["validation_status"], ValidationWorkflowArtefactStatus.PENDING)
        self.assertIsNone(instance_data["rejection_comment"])
        self.assertEqual(instance_data["name"], self.form.name)

        self.assertHasField(instance_data, "created_at", float)
        self.assertHasField(instance_data, "updated_at", float)

        self.assertHasField(instance_data, "history", list)

        self.assertEqual(len(instance_data["history"]), 1)

        history_item = instance_data["history"][0]
        for f in ["level", "color", "status", "comment", "updated_by", "created_by"]:
            self.assertIn(f, history_item)

        self.assertHasField(history_item, "created_at", float)
        self.assertHasField(history_item, "updated_at", float)

        self.assertEqual(history_item["status"], ValidationNodeStatus.UNKNOWN)
        self.assertEqual(history_item["comment"], "")
        self.assertIsNone(history_item["updated_by"])
        self.assertEqual(history_item["created_by"], self.john_wick.username)
        self.assertEqual(history_item["color"], "#FFFFFF")
        self.assertEqual(history_item["level"], "First node")

    def test_as_superuser(self):
        self.client.force_authenticate(self.john_wick)
        self.setup_approve()
        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        instance_data = res_data["results"][0]

        self.assertEqual(instance_data["instance_id"], self.instance.uuid)
        self.assertEqual(instance_data["validation_status"], ValidationWorkflowArtefactStatus.APPROVED)
        self.assertIsNone(instance_data["rejection_comment"])
        self.assertEqual(instance_data["name"], self.form.name)

        self.assertHasField(instance_data, "created_at", float)
        self.assertHasField(instance_data, "updated_at", float)

        self.assertHasField(instance_data, "history", list)

        self.assertEqual(len(instance_data["history"]), 3)

        for history_item in instance_data["history"]:
            for f in ["level", "color", "status", "comment", "updated_by", "created_by"]:
                self.assertIn(f, history_item)

            self.assertHasField(history_item, "created_at", float)
            self.assertHasField(history_item, "updated_at", float)

        # checking order, should be from leaves to root (graph wise)
        first_item = instance_data["history"][0]
        self.assertEqual(first_item["status"], ValidationNodeStatus.ACCEPTED)
        self.assertEqual(first_item["level"], "Third node")
        self.assertEqual(first_item["color"], "#6E6593")
        self.assertEqual(first_item["comment"], "LGTM 2")
        self.assertEqual(first_item["created_by"], self.john_wick.username)
        self.assertEqual(first_item["updated_by"], self.john_wick.username)

        second_item = instance_data["history"][1]
        self.assertEqual(second_item["status"], ValidationNodeStatus.ACCEPTED)
        self.assertEqual(second_item["level"], "Second node")
        self.assertEqual(second_item["color"], "#12FA4B")
        self.assertEqual(second_item["comment"], "LGTM 1")
        self.assertEqual(second_item["created_by"], self.john_wick.username)
        self.assertEqual(second_item["updated_by"], self.john_wick.username)

        last_item = instance_data["history"][2]
        self.assertEqual(last_item["status"], ValidationNodeStatus.ACCEPTED)
        self.assertEqual(last_item["level"], "First node")
        self.assertEqual(last_item["color"], "#FFFFFF")
        self.assertEqual(last_item["comment"], "LGTM 0")
        self.assertEqual(last_item["created_by"], self.john_wick.username)
        self.assertEqual(last_item["updated_by"], self.john_wick.username)

    def test_data_approved(self):
        self.client.force_authenticate(self.john_wick)
        self.setup_approve()
        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        instance_data = res_data["results"][0]

        self.assertEqual(instance_data["instance_id"], self.instance.uuid)
        self.assertEqual(instance_data["validation_status"], ValidationWorkflowArtefactStatus.APPROVED)
        self.assertIsNone(instance_data["rejection_comment"])
        self.assertEqual(instance_data["name"], self.form.name)

        self.assertHasField(instance_data, "created_at", float)
        self.assertHasField(instance_data, "updated_at", float)

        self.assertHasField(instance_data, "history", list)

        self.assertEqual(len(instance_data["history"]), 3)

        for history_item in instance_data["history"]:
            for f in ["level", "color", "status", "comment", "updated_by", "created_by"]:
                self.assertIn(f, history_item)

            self.assertHasField(history_item, "created_at", float)
            self.assertHasField(history_item, "updated_at", float)

        # checking order, should be from leaves to root (graph wise)
        first_item = instance_data["history"][0]
        self.assertEqual(first_item["status"], ValidationNodeStatus.ACCEPTED)
        self.assertEqual(first_item["level"], "Third node")
        self.assertEqual(first_item["color"], "#6E6593")
        self.assertEqual(first_item["comment"], "LGTM 2")
        self.assertEqual(first_item["created_by"], self.john_wick.username)
        self.assertEqual(first_item["updated_by"], self.john_wick.username)

        second_item = instance_data["history"][1]
        self.assertEqual(second_item["status"], ValidationNodeStatus.ACCEPTED)
        self.assertEqual(second_item["level"], "Second node")
        self.assertEqual(second_item["color"], "#12FA4B")
        self.assertEqual(second_item["comment"], "LGTM 1")
        self.assertEqual(second_item["created_by"], self.john_wick.username)
        self.assertEqual(second_item["updated_by"], self.john_wick.username)

        last_item = instance_data["history"][2]
        self.assertEqual(last_item["status"], ValidationNodeStatus.ACCEPTED)
        self.assertEqual(last_item["level"], "First node")
        self.assertEqual(last_item["color"], "#FFFFFF")
        self.assertEqual(last_item["comment"], "LGTM 0")
        self.assertEqual(last_item["created_by"], self.john_wick.username)
        self.assertEqual(last_item["updated_by"], self.john_wick.username)

    def test_data_reject(self):
        self.client.force_authenticate(self.john_wick)
        self.setup_reject()

        res = self.client.get(reverse("mobile_validation_workflows-list"))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertValidListData(list_data=res_data, results_key="results", expected_length=1, paginated=True)

        instance_data = res_data["results"][0]

        self.assertEqual(instance_data["instance_id"], self.instance.uuid)
        self.assertEqual(instance_data["validation_status"], ValidationWorkflowArtefactStatus.REJECTED)
        self.assertEqual(instance_data["rejection_comment"], "Nope")
        self.assertEqual(instance_data["name"], self.form.name)

        self.assertHasField(instance_data, "created_at", float)
        self.assertHasField(instance_data, "updated_at", float)

        self.assertHasField(instance_data, "history", list)

        self.assertEqual(len(instance_data["history"]), 2)

        for history_item in instance_data["history"]:
            for f in ["level", "color", "status", "comment", "updated_by", "created_by"]:
                self.assertIn(f, history_item)

            self.assertHasField(history_item, "created_at", float)
            self.assertHasField(history_item, "updated_at", float)

        # checking order, should be from leaves to root (graph wise)

        second_item = instance_data["history"][0]
        self.assertEqual(second_item["status"], ValidationNodeStatus.REJECTED)
        self.assertEqual(second_item["level"], "Second node")
        self.assertEqual(second_item["color"], "#12FA4B")
        self.assertEqual(second_item["comment"], "Nope")
        self.assertEqual(second_item["created_by"], self.john_wick.username)
        self.assertEqual(second_item["updated_by"], self.john_wick.username)

        last_item = instance_data["history"][1]
        self.assertEqual(last_item["status"], ValidationNodeStatus.ACCEPTED)
        self.assertEqual(last_item["level"], "First node")
        self.assertEqual(last_item["color"], "#FFFFFF")
        self.assertEqual(last_item["comment"], "LGTM 0")
        self.assertEqual(last_item["created_by"], self.john_wick.username)
        self.assertEqual(last_item["updated_by"], self.john_wick.username)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        self.setup_approve()
        with self.assertNumQueries(9):
            # 1-2: PERM
            # 3 ORGUNIT
            # 4-5: QUERYSET + FILTER
            # 6-9: SERIALIZER
            res = self.client.get(reverse("mobile_validation_workflows-list"))
            self.assertJSONResponse(res, status.HTTP_200_OK)
