from __future__ import annotations

from django.test import SimpleTestCase

from iaso.mcp.catalog import CATALOG_DOCS
from iaso.mcp.help import (
    _suggest_topics,
    all_topics,
    get_help_or_doc_payload,
    help_tool_description,
    openhexa_pipeline_auth_params,
)


class HelpOrDocTest(SimpleTestCase):
    def test_catalog_includes_claude_and_index(self):
        self.assertEqual(CATALOG_DOCS["claude"][0], "CLAUDE.md")
        self.assertEqual(CATALOG_DOCS["index"][0], "catalog/README.md")
        self.assertEqual(CATALOG_DOCS["docs"][0], "docs/index.en.md")

    def test_reason_suggests_entities(self):
        self.assertIn("entities", _suggest_topics("what is an entity duplicate"))

    def test_reason_suggests_fill_account(self):
        self.assertIn(
            "fill-account",
            _suggest_topics("need to fill a demo account from Excel"),
        )

    def test_local_topic(self):
        payload = get_help_or_doc_payload(topic="tools")
        self.assertTrue(payload["ok"])
        self.assertIn("iaso_raw", payload["content"])

    def test_unknown_topic(self):
        payload = get_help_or_doc_payload(topic="spaceships")
        self.assertFalse(payload["ok"])
        self.assertIn("spaceships", payload["error"])

    def test_description_embeds_claude_and_catalog(self):
        text = help_tool_description()
        self.assertIn("- claude:", text)
        self.assertIn("- index:", text)
        self.assertIn("- entities:", text)
        self.assertEqual(
            set(all_topics()) - set(CATALOG_DOCS),
            {"tools", "recipes", "fill-account", "openhexa"},
        )

    def test_reason_suggests_openhexa(self):
        self.assertIn("openhexa", _suggest_topics("pipeline auth from custom_connection"))
        self.assertIn("openhexa", _suggest_topics("do not use .env credentials"))
        self.assertIn("openhexa", _suggest_topics("list_connections on the workspace"))

    def test_openhexa_topic_forbids_connections(self):
        payload = get_help_or_doc_payload(topic="openhexa")
        self.assertTrue(payload["ok"])
        content = payload["content"]
        self.assertIn("IASO Django user", content)
        self.assertIn("NEVER", content)
        self.assertIn(".env", content)
        self.assertIn("iaso_whoami", content)
        self.assertIn("data source", content)
        self.assertIn("project", content)

    def test_mcp_auth_instructions_forbid_openhexa_connections(self):
        from iaso.mcp.help import mcp_auth_instructions

        text = mcp_auth_instructions()
        self.assertIn("NEVER use an OpenHEXA workspace connection", text)
        self.assertIn("logged-in IASO user", text)
        self.assertIn("project", text)
        self.assertIn("data source", text)
        self.assertNotIn("unless the user explicitly asks", text)

    def test_write_confirm_prompt_lists_target_fields(self):
        from iaso.mcp.recipes.fill_account.apply import connection_lines, connection_prompt

        info = {
            "base_url": "https://iaso-staging.bluesquare.org",
            "user_name": "cgerard",
            "user_full_name": "Christophe Gerard",
            "account_name": "xvydvce",
            "account_id": 142,
            "projects": [{"id": 1, "name": "Demo"}],
            "data_source_name": "DSINIS2",
            "data_source_id": 399,
            "default_version_id": 533,
        }
        lines = "\n".join(connection_lines(info))
        self.assertIn("url      https://iaso-staging.bluesquare.org", lines)
        self.assertIn("user     cgerard (Christophe Gerard)", lines)
        self.assertIn("account  xvydvce (142)", lines)
        self.assertIn("project  Demo (1)", lines)
        self.assertIn("source   DSINIS2 (399)  version 533", lines)
        prompt = connection_prompt(info)
        self.assertIn("Do you confirm to proceed?", prompt)
        self.assertIn("not an OpenHEXA connection", prompt)

    def test_openhexa_auth_params_are_public(self):
        params = openhexa_pipeline_auth_params(
            {
                "ok": True,
                "base_url": "https://iaso-staging.bluesquare.org",
                "login": "cgerardtest",
                "account_id": 142,
                "account_name": "xvydvce",
                "user_name": "cgerard",
            }
        )
        self.assertEqual(params["iaso_url"], "https://iaso-staging.bluesquare.org")
        self.assertEqual(params["iaso_login"], "cgerardtest")
        self.assertNotIn("iaso_password", params)
        self.assertNotIn("iaso_token", params)
        self.assertEqual(
            params["pipeline_config_public"],
            {
                "iaso_url": "https://iaso-staging.bluesquare.org",
                "iaso_login": "cgerardtest",
            },
        )
        forbidden = params["never_use"]
        self.assertTrue(any(".env" in item for item in forbidden))
        self.assertTrue(any("custom_connection" in item for item in forbidden))
        self.assertIn("url, user, account, project", params["before_write"])
