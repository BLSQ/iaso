"""PII filtering through the entities API endpoints. See `base.py` for the matrix and the expected visibility."""

import csv
import io
import json

from rest_framework import status

from iaso.tests.api.entities.pii.base import (
    ANSWERS_A,
    COLUMN_QUESTIONS,
    FIELDS_SEARCH_QUESTIONS,
    LABELS,
    MARKED_WITH_WHITELIST,
    QUESTIONS,
    SEARCH_TOKENS_A,
    SORTABLE_QUESTIONS,
    EntityPiiTestCase,
)


class EntityPiiViewsTestCase(EntityPiiTestCase):
    def get_entities(self, user, params, expected_status=status.HTTP_200_OK):
        self.client.force_authenticate(user)
        response = self.client.get("/api/entities/", params)
        return self.assertJSONResponse(response, expected_status)

    def get_entity_ids(self, user, params):
        return [row["id"] for row in self.get_entities(user, params)["result"]]

    @staticmethod
    def find_row(data, entity):
        return next(row for row in data["result"] if row["id"] == entity.id)

    def test_retrieve_attributes(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                self.client.force_authenticate(user)
                response = self.client.get(f"/api/entities/{scenario.entity_a.id}/")
                attributes = self.assertJSONResponse(response, status.HTTP_200_OK)["attributes"]

                self.assert_answers(attributes["file_content"], scenario, has_perm)
                # The raw XML contains every answer: its link is only given when nothing is filtered
                if self.is_filtered(scenario, has_perm):
                    self.assertIsNone(attributes["file_url"])
                    self.assertNotIn(ANSWERS_A["phone"], json.dumps(attributes))
                else:
                    self.assertIsNotNone(attributes["file_url"])

    def test_list_name(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                row = self.find_row(self.get_entities(user, {}), scenario.entity_a)
                expected = ANSWERS_A["name"] if self.is_visible("name", scenario, has_perm) else None
                self.assertEqual(row["name"], expected)

    def test_list_name_when_whitelisted(self):
        scenario = self.scenarios[MARKED_WITH_WHITELIST]
        scenario.form.non_pii_fields = ["name"]
        scenario.form.save()

        row = self.find_row(self.get_entities(scenario.users[False], {}), scenario.entity_a)
        self.assertEqual(row["name"], ANSWERS_A["name"])

    def test_list_entity_type_columns(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                data = self.get_entities(user, {"entity_type_ids": scenario.entity_type.id})

                visible = [question for question in QUESTIONS if self.is_visible(question, scenario, has_perm)]
                self.assertEqual([column["name"] for column in data["columns"]], visible)

                row = self.find_row(data, scenario.entity_a)
                for question in COLUMN_QUESTIONS:
                    if self.is_visible(question, scenario, has_perm):
                        self.assertEqual(row[question], ANSWERS_A[question])
                    else:
                        self.assertNotIn(question, row)

    def test_csv_export(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                self.client.force_authenticate(user)
                response = self.client.get(
                    "/api/entities/", {"entity_type_ids": scenario.entity_type.id, "csv": "true"}
                )
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                content = response.getvalue().decode("utf-8-sig")
                headers = next(csv.reader(io.StringIO(content)))

                for question in QUESTIONS:
                    if self.is_visible(question, scenario, has_perm):
                        self.assertIn(LABELS[question], headers)
                        self.assertIn(ANSWERS_A[question], content)
                    else:
                        self.assertNotIn(LABELS[question], headers)
                        self.assertNotIn(ANSWERS_A[question], content)

    def test_search(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                for question, token in SEARCH_TOKENS_A.items():
                    expected = [scenario.entity_a.id] if self.is_visible(question, scenario, has_perm) else []
                    self.assertEqual(self.get_entity_ids(user, {"search": token}), expected, question)

    def test_fields_search(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                for question in FIELDS_SEARCH_QUESTIONS:
                    params = {"fields_search": self.fields_search(scenario, question, ANSWERS_A[question])}
                    if self.can_fields_search(scenario, has_perm):
                        self.assertEqual(self.get_entity_ids(user, params), [scenario.entity_a.id], question)
                    else:
                        self.get_entities(user, params, status.HTTP_403_FORBIDDEN)

    def test_ordering(self):
        for scenario, has_perm, user in self.cases():
            with self.subTest(form=scenario.key, pii_permission=has_perm):
                for question in SORTABLE_QUESTIONS:
                    ascending = self.get_entity_ids(user, {"order": question})
                    descending = self.get_entity_ids(user, {"order": f"-{question}"})
                    if self.is_visible(question, scenario, has_perm):
                        self.assertEqual(ascending, [scenario.entity_b.id, scenario.entity_a.id], question)
                        self.assertEqual(descending, [scenario.entity_a.id, scenario.entity_b.id], question)
                    else:
                        # Sorting on a hidden question is ignored, otherwise the order would reveal its values
                        self.assertEqual(ascending, descending, question)
