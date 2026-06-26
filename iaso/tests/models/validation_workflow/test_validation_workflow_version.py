from iaso.models import Account, Form, Instance
from iaso.services.validation_workflows import ValidationWorkflowService
from iaso.test import TestCase


class TestValidationWorkflowVersion(TestCase):
    def test_is_artifact_allowed(self):
        form = Form.objects.create()
        base_workflow = ValidationWorkflowService.create(
            user=None, name="test", account=Account.objects.create(name="test")
        )
        workflow = base_workflow.versions.latest_by_version()

        workflow.form_set.set([form])

        another_base_workflow = ValidationWorkflowService.create(
            user=None, name="another-test", account=Account.objects.create(name="test2")
        )
        another_workflow = another_base_workflow.versions.latest_by_version()

        another_form = Form.objects.create()

        instance = Instance.objects.create(form=form)
        another_instance = Instance.objects.create(form=another_form)

        self.assertTrue(workflow.is_artifact_allowed(instance))

        self.assertFalse(workflow.is_artifact_allowed(another_instance))

        self.assertFalse(another_workflow.is_artifact_allowed(instance))
        self.assertFalse(another_workflow.is_artifact_allowed(another_instance))
