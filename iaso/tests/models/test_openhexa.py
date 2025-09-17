from iaso.models import OpenHEXAInstance, OpenHEXAWorkspace
from iaso.test import TestCase


class SupersetTestCase(TestCase):
    def setUp(self):
        self.openhexa_instance = OpenHEXAInstance.objects.create(
            name="OpenHEXA Prod",
            url="https://app.openhexa.org",
            token="a-valid-api-token",
            description="Description",
        )

    def test_openhexa_dashboard(self):
        self.assertEqual(self.openhexa_instance.name, "OpenHEXA Prod")
        self.assertEqual(self.openhexa_instance.url, "https://app.openhexa.org")
        self.assertEqual(self.openhexa_instance.token, "test")
        self.assertEqual(self.openhexa_instance.description, "Description")
