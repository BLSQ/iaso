from __future__ import annotations

import json

from django.test import SimpleTestCase

from iaso.mcp.models import ToolCall
from iaso.mcp.protocol import _TOOLS, call_tool, coerce_tool_arguments, sanitize_tool_arguments
from iaso.mcp.serialize import clamp_limit
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


class ClampLimitTest(SimpleTestCase):
    def test_accepts_numeric_strings(self):
        self.assertEqual(clamp_limit("10"), 10)
        self.assertEqual(clamp_limit("999"), 50)
        self.assertEqual(clamp_limit("0"), 1)

    def test_keeps_ints(self):
        self.assertEqual(clamp_limit(25), 25)


class CoerceToolArgumentsTest(SimpleTestCase):
    def test_casts_string_ints_and_bools(self):
        def _probe(limit: int = 10, page: int = 1, confirm: bool = False, search: str | None = None):
            return {"limit": limit, "page": page, "confirm": confirm, "search": search}

        coerced = coerce_tool_arguments(
            _probe,
            {"limit": "10", "page": "2", "confirm": "false", "search": "clinic"},
        )
        self.assertEqual(coerced["limit"], 10)
        self.assertEqual(coerced["page"], 2)
        self.assertIs(coerced["confirm"], False)
        self.assertEqual(coerced["search"], "clinic")

    def test_true_string_becomes_bool(self):
        def _probe(confirm: bool = False):
            return confirm

        coerced = coerce_tool_arguments(_probe, {"confirm": "true"})
        self.assertIs(coerced["confirm"], True)


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
