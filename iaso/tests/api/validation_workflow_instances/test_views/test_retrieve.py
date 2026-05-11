import uuid

from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, AccountFeatureFlag, Form, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.models.validation_workflow.validation_node import ValidationNodeStatus
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION, CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class ValidationWorkflowInstanceAPIRetrieveTestCase(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(name="account2")

        self.group = Group.objects.create(name=f"{self.account.id}_group")
        self.user_role = UserRole.objects.create(account=self.account, group=self.group)
        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick",
            account=self.account,
            permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION, CORE_SUBMISSIONS_PERMISSION],
            user_roles=[self.user_role],
        )

        self.jane_doe = self.create_user_with_profile(
            username="jane.doe",
            account=self.other_account,
            permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION, CORE_SUBMISSIONS_PERMISSION],
        )

        self.superuser = self.create_user_with_profile(
            username="superuser", account=self.account, is_staff=True, is_superuser=True
        )

        # setup the validation workflow
        self.form = Form.objects.create(name="Form")

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Validation workflow", account=self.account, description="Description"
        )
        self.validation_workflow.form_set.add(self.form)

        self.first_node = ValidationNodeTemplate.objects.create(
            name="First node", workflow=self.validation_workflow, color="#ffffff"
        )
        self.first_node.roles_required.add(self.user_role)

        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node", workflow=self.validation_workflow, color="#12fa4b"
        )
        self.second_node.previous_node_templates.add(self.first_node)

        self.third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.validation_workflow, color="#6e6593", can_skip_previous_nodes=True
        )
        self.third_node.previous_node_templates.add(self.second_node)
        self.third_node.roles_required.add(self.user_role)

        self.other_form = Form.objects.create(name="Form 2")

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
        self.enable_validation_workflow_feature_flag(self.account, self.other_account)

    @staticmethod
    def enable_validation_workflow_feature_flag(*accounts):
        feature_flag, _ = AccountFeatureFlag.objects.get_or_create(
            code="SUBMISSION_VALIDATION_WORKFLOW",
            defaults={"name": "Web: Enable validation workflow"},
        )
        for account in accounts:
            account.feature_flags.add(feature_flag)

    def assertValidResponse(self, data):
        self.assertResponseCompliantToSwagger(data, "ValidationWorkflowInstanceRetrieve")

    def setup_start(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

    def setup_approve(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        i = 0
        while self.instance.get_next_pending_nodes(self.validation_workflow).count():
            ValidationWorkflowEngine.complete_node(
                self.instance.get_next_pending_nodes(self.validation_workflow).first(),
                self.john_wick,
                self.instance,
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
                self.instance,
                approved=i != 1,
                comment=f"LGTM {i}" if i != 1 else "Nope",
            )
            i += 1

    def test_permissions(self):
        self.setup_start()
        res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(self.superuser)
        res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_num_queries(self):
        self.client.force_authenticate(self.john_wick)
        self.setup_approve()

        with self.assertNumQueries(11):
            res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))

        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_should_not_contain_instances_where_form_are_soft_deleted(self):
        self.setup_start()

        self.instance.form.delete()
        self.assertIsNotNone(self.instance.form.deleted_at)

        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_should_only_contain_instances_related_to_account(self):
        self.client.force_authenticate(self.jane_doe)
        self.setup_start()
        res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_data_pending(self):
        self.setup_start()

        for user in [self.john_wick, self.superuser]:
            with self.subTest(f"with user {user}"):
                self.client.force_authenticate(user)
                res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))

                res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                self.assertValidResponse(res_data)

                self.assertEqual(res_data["workflow"], self.validation_workflow.slug)
                self.assertEqual(res_data["total_steps"], 3)
                self.assertEqual(res_data["validation_status"], ValidationWorkflowArtefactStatus.PENDING)

                self.assertEqual(len(res_data["submissions"]), 1)

                first_submission = res_data["submissions"][0]

                self.assertEqual(
                    first_submission["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING
                )
                self.assertIsNone(first_submission["next_created_at"])
                self.assertEqual(first_submission["created_by"], self.john_wick.username)

                self.assertEqual(len(first_submission["timeline"]), 2)

                timeline = first_submission["timeline"]

                # checking order, should be from leaves to root (graph wise)
                first_item = timeline[0]
                self.assertIsNotNone(first_item["id"])
                self.assertEqual(first_item["name"], "Third node")
                self.assertEqual(first_item["node_template_slug"], "third-node")
                self.assertIsNone(first_item["comment"])
                self.assertIsNotNone(first_item["updated_at"])
                self.assertIsNotNone(first_item["created_at"])
                self.assertIsNone(first_item["status"])
                self.assertIsNone(first_item["updated_by"])
                self.assertEqual(first_item["type"], "NEXT_BYPASS")
                self.assertEqual(first_item["order"], 3)
                self.assertTrue(first_item["user_can_do_actions"])

                second_item = timeline[1]
                self.assertIsNotNone(second_item["id"])
                self.assertEqual(second_item["name"], "First node")
                self.assertEqual(second_item["node_template_slug"], "first-node")
                self.assertEqual(second_item["comment"], "")
                self.assertIsNotNone(second_item["updated_at"])
                self.assertIsNotNone(second_item["created_at"])
                self.assertEqual(second_item["status"], ValidationNodeStatus.UNKNOWN)
                self.assertIsNone(second_item["updated_by"], self.john_wick.username)
                self.assertEqual(second_item["type"], "TIMELINE")
                self.assertEqual(second_item["order"], 1)
                self.assertTrue(second_item["user_can_do_actions"])

    def test_data_approved(self):
        self.setup_approve()

        for user in [self.john_wick, self.superuser]:
            with self.subTest(f"with user {user}"):
                self.client.force_authenticate(user)
                res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))

                res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                self.assertValidResponse(res_data)

                self.assertEqual(res_data["workflow"], self.validation_workflow.slug)
                self.assertEqual(res_data["total_steps"], 3)
                self.assertEqual(res_data["validation_status"], ValidationWorkflowArtefactStatus.APPROVED)

                self.assertEqual(len(res_data["submissions"]), 1)

                first_submission = res_data["submissions"][0]

                self.assertEqual(
                    first_submission["general_validation_status"], ValidationWorkflowArtefactStatus.APPROVED
                )
                self.assertIsNone(first_submission["next_created_at"])
                self.assertEqual(first_submission["created_by"], self.john_wick.username)

                self.assertEqual(len(first_submission["timeline"]), 3)

                timeline = first_submission["timeline"]

                # checking order, should be from leaves to root (graph wise)
                first_item = timeline[0]
                self.assertIsNotNone(first_item["id"])
                self.assertEqual(first_item["name"], "Third node")
                self.assertEqual(first_item["node_template_slug"], "third-node")
                self.assertEqual(first_item["comment"], "LGTM 2")
                self.assertIsNotNone(first_item["updated_at"])
                self.assertIsNotNone(first_item["created_at"])
                self.assertEqual(first_item["status"], ValidationNodeStatus.ACCEPTED)
                self.assertEqual(first_item["updated_by"], self.john_wick.username)
                self.assertEqual(first_item["type"], "TIMELINE")
                self.assertEqual(first_item["order"], 3)
                self.assertTrue(first_item["user_can_do_actions"])

                second_item = timeline[1]
                self.assertIsNotNone(second_item["id"])
                self.assertEqual(second_item["name"], "Second node")
                self.assertEqual(second_item["node_template_slug"], "second-node")
                self.assertEqual(second_item["comment"], "LGTM 1")
                self.assertIsNotNone(second_item["updated_at"])
                self.assertIsNotNone(second_item["created_at"])
                self.assertEqual(second_item["status"], ValidationNodeStatus.ACCEPTED)
                self.assertEqual(second_item["updated_by"], self.john_wick.username)
                self.assertEqual(second_item["type"], "TIMELINE")
                self.assertEqual(second_item["order"], 2)
                self.assertTrue(second_item["user_can_do_actions"])

                third_item = timeline[2]
                self.assertIsNotNone(third_item["id"])
                self.assertEqual(third_item["name"], "First node")
                self.assertEqual(third_item["node_template_slug"], "first-node")
                self.assertEqual(third_item["comment"], "LGTM 0")
                self.assertIsNotNone(third_item["updated_at"])
                self.assertIsNotNone(third_item["created_at"])
                self.assertEqual(third_item["status"], ValidationNodeStatus.ACCEPTED)
                self.assertEqual(third_item["updated_by"], self.john_wick.username)
                self.assertEqual(third_item["type"], "TIMELINE")
                self.assertEqual(third_item["order"], 1)
                self.assertTrue(third_item["user_can_do_actions"])

    def test_data_reject(self):
        self.setup_reject()

        for user in [self.john_wick, self.superuser]:
            with self.subTest(f"with user {user}"):
                self.client.force_authenticate(user)

                res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))
                res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                self.assertValidResponse(res_data)

                self.assertEqual(res_data["workflow"], self.validation_workflow.slug)
                self.assertEqual(res_data["total_steps"], 3)
                self.assertEqual(res_data["validation_status"], ValidationWorkflowArtefactStatus.REJECTED)

                self.assertEqual(len(res_data["submissions"]), 1)

                first_submission = res_data["submissions"][0]

                self.assertEqual(
                    first_submission["general_validation_status"], ValidationWorkflowArtefactStatus.REJECTED
                )
                self.assertIsNone(first_submission["next_created_at"])
                self.assertEqual(first_submission["created_by"], self.john_wick.username)

                self.assertEqual(len(first_submission["timeline"]), 2)

                timeline = first_submission["timeline"]

                # checking order, should be from leaves to root (graph wise)
                first_item = timeline[0]
                self.assertIsNotNone(first_item["id"])
                self.assertEqual(first_item["name"], "Second node")
                self.assertEqual(first_item["node_template_slug"], "second-node")
                self.assertEqual(first_item["comment"], "Nope")
                self.assertIsNotNone(first_item["updated_at"])
                self.assertIsNotNone(first_item["created_at"])
                self.assertEqual(first_item["status"], ValidationNodeStatus.REJECTED)
                self.assertEqual(first_item["updated_by"], self.john_wick.username)
                self.assertEqual(first_item["type"], "TIMELINE")
                self.assertEqual(first_item["order"], 2)
                self.assertTrue(first_item["user_can_do_actions"])

                second_item = timeline[1]
                self.assertIsNotNone(second_item["id"])
                self.assertEqual(second_item["name"], "First node")
                self.assertEqual(second_item["node_template_slug"], "first-node")
                self.assertEqual(second_item["comment"], "LGTM 0")
                self.assertIsNotNone(second_item["updated_at"])
                self.assertIsNotNone(second_item["created_at"])
                self.assertEqual(second_item["status"], ValidationNodeStatus.ACCEPTED)
                self.assertEqual(second_item["updated_by"], self.john_wick.username)
                self.assertEqual(second_item["type"], "TIMELINE")
                self.assertEqual(second_item["order"], 1)
                self.assertTrue(second_item["user_can_do_actions"])


class ValidationWorkflowInstanceAPIRetrieveTestCaseResubmissionWithNextByPass(SwaggerTestCaseMixin, APITestCase):
    """
    This test purpose is to check that the next_bypass field is correctly populated in case of resubmission
    """

    def setUp(self):
        self.account = Account.objects.create(name="account")

        self.group = Group.objects.create(name="group")
        self.user_role = UserRole.objects.create(account=self.account, group=self.group)
        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick = self.create_user_with_profile(
            username="john.wick",
            account=self.account,
            permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION, CORE_SUBMISSIONS_PERMISSION],
            user_roles=[self.user_role],
        )

        self.superuser = self.create_user_with_profile(
            username="superuser", account=self.account, is_staff=True, is_superuser=True
        )

        # setup the validation workflow
        self.form = Form.objects.create(name="Form")

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Validation workflow", account=self.account, description="Description"
        )
        self.validation_workflow.form_set.add(self.form)

        self.first_node = ValidationNodeTemplate.objects.create(
            name="First node", workflow=self.validation_workflow, color="#ffffff"
        )
        self.first_node.roles_required.add(self.user_role)

        self.second_node = ValidationNodeTemplate.objects.create(
            name="Second node", workflow=self.validation_workflow, color="#12fa4b"
        )
        self.second_node.previous_node_templates.add(self.first_node)

        self.third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.validation_workflow, color="#6e6593", can_skip_previous_nodes=True
        )
        self.third_node.previous_node_templates.add(self.second_node)
        self.third_node.roles_required.add(self.user_role)

        self.fourth_node = ValidationNodeTemplate.objects.create(
            name="Fourth node", workflow=self.validation_workflow, color="#6e6593", can_skip_previous_nodes=True
        )
        self.fourth_node.previous_node_templates.add(self.third_node)
        self.fourth_node.roles_required.add(self.user_role)

        self.project = Project.objects.create(account=self.account, app_id="1.1")
        self.project.forms.add(self.form)

        self.instance = self.create_form_instance(
            form=self.form,
            project=self.project,
            uuid=str(uuid.uuid4()),
        )
        self.enable_validation_workflow_feature_flag(self.account)

    @staticmethod
    def enable_validation_workflow_feature_flag(*accounts):
        feature_flag, _ = AccountFeatureFlag.objects.get_or_create(
            code="SUBMISSION_VALIDATION_WORKFLOW",
            defaults={"name": "Web: Enable validation workflow"},
        )
        for account in accounts:
            account.feature_flags.add(feature_flag)

    def assertValidResponse(self, data):
        self.assertResponseCompliantToSwagger(data, "ValidationWorkflowInstanceRetrieve")

    def test_next_bypass_data_after_resubmit_after_reject_on_first_node(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        # reject
        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes(self.validation_workflow).first(),
            self.john_wick,
            self.instance,
            approved=False,
            comment="Nope",
        )

        # resubmit
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(res_data["workflow"], self.validation_workflow.slug)
        self.assertEqual(res_data["total_steps"], 4)
        self.assertEqual(res_data["validation_status"], ValidationWorkflowArtefactStatus.PENDING)

        self.assertEqual(len(res_data["submissions"]), 2)

        first_submission = res_data["submissions"][0]

        self.assertEqual(first_submission["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
        self.assertIsNone(first_submission["next_created_at"])
        self.assertEqual(first_submission["created_by"], self.john_wick.username)

        self.assertEqual(len(first_submission["timeline"]), 3)

        timeline = first_submission["timeline"]

        # checking order, should be from leaves to root (graph wise)
        first_item = timeline[0]
        self.assertIsNotNone(first_item["id"])
        self.assertEqual(first_item["name"], "Fourth node")
        self.assertEqual(first_item["node_template_slug"], "fourth-node")
        self.assertIsNone(first_item["comment"])
        self.assertIsNotNone(first_item["updated_at"])
        self.assertIsNotNone(first_item["created_at"])
        self.assertIsNone(first_item["status"])
        self.assertIsNone(first_item["updated_by"])
        self.assertEqual(first_item["type"], "NEXT_BYPASS")
        self.assertEqual(first_item["order"], 4)
        self.assertTrue(first_item["user_can_do_actions"])

        second_item = timeline[1]
        self.assertIsNotNone(second_item["id"])
        self.assertEqual(second_item["name"], "Third node")
        self.assertEqual(second_item["node_template_slug"], "third-node")
        self.assertIsNone(second_item["comment"])
        self.assertIsNotNone(second_item["updated_at"])
        self.assertIsNotNone(second_item["created_at"])
        self.assertIsNone(second_item["status"])
        self.assertIsNone(second_item["updated_by"])
        self.assertEqual(second_item["type"], "NEXT_BYPASS")
        self.assertEqual(second_item["order"], 3)
        self.assertTrue(second_item["user_can_do_actions"])

        third_item = timeline[2]
        self.assertIsNotNone(third_item["id"])
        self.assertEqual(third_item["name"], "First node")
        self.assertEqual(third_item["node_template_slug"], "first-node")
        self.assertEqual(third_item["comment"], "")
        self.assertIsNotNone(third_item["updated_at"])
        self.assertIsNotNone(third_item["created_at"])
        self.assertEqual(third_item["status"], ValidationNodeStatus.UNKNOWN)
        self.assertIsNone(third_item["updated_by"])
        self.assertEqual(third_item["type"], "TIMELINE")
        self.assertEqual(third_item["order"], 1)
        self.assertTrue(third_item["user_can_do_actions"])

        second_submission = res_data["submissions"][1]

        self.assertEqual(second_submission["general_validation_status"], ValidationWorkflowArtefactStatus.REJECTED)
        self.assertIsNotNone(second_submission["next_created_at"])
        self.assertEqual(second_submission["created_by"], self.john_wick.username)

        self.assertEqual(len(second_submission["timeline"]), 1)

        timeline = second_submission["timeline"]

        # checking order, should be from leaves to root (graph wise)
        first_item = timeline[0]
        self.assertIsNotNone(first_item["id"])
        self.assertEqual(first_item["name"], "First node")
        self.assertEqual(first_item["node_template_slug"], "first-node")
        self.assertEqual(first_item["comment"], "Nope")
        self.assertIsNotNone(first_item["updated_at"])
        self.assertIsNotNone(first_item["created_at"])
        self.assertEqual(first_item["status"], ValidationNodeStatus.REJECTED)
        self.assertEqual(first_item["updated_by"], self.john_wick.username)
        self.assertEqual(first_item["type"], "TIMELINE")
        self.assertEqual(first_item["order"], 1)
        self.assertTrue(first_item["user_can_do_actions"])

    def test_next_bypass_data_after_resubmit_after_bypass_reject_on_third_node(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        # reject
        ValidationWorkflowEngine.complete_node_by_passing(
            self.third_node,
            self.john_wick,
            self.instance,
            approved=False,
            comment="Nope",
            workflow=self.validation_workflow,
        )

        # resubmit
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidResponse(res_data)

        self.assertEqual(res_data["workflow"], self.validation_workflow.slug)
        self.assertEqual(res_data["total_steps"], 4)
        self.assertEqual(res_data["validation_status"], ValidationWorkflowArtefactStatus.PENDING)

        self.assertEqual(len(res_data["submissions"]), 2)

        first_submission = res_data["submissions"][0]

        self.assertEqual(first_submission["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
        self.assertIsNone(first_submission["next_created_at"])
        self.assertEqual(first_submission["created_by"], self.john_wick.username)

        self.assertEqual(len(first_submission["timeline"]), 3)

        timeline = first_submission["timeline"]

        # checking order, should be from leaves to root (graph wise)
        first_item = timeline[0]
        self.assertIsNotNone(first_item["id"])
        self.assertEqual(first_item["name"], "Fourth node")
        self.assertEqual(first_item["node_template_slug"], "fourth-node")
        self.assertIsNone(first_item["comment"])
        self.assertIsNotNone(first_item["updated_at"])
        self.assertIsNotNone(first_item["created_at"])
        self.assertIsNone(first_item["status"])
        self.assertIsNone(first_item["updated_by"])
        self.assertEqual(first_item["type"], "NEXT_BYPASS")
        self.assertEqual(first_item["order"], 4)
        self.assertTrue(first_item["user_can_do_actions"])

        second_item = timeline[1]
        self.assertIsNotNone(second_item["id"])
        self.assertEqual(second_item["name"], "Third node")
        self.assertEqual(second_item["node_template_slug"], "third-node")
        self.assertIsNone(second_item["comment"])
        self.assertIsNotNone(second_item["updated_at"])
        self.assertIsNotNone(second_item["created_at"])
        self.assertIsNone(second_item["status"])
        self.assertIsNone(second_item["updated_by"])
        self.assertEqual(second_item["type"], "NEXT_BYPASS")
        self.assertEqual(second_item["order"], 3)
        self.assertTrue(second_item["user_can_do_actions"])

        third_item = timeline[2]
        self.assertIsNotNone(third_item["id"])
        self.assertEqual(third_item["name"], "First node")
        self.assertEqual(third_item["node_template_slug"], "first-node")
        self.assertEqual(third_item["comment"], "")
        self.assertIsNotNone(third_item["updated_at"])
        self.assertIsNotNone(third_item["created_at"])
        self.assertEqual(third_item["status"], ValidationNodeStatus.UNKNOWN)
        self.assertIsNone(third_item["updated_by"])
        self.assertEqual(third_item["type"], "TIMELINE")
        self.assertEqual(third_item["order"], 1)
        self.assertTrue(third_item["user_can_do_actions"])

        second_submission = res_data["submissions"][1]

        self.assertEqual(second_submission["general_validation_status"], ValidationWorkflowArtefactStatus.REJECTED)
        self.assertIsNotNone(second_submission["next_created_at"])
        self.assertEqual(second_submission["created_by"], self.john_wick.username)

        self.assertEqual(len(second_submission["timeline"]), 3)

        timeline = second_submission["timeline"]

        # checking order, should be from leaves to root (graph wise)
        first_item = timeline[0]
        self.assertIsNotNone(first_item["id"])
        self.assertEqual(first_item["name"], "Third node")
        self.assertEqual(first_item["node_template_slug"], "third-node")
        self.assertEqual(first_item["comment"], "Nope")
        self.assertIsNotNone(first_item["updated_at"])
        self.assertIsNotNone(first_item["created_at"])
        self.assertEqual(first_item["status"], ValidationNodeStatus.REJECTED)
        self.assertEqual(first_item["updated_by"], self.john_wick.username)
        self.assertEqual(first_item["type"], "TIMELINE")
        self.assertEqual(first_item["order"], 3)
        self.assertTrue(first_item["user_can_do_actions"])

        second_item = timeline[1]
        self.assertIsNotNone(second_item["id"])
        self.assertEqual(second_item["name"], "Second node")
        self.assertEqual(second_item["node_template_slug"], "second-node")
        self.assertEqual(second_item["comment"], "")
        self.assertIsNotNone(second_item["updated_at"])
        self.assertIsNotNone(second_item["created_at"])
        self.assertEqual(second_item["status"], ValidationNodeStatus.SKIPPED)
        self.assertEqual(second_item["updated_by"], self.john_wick.username)
        self.assertEqual(second_item["type"], "TIMELINE")
        self.assertEqual(second_item["order"], 2)
        self.assertTrue(second_item["user_can_do_actions"])

        third_item = timeline[2]
        self.assertIsNotNone(third_item["id"])
        self.assertEqual(third_item["name"], "First node")
        self.assertEqual(third_item["node_template_slug"], "first-node")
        self.assertEqual(third_item["comment"], "")
        self.assertIsNotNone(third_item["updated_at"])
        self.assertIsNotNone(third_item["created_at"])
        self.assertEqual(third_item["status"], ValidationNodeStatus.SKIPPED)
        self.assertEqual(third_item["updated_by"], self.john_wick.username)
        self.assertEqual(third_item["type"], "TIMELINE")
        self.assertEqual(third_item["order"], 1)
        self.assertTrue(third_item["user_can_do_actions"])

    def test_num_queries(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        # reject
        ValidationWorkflowEngine.complete_node_by_passing(
            self.third_node,
            self.john_wick,
            self.instance,
            approved=False,
            comment="Nope",
            workflow=self.validation_workflow,
        )

        # resubmit
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_wick, self.instance)

        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(13):
            res = self.client.get(reverse("validation_workflow_instances-detail", kwargs={"pk": self.instance.pk}))
        self.assertJSONResponse(res, status.HTTP_200_OK)
