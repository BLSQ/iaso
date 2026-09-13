from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from iaso.mcp.pyramid import plan_pyramid
from iaso.mcp.recipes.create_pyramid import (
    XLSX_PATH,
    collect_nodes,
    load_pyramid_spec,
    session_pyramid_target,
    summarize_pyramid,
)
from iaso.mcp.recipes.create_pyramid.workbook import write_sample_workbook


class PyramidSessionTargetTest(SimpleTestCase):
    def test_preview_does_not_hardcode_qa_ids(self):
        summary = summarize_pyramid()
        self.assertNotIn("data_source_id", summary)
        self.assertNotIn("source_version_id", summary)
        self.assertNotIn("project_id", summary)
        local = plan_pyramid()
        self.assertNotIn("data_source_id", local)
        self.assertNotIn("project_id", local)
        self.assertEqual(summary["xlsx"], "Org_Units.xlsx")
        self.assertEqual(XLSX_PATH.name, "Org_Units.xlsx")
        self.assertTrue(XLSX_PATH.is_file())

    @patch("iaso.mcp.recipes.fill_account.apply.current_account")
    def test_target_comes_from_session_account(self, mock_account):
        mock_account.return_value = {
            "data_source_id": 85,
            "default_version_id": 105,
            "projects": [{"id": 74, "name": "MCP_demo"}],
            "account_id": 75,
            "account_name": "IMPORT TEST",
            "data_source_name": "Demo pyramid",
        }
        target = session_pyramid_target(MagicMock())
        self.assertEqual(target["data_source_id"], 85)
        self.assertEqual(target["source_version_id"], 105)
        self.assertEqual(target["project_id"], 74)
        self.assertEqual(target["account_id"], 75)
        planned = plan_pyramid(MagicMock())
        self.assertEqual(planned["data_source_id"], 85)
        self.assertEqual(planned["project_id"], 74)
        self.assertNotEqual(planned["data_source_id"], 6)
        self.assertNotEqual(planned["project_id"], 5)

    @patch("iaso.mcp.recipes.fill_account.apply.current_account")
    def test_missing_project_raises(self, mock_account):
        mock_account.return_value = {
            "data_source_id": 85,
            "default_version_id": 105,
            "projects": [],
            "account_id": 75,
            "account_name": "IMPORT TEST",
        }
        with self.assertRaises(ValueError) as ctx:
            session_pyramid_target(MagicMock())
        self.assertIn("project", str(ctx.exception))


class PyramidWorkbookTest(SimpleTestCase):
    def test_sample_is_fake_and_inferred_from_excel(self):
        spec = load_pyramid_spec()
        geo_names = [level["name"] for level in spec.geo_levels]
        leaf_names = [leaf["name"] for leaf in spec.leaf_types]
        self.assertEqual(geo_names, ["Country", "Region", "District"])
        self.assertEqual(leaf_names, ["Health Facility", "Warehouse"])
        self.assertEqual([leaf["short_name"] for leaf in spec.leaf_types], ["HF", "WH"])
        self.assertNotIn("Upazila", geo_names)
        self.assertNotIn("Camp", geo_names)
        self.assertNotIn("Integrated Nutrition Facility", leaf_names)
        summary = summarize_pyramid(spec)
        type_names = [item["name"] for item in summary["types"]]
        self.assertEqual(type_names, geo_names + leaf_names)
        paths = [item["path"] for item in summary["sample_org_units"]]
        self.assertTrue(any("Demo Republic" in path for path in paths))
        self.assertFalse(any("Bangladesh" in path for path in paths))

    def test_infers_custom_columns_from_another_workbook(self):
        from openpyxl import Workbook

        with TemporaryDirectory() as tmp:
            path = Path(tmp) / "custom.xlsx"
            workbook = Workbook()
            sheet = workbook.active
            sheet.title = "Sites"
            sheet.append(["Continent", "Country", "Site"])
            sheet.append(["Africa", "Nimara", "River Clinic"])
            sheet.append(["Africa", "Nimara", "Hill Post"])
            workbook.save(path)
            spec = load_pyramid_spec(path)
        self.assertEqual([level["name"] for level in spec.geo_levels], ["Continent", "Country"])
        self.assertEqual([leaf["name"] for leaf in spec.leaf_types], ["Site"])
        self.assertEqual(spec.leaf_types[0]["sheet"], "Sites")
        names = [node[1] for node in collect_nodes(spec)]
        self.assertIn("Nimara", names)
        self.assertIn("River Clinic", names)

    def test_write_sample_matches_packaged_types(self):
        with TemporaryDirectory() as tmp:
            written = write_sample_workbook(Path(tmp) / "Org_Units.xlsx")
            spec = load_pyramid_spec(written)
        self.assertEqual(
            [level["name"] for level in spec.geo_levels],
            ["Country", "Region", "District"],
        )
        self.assertEqual(
            [leaf["name"] for leaf in spec.leaf_types],
            ["Health Facility", "Warehouse"],
        )
