import json
import logging

from unittest import mock

from django.test import override_settings

from iaso import models as m
from iaso.tests.graphql.base import URL, GraphQLTestCase


LOGGER = "iaso.graphql.operations"


class OperationLogTestCase(GraphQLTestCase):
    """The `graphql.start`/`graphql.end` JSON lines of `iaso.graphql.monitoring`."""

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Ministry of Health")
        cls.account = account
        cls.user = cls.create_user_with_profile(username="viewer", account=account)

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)
        # `iaso/tests/__init__.py` disables every log: these tests read them
        logging.disable(logging.NOTSET)
        self.addCleanup(logging.disable, logging.CRITICAL)

    def logged(self, query, variables=None, operation_name=None):
        """The response's body and the log lines, parsed."""
        payload = {"query": query, "variables": variables or {}}
        if operation_name:
            payload["operationName"] = operation_name
        with self.assertLogs(LOGGER, level="INFO") as logs:
            response = self.client.post(URL, payload, format="json")
        lines = [json.loads(record.getMessage()) for record in logs.records]
        return response, lines, logs

    def test_start_then_end_of_a_named_operation(self):
        query = """query Districts($filters: OrgUnitFilter, $limit: Int!) {
          orgUnits(filters: $filters, limit: $limit) { items { id name } hasNextPage }
        }"""
        variables = {"filters": {"validationStatus": "VALID", "nameIContains": "Kanda", "parentId": None}, "limit": 5}
        response, (start, end), logs = self.logged(query, variables, "Districts")
        self.assertEqual(response.status_code, 200)
        common = {
            "request_id": start["request_id"],
            "user_id": self.user.id,
            "account_id": self.account.id,
            "operation": "Districts",
            "type": "query",
            "root": ["orgUnits"],
            # the names of the filters given, not their values; `limit` itself
            "args": {"orgUnits": {"filters": ["nameIContains", "validationStatus"], "limit": 5}},
            "fields": 5,  # orgUnits, items, id, name, hasNextPage
        }
        self.assertEqual({key: start[key] for key in common}, common)
        self.assertEqual((start["event"], start["level"]), ("graphql.start", "INFO"))
        self.assertEqual({key: end[key] for key in common}, common)
        self.assertEqual((end["event"], end["status"], end["errors"], end["refused"]), ("graphql.end", 200, [], {}))
        self.assertGreater(end["sql"]["count"], 0)
        self.assertEqual(end["bytes"], len(response.content))
        self.assertNotIn("query", end)  # not slow
        for line in logs.output:
            self.assertNotIn("Kanda", line)

    def test_literal_arguments(self):
        query = '{ orgUnits(filters: {nameIContains: "secret"}, limit: 3, offset: 6) { items { id } } }'
        _response, (start, _end), logs = self.logged(query)
        self.assertEqual(start["args"], {"orgUnits": {"filters": ["nameIContains"], "limit": 3, "offset": 6}})
        self.assertIsNone(start["operation"])
        self.assertNotIn("secret", "".join(logs.output))

    def test_error_codes(self):
        _response, (_start, end), _logs = self.logged("{ orgUnits(limit: 0) { items { id } } }")
        self.assertEqual(end["errors"], ["BAD_USER_INPUT"])

    def test_syntax_error_only_ends(self):
        response, lines, _logs = self.logged("{ orgUnits(")
        self.assertEqual(response.status_code, 400)
        (end,) = lines
        self.assertEqual((end["event"], end["status"]), ("graphql.end", 400))
        self.assertTrue(end["errors"])

    def test_mutation_refusals(self):
        query = 'mutation { updateSubmissionPeriod(id: 0, period: "202401") { errors { code } } }'
        _response, (start, end), _logs = self.logged(query)
        self.assertEqual((start["type"], start["root"]), ("mutation", ["updateSubmissionPeriod"]))
        self.assertEqual(end["errors"], ["FORBIDDEN"])  # a viewer can't edit submissions

    @override_settings(GRAPHQL_SLOW_MS=0)
    def test_slow_operations_with_their_text(self):
        query = "query ($filters: OrgUnitFilter) { orgUnits(filters: $filters) { items { id } } }"
        _response, (_start, end), logs = self.logged(query, {"filters": {"nameIContains": "Kanda"}})
        self.assertEqual(end["level"], "WARNING")
        self.assertEqual(end["query"], query)
        self.assertNotIn("Kanda", "".join(logs.output))

    def test_a_crash_still_ends(self):
        with mock.patch("iaso.graphql.views.graphql_sync", side_effect=RuntimeError("boom")):
            with self.assertLogs(LOGGER, level="INFO") as logs, self.assertRaises(RuntimeError):
                self.client.post(URL, {"query": "{ orgUnits { items { id } } }"}, format="json")
        (end,) = [json.loads(record.getMessage()) for record in logs.records]
        self.assertEqual((end["event"], end["status"], end["bytes"]), ("graphql.end", 500, 0))
