from rest_framework import status

from iaso import models as m
from iaso.tests.api.scenarios.base import URL, ScenarioAPITestCase


class ScenarioFiltersTestCase(ScenarioAPITestCase):
    def ids(self, **params):
        data = self.assertJSONResponse(self.client.get(URL, params), status.HTTP_200_OK)
        return [scenario["id"] for scenario in data["results"]]

    def test_kind(self):
        self.assertEqual(self.ids(kind="form"), [self.form_scenario.id])
        self.assertEqual(self.ids(kind="entity"), [self.failing.id, self.passing.id])

    def test_unknown_kind(self):
        response = self.client.get(URL, {"kind": "household"})

        self.assertHasError(self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST), "kind")

    def test_entity_type(self):
        self.assertEqual(self.ids(entity_type_id=self.belgium.entity_type.id), [self.failing.id, self.passing.id])
        # France's: nothing, not France's scenarios
        self.assertEqual(self.ids(entity_type_id=self.france.entity_type.id), [])

    def test_workflow_version(self):
        draft = m.WorkflowVersion.objects.create(workflow=self.belgium.version.workflow, name="Draft")

        self.assertEqual(self.ids(workflow_version_id=draft.id), [self.failing.id, self.passing.id])
        self.assertEqual(self.ids(workflow_version_id=self.france.version.id), [])

    def test_search(self):
        self.assertEqual(self.ids(search="oedema"), [self.failing.id, self.passing.id])
