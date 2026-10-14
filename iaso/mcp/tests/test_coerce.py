from __future__ import annotations

from typing import Optional

from django.test import SimpleTestCase

from iaso.mcp.protocol import coerce_tool_arguments


class CoerceToolArgumentsTest(SimpleTestCase):
    def test_casts_optional_ints_bools_and_floats(self):
        def _probe(
            parent_id: Optional[int] = None,
            confirm: Optional[bool] = None,
            ratio: Optional[float] = None,
        ):
            return None

        coerced = coerce_tool_arguments(
            _probe,
            {"parent_id": "4", "confirm": "false", "ratio": "1.5"},
        )
        self.assertEqual(coerced["parent_id"], 4)
        self.assertIs(coerced["confirm"], False)
        self.assertEqual(coerced["ratio"], 1.5)

    def test_negative_int_and_integral_float(self):
        def _probe(parent_id: Optional[int] = None):
            return None

        self.assertEqual(coerce_tool_arguments(_probe, {"parent_id": "-3"})["parent_id"], -3)
        self.assertEqual(coerce_tool_arguments(_probe, {"parent_id": 10.0})["parent_id"], 10)
        self.assertEqual(coerce_tool_arguments(_probe, {"parent_id": "--5"})["parent_id"], "--5")

    def test_rejects_unrecognised_confirm(self):
        def _probe(confirm: Optional[bool] = None):
            return None

        with self.assertRaises(ValueError):
            coerce_tool_arguments(_probe, {"confirm": "nope"})
