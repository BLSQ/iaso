import uuid

from django.contrib.auth.models import Group
from django.urls import reverse
from rest_framework import status

from iaso.engine.validation_workflow import ValidationWorkflowEngine
from iaso.models import Account, Form, Project, UserRole, ValidationNodeTemplate, ValidationWorkflow
from iaso.models.common import ValidationWorkflowArtefactStatus
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_PERMISSION, CORE_VALIDATION_WORKFLOW_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class ValidationWorkflowInstanceAPIListTestCase(SwaggerTestCaseMixin, APITestCase):
    def setUp(self):
        # setup users and user roles
        self.account = Account.objects.create(name="account")

        self.group = Group.objects.create(name="group")
        self.user_role = UserRole.objects.create(account=self.account, group=self.group)
        self.john_doe = self.create_user_with_profile(
            username="john.doe", account=self.account, first_name="John", last_name="Doe"
        )

        self.john_wick_no_user_roles = self.create_user_with_profile(
            username="john.wick.no.user.roles",
            account=self.account,
            permissions=[CORE_VALIDATION_WORKFLOW_PERMISSION, CORE_SUBMISSIONS_PERMISSION],
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

        # setup two VF
        # VF 1
        # Node 1 => no perm
        # Node 2 => perm
        # Node 3 => skip
        self.form = Form.objects.create(name="Form")

        self.validation_workflow = ValidationWorkflow.objects.create(
            name="Validation workflow", account=self.account, description="Description"
        )
        self.validation_workflow.form_set.add(self.form)

        self.first_vf_first_node = ValidationNodeTemplate.objects.create(
            name="First node", workflow=self.validation_workflow, color="#ffffff"
        )
        self.first_vf_second_node = ValidationNodeTemplate.objects.create(
            name="Second node", workflow=self.validation_workflow, color="#ffffff"
        )
        self.first_vf_second_node.roles_required.add(self.user_role)
        self.first_vf_second_node.previous_node_templates.add(self.first_vf_first_node)

        self.first_vf_third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.validation_workflow, color="#ffffff", can_skip_previous_nodes=True
        )
        self.first_vf_third_node.previous_node_templates.add(self.first_vf_second_node)

        # VF 2
        # Node 1 => no perm
        # Node 2 => perm
        # Node 3 => skip with perm
        self.other_form = Form.objects.create(name="Form2")

        self.other_validation_workflow = ValidationWorkflow.objects.create(
            name="Other Validation workflow", account=self.account, description="Description2"
        )
        self.other_validation_workflow.form_set.add(self.other_form)

        self.second_vf_first_node = ValidationNodeTemplate.objects.create(
            name="First node", workflow=self.other_validation_workflow, color="#ffffff"
        )
        self.second_vf_second_node = ValidationNodeTemplate.objects.create(
            name="Second node", workflow=self.other_validation_workflow, color="#ffffff"
        )
        self.second_vf_second_node.roles_required.add(self.user_role)
        self.second_vf_second_node.previous_node_templates.add(self.second_vf_first_node)

        self.second_vf_third_node = ValidationNodeTemplate.objects.create(
            name="Third node", workflow=self.other_validation_workflow, color="#ffffff", can_skip_previous_nodes=True
        )
        self.second_vf_third_node.previous_node_templates.add(self.second_vf_second_node)
        self.second_vf_third_node.roles_required.add(self.user_role)

        # setup two instances
        self.other_project = Project.objects.create(account=self.account, app_id="1.2")
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

    def assertValidVFInstanceListData(self, data, expected_length):
        self.assertValidListData(list_data=data, expected_length=expected_length, paginated=True, results_key="results")
        self.assertResponseCompliantToSwagger(data, "PaginatedValidationWorkflowInstanceListList")
        for item in data.get("results", []):
            self.assertValidVFInstanceListItemData(item)

    def assertValidVFInstanceListItemData(self, data):
        self.assertResponseCompliantToSwagger(data, "ValidationWorkflowInstanceList")

    def test_permissions(self):
        res = self.client.get(reverse("validation_workflow_instances-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("validation_workflow_instances-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.superuser)

        res = self.client.get(reverse("validation_workflow_instances-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validation_workflow_instances-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_list_instances_did_not_start_process(self):
        self.client.force_authenticate(self.john_wick)

        res = self.client.get(reverse("validation_workflow_instances-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidListData(list_data=res_data, expected_length=0, paginated=True, results_key="results")

    def test_list_after_start(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        # user should see both instances by default as he can approve / complete

        for user in [self.john_wick, self.superuser, self.john_wick_no_user_roles]:
            with self.subTest(user):
                self.client.force_authenticate(user)
                res = self.client.get(reverse("validation_workflow_instances-list"))
                res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
                self.assertValidVFInstanceListData(res_data, 2)

                first_result = res_data["results"][0]
                second_result = res_data["results"][1]

                self.assertEqual(first_result["id"], self.other_instance.id)
                self.assertEqual(second_result["id"], self.instance.id)

                self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
                self.assertEqual(second_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

                self.assertFalse(first_result["user_has_been_involved"])
                self.assertFalse(second_result["user_has_been_involved"])

                self.assertTrue(first_result["requires_user_action"])
                self.assertTrue(second_result["requires_user_action"])

    def test_list_with_previous_actions(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, True, "LGTM"
        )
        ValidationWorkflowEngine.complete_node(
            self.other_instance.get_next_pending_nodes().first(), self.john_wick, self.other_instance, True, "LGTM"
        )

        with self.subTest(self.superuser):
            self.client.force_authenticate(self.superuser)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            first_result = res_data["results"][0]
            second_result = res_data["results"][1]

            self.assertEqual(first_result["id"], self.other_instance.id)
            self.assertEqual(second_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
            self.assertEqual(second_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertFalse(first_result["user_has_been_involved"])
            self.assertFalse(second_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])
            self.assertTrue(second_result["requires_user_action"])

        with self.subTest(self.john_wick):
            self.client.force_authenticate(self.john_wick)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            first_result = res_data["results"][0]
            second_result = res_data["results"][1]

            self.assertEqual(first_result["id"], self.other_instance.id)
            self.assertEqual(second_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
            self.assertEqual(second_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertTrue(first_result["user_has_been_involved"])
            self.assertTrue(second_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])
            self.assertTrue(second_result["requires_user_action"])

        with self.subTest(self.john_wick_no_user_roles):
            self.client.force_authenticate(self.john_wick_no_user_roles)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)

            # => for second VF : user has not been involved in any way and he does not have the perm to do next one (bypass or node 2)
            # => for first VF :user has not been involved in any way but he can take action in node 3

            first_result = res_data["results"][0]

            self.assertEqual(first_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertFalse(first_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])

    def test_list_with_resubmits(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, False, "Nope"
        )
        ValidationWorkflowEngine.complete_node(
            self.other_instance.get_next_pending_nodes().first(), self.john_wick, self.other_instance, False, "Nope"
        )

        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, True, "LGTM"
        )
        ValidationWorkflowEngine.complete_node(
            self.other_instance.get_next_pending_nodes().first(), self.john_wick, self.other_instance, True, "LGTM"
        )

        with self.subTest(self.superuser):
            self.client.force_authenticate(self.superuser)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            first_result = res_data["results"][0]
            second_result = res_data["results"][1]

            self.assertEqual(first_result["id"], self.other_instance.id)
            self.assertEqual(second_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
            self.assertEqual(second_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertFalse(first_result["user_has_been_involved"])
            self.assertFalse(second_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])
            self.assertTrue(second_result["requires_user_action"])

        with self.subTest(self.john_wick):
            self.client.force_authenticate(self.john_wick)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            first_result = res_data["results"][0]
            second_result = res_data["results"][1]

            self.assertEqual(first_result["id"], self.other_instance.id)
            self.assertEqual(second_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
            self.assertEqual(second_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertTrue(first_result["user_has_been_involved"])
            self.assertTrue(second_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])
            self.assertTrue(second_result["requires_user_action"])

        with self.subTest(self.john_wick_no_user_roles):
            self.client.force_authenticate(self.john_wick_no_user_roles)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)

            # => for second VF : user has not been involved in any way and he does not have the perm to do next one (bypass or node 2)
            # => for first VF :user has not been involved in any way but he can take action in node 3

            first_result = res_data["results"][0]

            self.assertEqual(first_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertFalse(first_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])

    def test_list_with_resubmits_after_bypass(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node_by_passing(
            self.first_vf_third_node, self.john_wick, self.instance, self.validation_workflow, False, "Nope"
        )
        ValidationWorkflowEngine.complete_node_by_passing(
            self.second_vf_third_node,
            self.john_wick,
            self.other_instance,
            self.other_validation_workflow,
            False,
            "Nope",
        )

        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, True, "LGTM"
        )
        ValidationWorkflowEngine.complete_node(
            self.other_instance.get_next_pending_nodes().first(), self.john_wick, self.other_instance, True, "LGTM"
        )

        with self.subTest(self.superuser):
            self.client.force_authenticate(self.superuser)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            first_result = res_data["results"][0]
            second_result = res_data["results"][1]

            self.assertEqual(first_result["id"], self.other_instance.id)
            self.assertEqual(second_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
            self.assertEqual(second_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertFalse(first_result["user_has_been_involved"])
            self.assertFalse(second_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])
            self.assertTrue(second_result["requires_user_action"])

        with self.subTest(self.john_wick):
            self.client.force_authenticate(self.john_wick)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            first_result = res_data["results"][0]
            second_result = res_data["results"][1]

            self.assertEqual(first_result["id"], self.other_instance.id)
            self.assertEqual(second_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)
            self.assertEqual(second_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertTrue(first_result["user_has_been_involved"])
            self.assertTrue(second_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])
            self.assertTrue(second_result["requires_user_action"])

        with self.subTest(self.john_wick_no_user_roles):
            self.client.force_authenticate(self.john_wick_no_user_roles)
            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)

            # => for second VF: user has not been involved in any way and he does not have the perm to do next one (bypass or node 2)
            # => for first VF: user has not been involved in any way but he can take action in node 3

            first_result = res_data["results"][0]

            self.assertEqual(first_result["id"], self.instance.id)

            self.assertEqual(first_result["general_validation_status"], ValidationWorkflowArtefactStatus.PENDING)

            self.assertFalse(first_result["user_has_been_involved"])

            self.assertTrue(first_result["requires_user_action"])

    def test_filters(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node_by_passing(
            self.first_vf_third_node, self.john_wick, self.instance, self.validation_workflow, False, "Nope"
        )
        ValidationWorkflowEngine.complete_node_by_passing(
            self.second_vf_third_node,
            self.john_wick,
            self.other_instance,
            self.other_validation_workflow,
            False,
            "Nope",
        )

        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, False, "Nope"
        )
        ValidationWorkflowEngine.complete_node(
            self.other_instance.get_next_pending_nodes().first(),
            self.john_wick_no_user_roles,
            self.other_instance,
            True,
            "LGTM",
        )

        with self.subTest("form filters"):
            self.client.force_authenticate(self.john_wick)

            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            res = self.client.get(
                reverse("validation_workflow_instances-list"), data={"forms": [self.form.pk, self.other_form.pk]}
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            res = self.client.get(reverse("validation_workflow_instances-list"), data={"forms": [self.form.pk]})
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)
            self.assertEqual(res_data["results"][0]["id"], self.instance.id)

            res = self.client.get(reverse("validation_workflow_instances-list"), data={"forms": [self.other_form.pk]})
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)
            self.assertEqual(res_data["results"][0]["id"], self.other_instance.id)

            res = self.client.get(
                reverse("validation_workflow_instances-list"), data={"forms": [self.other_form.pk + 100]}
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 0)

        with self.subTest("validation workflows"):
            self.client.force_authenticate(self.john_wick)

            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            res = self.client.get(
                reverse("validation_workflow_instances-list"),
                data={"validation_workflows": [self.validation_workflow.pk, self.other_validation_workflow.pk]},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)

            res = self.client.get(
                reverse("validation_workflow_instances-list"),
                data={"validation_workflows": [self.validation_workflow.pk]},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)
            self.assertEqual(res_data["results"][0]["id"], self.instance.id)

            res = self.client.get(
                reverse("validation_workflow_instances-list"),
                data={"validation_workflows": [self.other_validation_workflow.pk]},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)
            self.assertEqual(res_data["results"][0]["id"], self.other_instance.id)

            res = self.client.get(
                reverse("validation_workflow_instances-list"),
                data={"validation_workflows": [self.other_validation_workflow.pk + 99]},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 0)

        with self.subTest("status"):
            self.client.force_authenticate(self.john_wick)

            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 2)
            self.assertCountEqual(
                [x["general_validation_status"] for x in res_data["results"]],
                [ValidationWorkflowArtefactStatus.PENDING.value, ValidationWorkflowArtefactStatus.REJECTED.value],
            )

            res = self.client.get(
                reverse("validation_workflow_instances-list"),
                data={"status": ValidationWorkflowArtefactStatus.PENDING.value},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)
            self.assertCountEqual(
                [x["general_validation_status"] for x in res_data["results"]],
                [ValidationWorkflowArtefactStatus.PENDING.value],
            )

            res = self.client.get(
                reverse("validation_workflow_instances-list"),
                data={"status": ValidationWorkflowArtefactStatus.REJECTED.value},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)
            self.assertCountEqual(
                [x["general_validation_status"] for x in res_data["results"]],
                [ValidationWorkflowArtefactStatus.REJECTED.value],
            )

            res = self.client.get(
                reverse("validation_workflow_instances-list"),
                data={"status": ValidationWorkflowArtefactStatus.APPROVED.value},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 0)

        with self.subTest("requires user action"):
            self.client.force_authenticate(self.john_wick_no_user_roles)

            res = self.client.get(reverse("validation_workflow_instances-list"))
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 1)

            res = self.client.get(reverse("validation_workflow_instances-list"), data={"requires_user_action": True})
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertValidVFInstanceListData(res_data, 0)

    def test_num_queries_with_resubmits(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, False, "Nope"
        )
        ValidationWorkflowEngine.complete_node(
            self.other_instance.get_next_pending_nodes().first(), self.john_wick, self.instance, False, "Nope"
        )

        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, True, "LGTM"
        )
        ValidationWorkflowEngine.complete_node(
            self.other_instance.get_next_pending_nodes().first(), self.john_wick, self.other_instance, True, "LGTM"
        )

        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(5):
            res = self.client.get(reverse("validation_workflow_instances-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_num_queries(self):
        ValidationWorkflowEngine.start(self.validation_workflow, self.john_doe, self.instance)

        ValidationWorkflowEngine.start(self.other_validation_workflow, self.john_doe, self.other_instance)

        ValidationWorkflowEngine.complete_node(
            self.instance.get_next_pending_nodes().first(), self.john_wick, self.instance, True, "LGTM"
        )
        ValidationWorkflowEngine.complete_node(
            self.other_instance.get_next_pending_nodes().first(), self.john_wick, self.other_instance, True, "LGTM"
        )

        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(5):
            res = self.client.get(reverse("validation_workflow_instances-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)
