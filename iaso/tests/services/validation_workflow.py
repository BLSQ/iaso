from iaso.models import Account, ValidationWorkflow
from iaso.services.validation_workflows import ValidationWorkflowService
from iaso.test import TestCase


class TestValidationWorkflowService(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="account")
        cls.jim = cls.create_user_with_profile(username="jim", account=cls.account)

    def test_create(self):
        ValidationWorkflowService.create(
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
