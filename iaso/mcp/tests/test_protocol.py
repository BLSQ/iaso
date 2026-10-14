from __future__ import annotations

import json

from django.test import SimpleTestCase

from iaso.mcp.models import ToolCall
from iaso.mcp.protocol import _TOOLS, call_tool, sanitize_tool_arguments, tools_catalog
from iaso.test import TestCase


class SanitizeToolArgumentsTest(SimpleTestCase):
    def test_redacts_secrets_and_keeps_safe_fields(self):
        stored = sanitize_tool_arguments(
            {
                "xlsx_path": "demo.xlsx",
                "xlsx_base64": "AAAA" * 80,
                "password": "hunter2",
                "iaso_token": "tok_live_secret",
                "json_body": {"name": "facility", "token": "nested-secret"},
                "confirm": True,
            }
        )
        dumped = json.dumps(stored)
        self.assertEqual(stored["xlsx_path"], "demo.xlsx")
        self.assertTrue(stored["confirm"])
        self.assertIn("redacted", stored["xlsx_base64"])
        self.assertIn("redacted", stored["password"])
        self.assertIn("redacted", stored["iaso_token"])
        self.assertEqual(stored["json_body"], "[redacted]")
        self.assertNotIn("AAAA", dumped)
        self.assertNotIn("hunter2", dumped)
        self.assertNotIn("tok_live_secret", dumped)
        self.assertNotIn("nested-secret", dumped)

    def test_truncates_long_strings(self):
        stored = sanitize_tool_arguments({"note": "x" * 2000})
        self.assertTrue(stored["note"].startswith("x" * 500))
        self.assertIn("truncated 2000 chars", stored["note"])
        self.assertNotIn("x" * 501, stored["note"])


class ToolSchemaTest(SimpleTestCase):
    def _properties(self, name):
        import iaso.mcp.tools  # noqa: F401 — register tools

        catalog = tools_catalog()
        tool = next(item for item in catalog["tools"] if item["name"] == name)
        return tool["inputSchema"]["properties"]

    def test_list_org_units_limit_is_integer(self):
        properties = self._properties("list_org_units")
        self.assertEqual(properties["limit"]["type"], "integer")
        self.assertEqual(properties["page"]["type"], "integer")
        self.assertEqual(properties["parent_id"]["type"], "integer")

    def test_iaso_raw_confirm_is_boolean(self):
        properties = self._properties("iaso_raw")
        self.assertEqual(properties["confirm"]["type"], "boolean")
        self.assertEqual(properties["params"]["type"], "object")
        self.assertEqual(properties["json_body"]["type"], "object")


class ToolCallAuditTest(TestCase):
    def setUp(self):
        self.account, _source, _version, _project = self.create_account_datasource_version_project(
            "mcp-src", "MCP", "MCP Project"
        )
        self.user = self.create_user_with_profile(username="mcp-audit", account=self.account)

    def test_persists_redacted_arguments(self):
        def _probe(xlsx_base64: str = "", json_body=None):
            return {"ok": True}

        _TOOLS["_mcp_probe_redact"] = _probe
        try:
            call_tool(
                "_mcp_probe_redact",
                {"xlsx_base64": "SECRETDATA", "json_body": {"password": "hunter2"}},
                self.user,
            )
            stored = ToolCall.objects.get(tool_name="_mcp_probe_redact").arguments
        finally:
            _TOOLS.pop("_mcp_probe_redact", None)
        dumped = json.dumps(stored)
        self.assertNotIn("SECRETDATA", dumped)
        self.assertNotIn("hunter2", dumped)
        self.assertIn("redacted", stored["xlsx_base64"])
        self.assertEqual(stored["json_body"], "[redacted]")

    def test_call_tool_coerces_string_limit_before_invoke(self):
        seen = {}

        def _probe(limit: int = 10, confirm: bool = False):
            seen["limit"] = limit
            seen["confirm"] = confirm
            return {"ok": True}

        _TOOLS["_mcp_probe_coerce"] = _probe
        try:
            call_tool("_mcp_probe_coerce", {"limit": "10", "confirm": "false"}, self.user)
        finally:
            _TOOLS.pop("_mcp_probe_coerce", None)
        self.assertEqual(seen["limit"], 10)
        self.assertIs(seen["confirm"], False)
