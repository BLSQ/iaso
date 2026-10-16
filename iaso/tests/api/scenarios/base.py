"""The scenario API tests' data; no test here."""

from iaso.permissions.core_permissions import CORE_WORKFLOW_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin
from iaso.tests.scenarios.fixtures import FAILING, FORM, PASSING, create_nutrition_setup, create_scenario


URL = "/api/scenarios/"
RUN_URL = "/api/scenarios/run/"


class ScenarioAPITestCase(SwaggerTestCaseMixin, APITestCase):
    """The nutrition workflow of the scenario examples in two accounts, Belgium and France, with the same forms
    (`form_id`): Belgium has a passing, a failing, a form and a deleted scenario, France one scenario."""

    @classmethod
    def setUpTestData(cls):
        cls.belgium = create_nutrition_setup("Belgium")
        cls.france = create_nutrition_setup("France")
        cls.user = cls.create_user_with_profile(
            username="belgium", account=cls.belgium.account, permissions=[CORE_WORKFLOW_PERMISSION]
        )
        cls.user_without_permission = cls.create_user_with_profile(username="no_perm", account=cls.belgium.account)
        cls.user_france = cls.create_user_with_profile(
            username="france", account=cls.france.account, permissions=[CORE_WORKFLOW_PERMISSION]
        )

        cls.passing = create_scenario(cls.belgium, PASSING)
        cls.failing = create_scenario(cls.belgium, FAILING)
        cls.form_scenario = create_scenario(cls.belgium, FORM)
        cls.deleted = create_scenario(cls.belgium, PASSING, name="Deleted")
        cls.deleted.delete()
        cls.france_scenario = create_scenario(cls.france, PASSING)

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)
