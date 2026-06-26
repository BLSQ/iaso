from django.conf import settings

from iaso.models import ValidationWorkflowVersion
from iaso.test import IasoMigratorTestCase


class Test0395DirectMigration(IasoMigratorTestCase):
    migrate_from = ("iaso", "0394_remove_show_pages_feature_flag")
    migrate_to = ("iaso", "0395_validationworkflowversion_and_more")
    num_queries = 64

    def prepare(self):
        # create some validation workflows with node templates , attach them to forms
        ValidationWorkflow = self.old_state.apps.get_model("iaso", "ValidationWorkflow")
        ValidationNodeTemplate = self.old_state.apps.get_model("iaso", "ValidationNodeTemplate")
        Form = self.old_state.apps.get_model("iaso", "Form")
        Account = self.old_state.apps.get_model("iaso", "Account")
        User = self.old_state.apps.get_model(settings.AUTH_USER_MODEL)
        self.account = Account.objects.create(name="account")
        self.jim = User.objects.create(username="jim")

        self.form_1 = Form.objects.create(name="Hydroponics study")
        self.form_2 = Form.objects.create(name="Another hydroponics study")
        self.form_3 = Form.objects.create(name="Another hydroponics study 2")
        self.form_4 = Form.objects.create(name="Another hydroponics study 3")

        self.vf = ValidationWorkflow.objects.create(
            name="vf", account=self.account, description="description", created_by=self.jim
        )
        self.node_template = ValidationNodeTemplate.objects.create(
            name="First node",
            description="First node description",
            can_skip_previous_nodes=False,
            workflow=self.vf,
        )

        self.second_node_template = ValidationNodeTemplate.objects.create(
            name="Second node",
            description="Second node description",
            can_skip_previous_nodes=True,
            workflow=self.vf,
        )

        self.second_node_template.next_node_templates.add(self.node_template)

        self.vf.form_set.set([self.form_1, self.form_2, self.form_3])

        self.other_vf = ValidationWorkflow.objects.create(
            name="other_vf", account=self.account, description="description", created_by=self.jim, updated_by=self.jim
        )
        self.other_node_template = ValidationNodeTemplate.objects.create(
            name="First node",
            description="First node description",
            can_skip_previous_nodes=False,
            workflow=self.other_vf,
        )

        self.other_second_node_template = ValidationNodeTemplate.objects.create(
            name="Second node",
            description="Second node description",
            can_skip_previous_nodes=True,
            workflow=self.other_vf,
        )

        self.other_node_template.next_node_templates.add(self.other_second_node_template)

        self.other_vf.form_set.set([self.form_4])

    def test_migration(self):
        ValidationWorkflow = self.new_state.apps.get_model("iaso", "ValidationWorkflow")
        ValidationNodeTemplate = self.new_state.apps.get_model("iaso", "ValidationNodeTemplate")
        ValidationWorkflowVersion = self.new_state.apps.get_model("iaso", "ValidationWorkflowVersion")

        self.assertEqual(ValidationWorkflow.objects.count(), 2)
        self.assertEqual(ValidationNodeTemplate.objects.count(), 4)
        self.assertEqual(ValidationWorkflowVersion.objects.count(), 2)

        vf = ValidationWorkflow.objects.get(name="vf")

        self.assertEqual(vf.name, "vf")
        self.assertEqual(vf.description, "description")
        self.assertEqual(vf.versions.count(), 1)

        version = vf.versions.first()

        self.assertEqual(str(version.version), "1.0.0")
        self.assertEqual(version.created_by.id, self.jim.id)
        self.assertIsNone(version.updated_by)
        self.assertCountEqual(
            list(vf.form_set.values_list("pk", flat=True)), [self.form_1.pk, self.form_2.pk, self.form_3.pk]
        )

        self.assertEqual(
            list(version.node_templates.values_list("pk", flat=True)),
            [self.node_template.pk, self.second_node_template.pk],
        )

        vf = ValidationWorkflow.objects.get(name="other_vf")

        self.assertEqual(vf.name, "other_vf")
        self.assertEqual(vf.description, "description")
        self.assertEqual(vf.versions.count(), 1)

        version = vf.versions.first()

        self.assertEqual(str(version.version), "1.0.0")
        self.assertEqual(version.created_by_id, self.jim.id)
        self.assertEqual(version.updated_by_id, self.jim.id)
        self.assertCountEqual(list(vf.form_set.values_list("pk", flat=True)), [self.form_4.pk])

        self.assertEqual(
            list(version.node_templates.values_list("pk", flat=True)),
            [self.other_node_template.pk, self.other_second_node_template.pk],
        )


class Test0395ReverseMigration(IasoMigratorTestCase):
    migrate_to = ("iaso", "0394_remove_show_pages_feature_flag")
    migrate_from = ("iaso", "0395_validationworkflowversion_and_more")
    num_queries = 69

    def prepare(self):
        # create some validation workflows with node templates , attach them to forms
        ValidationWorkflow = self.old_state.apps.get_model("iaso", "ValidationWorkflow")
        ValidationNodeTemplate = self.old_state.apps.get_model("iaso", "ValidationNodeTemplate")
        Form = self.old_state.apps.get_model("iaso", "Form")
        Account = self.old_state.apps.get_model("iaso", "Account")
        User = self.old_state.apps.get_model(settings.AUTH_USER_MODEL)
        self.account = Account.objects.create(name="account")
        self.jim = User.objects.create(username="jim")

        self.form_1 = Form.objects.create(name="Hydroponics study")
        self.form_2 = Form.objects.create(name="Another hydroponics study")
        self.form_3 = Form.objects.create(name="Another hydroponics study 2")
        self.form_4 = Form.objects.create(name="Another hydroponics study 3")

        self.vf = ValidationWorkflow.objects.create(name="vf", account=self.account, description="description")
        self.vf_version = ValidationWorkflowVersion.objects.create(
            version="1.0.0", created_by_id=self.jim.id, main_workflow_id=self.vf.id
        )
        self.vf_version_2 = ValidationWorkflowVersion.objects.create(
            version="2.0.0", created_by_id=self.jim.id, main_workflow_id=self.vf.id
        )

        self.node_template = ValidationNodeTemplate.objects.create(
            name="First node",
            description="First node description",
            can_skip_previous_nodes=False,
            workflow_id=self.vf_version.id,
        )

        self.second_node_template = ValidationNodeTemplate.objects.create(
            name="Second node",
            description="Second node description",
            can_skip_previous_nodes=True,
            workflow_id=self.vf_version.id,
        )

        self.second_node_template.next_node_templates.add(self.node_template)

        self.third_node_template = ValidationNodeTemplate.objects.create(
            name="First node",
            description="First node description",
            can_skip_previous_nodes=False,
            workflow_id=self.vf_version_2.id,
        )

        self.fourth_node_template = ValidationNodeTemplate.objects.create(
            name="Second node",
            description="Second node description",
            can_skip_previous_nodes=True,
            workflow_id=self.vf_version_2.id,
        )

        self.second_node_template.next_node_templates.add(self.node_template)

        self.vf.form_set.set([self.form_1, self.form_2, self.form_3])

        self.other_vf = ValidationWorkflow.objects.create(
            name="other_vf", account=self.account, description="description"
        )
        self.other_vf_version = ValidationWorkflowVersion.objects.create(
            main_workflow_id=self.other_vf.id, version="1.0.0", created_by_id=self.jim.id, updated_by_id=self.jim.id
        )

        self.other_node_template = ValidationNodeTemplate.objects.create(
            name="First node",
            description="First node description",
            can_skip_previous_nodes=False,
            workflow_id=self.other_vf_version.id,
        )

        self.other_second_node_template = ValidationNodeTemplate.objects.create(
            name="Second node",
            description="Second node description",
            can_skip_previous_nodes=True,
            workflow_id=self.other_vf_version.id,
        )

        self.other_node_template.next_node_templates.add(self.other_second_node_template)

        self.other_vf.form_set.set([self.form_4])

    def test_migration(self):
        ValidationWorkflow = self.new_state.apps.get_model("iaso", "ValidationWorkflow")
        ValidationNodeTemplate = self.new_state.apps.get_model("iaso", "ValidationNodeTemplate")

        self.assertEqual(ValidationWorkflow.objects.count(), 3)
        self.assertEqual(ValidationNodeTemplate.objects.count(), 6)

        vf = ValidationWorkflow.objects.get(name="vf")

        self.assertEqual(vf.name, "vf")
        self.assertEqual(vf.description, "description")
        self.assertEqual(vf.created_by_id, self.jim.pk)
        self.assertIsNone(vf.updated_by_id)

        self.assertEqual(
            list(vf.node_templates.values_list("pk", flat=True)),
            [self.third_node_template.pk, self.fourth_node_template.pk],
        )

        vf = ValidationWorkflow.objects.get(name="vf-v1.0.0")

        self.assertEqual(vf.name, "vf-v1.0.0")
        self.assertEqual(vf.description, "description")
        self.assertEqual(vf.created_by_id, self.jim.pk)
        self.assertIsNone(vf.updated_by_id)

        self.assertEqual(
            list(vf.node_templates.values_list("pk", flat=True)),
            [self.node_template.pk, self.second_node_template.pk],
        )

        vf = ValidationWorkflow.objects.get(name="other_vf")

        self.assertEqual(vf.name, "other_vf")
        self.assertEqual(vf.description, "description")
        self.assertEqual(vf.created_by_id, self.jim.pk)
        self.assertEqual(vf.updated_by_id, self.jim.pk)

        self.assertEqual(
            list(vf.node_templates.values_list("pk", flat=True)),
            [self.other_node_template.pk, self.other_second_node_template.pk],
        )
