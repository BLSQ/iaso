import json
import os

from django.test import SimpleTestCase

from iaso.scenarios.device_values import DeviceValueError, device_value
from iaso.scenarios.jsonlogic import JsonLogicError, apply, evaluate_condition, parse


PARITY_FIXTURE = os.path.join(os.path.dirname(__file__), "jsonlogic_parity", "json_logic_java_1_1_0.json")

CONVERTERS = {
    "int": int,
    "long": int,
    "double": float,
    "bool": lambda value: value == "true",
    "str": str,
    "list": lambda value: value.split(",") if value else [],
    "null": lambda value: None,
}


def data_from_spec(spec: str) -> dict:
    """`key=type:value;...`, as in jsonlogic_parity/cases.tsv."""
    data = {}
    for item in filter(None, spec.split(";")):
        key, typed = item.split("=", 1)
        kind, _, value = typed.partition(":")
        data[key] = CONVERTERS[kind](value)
    return data


class JsonLogicParityTestCase(SimpleTestCase):
    """Every case of jsonlogic_parity/cases.tsv gives what json-logic-java 1.1.0 (the app's library) gives."""

    def test_same_results_as_json_logic_java(self):
        with open(PARITY_FIXTURE) as fixture:
            cases = json.load(fixture)
        for case in cases:
            with self.subTest(logic=case["logic"], data=case["data"]):
                try:
                    result, error = apply(parse(case["logic"]), data_from_spec(case["data"])), None
                except JsonLogicError as e:
                    result, error = None, e
                if case["error"]:
                    self.assertIsNotNone(error, f"java raised {case['error']}, python gave {result!r}")
                    continue
                self.assertIsNone(error)
                self.assertEqual(result, case["result"])
                self.assertEqual(isinstance(result, bool), case["result_type"] == "Boolean")


class EvaluateConditionTestCase(SimpleTestCase):
    def test_typed_int_equals_string(self):
        # the nutrition workflow's conditions compare `__int__` calculates to "0"
        self.assertTrue(evaluate_condition({"==": [{"var": "visits__int__"}, "0"]}, {"visits__int__": 0}).value)

    def test_boolean_equals_any_non_empty_string(self):
        self.assertTrue(evaluate_condition({"==": [{"var": "cured__bool__"}, "no"]}, {"cured__bool__": True}).value)

    def test_conditions_the_app_cannot_evaluate(self):
        # the server's default condition: json.dumps({}) can't be parsed, the app gets the text back, not a Boolean
        self.assertEqual(evaluate_condition({}, {}).error.code, "PARSE_ERROR")
        self.assertEqual(evaluate_condition({"contains": [{"var": "x"}, "a"]}, {}).error.code, "EVALUATION_ERROR")
        self.assertEqual(evaluate_condition({"var": "x"}, {"x": 1}).error.code, "NOT_BOOLEAN")
        self.assertEqual(evaluate_condition({"and": []}, {}).error.code, "EVALUATION_ERROR")

    def test_read_variables(self):
        result = evaluate_condition({"<": [{"var": "age"}, 24]}, {"age": 11, "name": "Luke"})
        self.assertEqual(result.read, {"age": 11})


class DeviceValueTestCase(SimpleTestCase):
    def test_types(self):
        self.assertEqual(device_value("age", "11", {"type": "integer"}), 11)
        self.assertEqual(device_value("muac", "12.0", {"type": "decimal"}), 12.0)
        self.assertEqual(device_value("visits__int__", "0", {"type": "calculate"}), 0)
        self.assertEqual(device_value("visits", "0", {"type": "calculate"}), "0")
        self.assertEqual(device_value("colors", "red blue", {"type": "select all that apply"}), ["red", "blue"])
        self.assertEqual(device_value("dob", "2026-10-08", {"type": "date"}), 1791417600000)
        self.assertIsNone(device_value("age", "", {"type": "integer"}))

    def test_boolean_calculate_is_only_true_for_1(self):
        self.assertTrue(device_value("cured__bool__", "1", {"type": "calculate"}))
        self.assertFalse(device_value("cured__bool__", "true", {"type": "calculate"}))

    def test_int_calculate_with_a_decimal_value(self):
        with self.assertRaises(DeviceValueError):
            device_value("visits__int__", "12.0", {"type": "calculate"})
