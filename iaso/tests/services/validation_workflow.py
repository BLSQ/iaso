from django.contrib.auth.models import Group

from iaso.models import Account, UserRole, ValidationNodeTemplate, ValidationWorkflow, ValidationWorkflowVersion
from iaso.services.validation_workflows import ValidationWorkflowService
from iaso.test import TestCase


class TestValidationWorkflowService(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="account")
        cls.jim = cls.create_user_with_profile(username="jim", account=cls.account)

    def test_create(self):
        ValidationWorkflowService.create_validation_workflow(
            user=self.jim, account=self.account, name="test", version="2.0.0", description="some description"
        )

        vf = ValidationWorkflow.objects.get(name="test")

        self.assertEqual(vf.description, "some description")
        self.assertEqual(vf.account, self.account)

        self.assertEqual(vf.versions.count(), 1)

        version = vf.versions.first()

        self.assertEqual(str(version.version), "2.0.0")
        self.assertEqual(version.version_major, 2)
        self.assertEqual(version.version_minor, 0)
        self.assertEqual(version.version_patch, 0)
        self.assertEqual(version.main_workflow, vf)
        self.assertEqual(version.created_by, self.jim)
        self.assertEqual(version.updated_by, self.jim)


class TestValidationWorkflowServiceCreateNewVersion(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="account")
        cls.jim = cls.create_user_with_profile(username="jim", account=cls.account)
        cls.group = Group.objects.create(name="group")
        cls.other_group = Group.objects.create(name="group2")
        cls.user_role = UserRole.objects.create(account=cls.account, group=cls.group)
        cls.other_user_role = UserRole.objects.create(account=cls.account, group=cls.other_group)

        # create validation workflow with a version , node templates and required roles
        cls.vf = ValidationWorkflow.objects.create(account=cls.account, name="vf", description="vf")
        cls.version = ValidationWorkflowVersion.objects.create(version="1.0.0", main_workflow=cls.vf)

        cls.first_node_template = ValidationNodeTemplate.objects.create(
            name="first_node_template",
            description="first node template",
            workflow=cls.version,
            can_skip_previous_nodes=True,
        )
        cls.first_node_template.roles_required.add(cls.user_role)
        cls.first_node_template.roles_required.add(cls.other_user_role)

        cls.second_node_template = ValidationNodeTemplate.objects.create(
            name="second_node_template", description="second node template", workflow=cls.version
        )
        cls.second_node_template.previous_node_templates.add(cls.first_node_template)
        cls.second_node_template.roles_required.add(cls.user_role)

    def test_create_default(self):
        ValidationWorkflowService.create_new_version(validation_workflow=self.vf, user=self.jim)
        self.vf.refresh_from_db()
        self.assertNotEqual(self.vf.versions.latest_by_version(), self.version)

        self.assertEqual(ValidationNodeTemplate.objects.count(), 2)

        new_version = self.vf.versions.latest_by_version()

        self.assertEqual(new_version.version_as_str, "2.0.0")

        self.assertEqual(new_version.node_templates.count(), 0)

        self.assertEqual(new_version.dump_nodes(), [])

    def test_create_new_version_with_clone(self):
        ValidationWorkflowService.create_new_version(
            validation_workflow=self.vf, user=self.jim, clone_node_templates=True
        )

        self.vf.refresh_from_db()
        self.assertNotEqual(self.vf.versions.latest_by_version(), self.version)

        self.assertEqual(ValidationNodeTemplate.objects.count(), 4)

        new_version = self.vf.versions.latest_by_version()

        self.assertEqual(new_version.version_as_str, "2.0.0")

        self.assertEqual(new_version.node_templates.count(), 2)

        self.assertEqual(new_version.dump_nodes(), ["first_node_template", "second_node_template"])

        first_node_template = ValidationNodeTemplate.objects.get(name="first_node_template", workflow=new_version)

        self.assertEqual(
            list(first_node_template.roles_required.values_list("pk", flat=True)),
            [self.user_role.pk, self.other_user_role.pk],
        )
        self.assertEqual(first_node_template.description, "first node template")
        self.assertTrue(first_node_template.can_skip_previous_nodes)

        second_node_template = ValidationNodeTemplate.objects.get(name="second_node_template", workflow=new_version)

        self.assertEqual(
            list(second_node_template.roles_required.values_list("pk", flat=True)),
            [self.user_role.pk],
        )
        self.assertEqual(second_node_template.description, "second node template")
        self.assertFalse(second_node_template.can_skip_previous_nodes)

    def test_create_new_version_upgrade_strategies(self):
        ValidationWorkflowService.create_new_version(validation_workflow=self.vf, user=self.jim, upgrade="major")

        self.vf.refresh_from_db()
        self.assertNotEqual(self.vf.versions.latest_by_version(), self.version)

        self.assertEqual(ValidationNodeTemplate.objects.count(), 2)

        new_version = self.vf.versions.latest_by_version()

        self.assertEqual(new_version.version_as_str, "2.0.0")
        ValidationWorkflowService.create_new_version(validation_workflow=self.vf, user=self.jim, upgrade="minor")
        self.vf.refresh_from_db()
        self.assertNotEqual(self.vf.versions.latest_by_version(), self.version)

        self.assertEqual(ValidationNodeTemplate.objects.count(), 2)

        new_version = self.vf.versions.latest_by_version()

        self.assertEqual(new_version.version_as_str, "2.1.0")
        ValidationWorkflowService.create_new_version(validation_workflow=self.vf, user=self.jim, upgrade="patch")
        self.vf.refresh_from_db()
        self.assertNotEqual(self.vf.versions.latest_by_version(), self.version)

        self.assertEqual(ValidationNodeTemplate.objects.count(), 2)

        new_version = self.vf.versions.latest_by_version()

        self.assertEqual(new_version.version_as_str, "2.1.1")

    def test_create_specify_version(self):
        with self.assertRaises(ValueError):
            ValidationWorkflowService.create_new_version(
                validation_workflow=self.vf, user=self.jim, version="0.0.0", upgrade="major"
            )

        with self.assertRaises(ValueError):
            ValidationWorkflowService.create_new_version(
                validation_workflow=self.vf, user=self.jim, version="abc", upgrade="major"
            )

        ValidationWorkflowService.create_new_version(
            validation_workflow=self.vf, user=self.jim, version="3.1.3", upgrade="major"
        )

        self.vf.refresh_from_db()
        self.assertNotEqual(self.vf.versions.latest_by_version(), self.version)

        self.assertEqual(ValidationNodeTemplate.objects.count(), 2)

        new_version = self.vf.versions.latest_by_version()

        self.assertEqual(new_version.version_as_str, "3.1.3")
