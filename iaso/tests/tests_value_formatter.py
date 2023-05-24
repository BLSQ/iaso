from django.test import TestCase

from ..dhis2 import value_formatter  # type: ignore

orgunit_resolver = lambda x: "resolved-" + x


def buid_de(value_type, option_set=None):
    de = {"id": "dataElementId", "valueType": value_type}
    if option_set:
        de["optionSet"] = option_set
    return de


class ValueFormatterTests(TestCase):
    def test_formats_basic_types(self):
        testcases = (
            ("INTEGER", "", None),
            ("INTEGER", "25", 25),
            ("NUMBER", "", None),
            ("NUMBER", "25.5", 25.5),
            ("NUMBER", "25", 25),
            ("PERCENTAGE", "25", 25),
            ("BOOLEAN", "1", True),
            ("BOOLEAN", "0", False),
            ("BOOLEAN", "", None),
            ("BOOLEAN", "yes", True),
            ("BOOLEAN", "no", False),
            ("BOOLEAN", "true", True),
            ("BOOLEAN", "false", False),
            ("TEXT", "super large", "super large"),
            ("LONG_TEXT", "super large", "super large"),
            ("TIME", "08:30:00.000+01:00", "08:30"),
            ("DATE", "2017-11-28", "2017-11-28"),
            ("DATE", "", None),
            ("AGE", "2017-11-28", "2017-11-28"),
            ("AGE", "", None),
            ("USERNAME", "", ""),
            ("USERNAME", "yoda", "yoda"),
            ("EMAIL", "", ""),
            ("EMAIL", "yoda@galaxy.com", "yoda@galaxy.com"),
            ("PHONE_NUMBER", "0148-5465-456", "0148-5465-456"),
            ("PHONE_NUMBER", "", ""),
            ("LETTER", "", ""),
            ("LETTER", "A", "A"),
            ("COORDINATE", "", None),
            ("COORDINATE", "50.67630919162184 4.38517696224153 151.0 18.0", "[4.38517696224153,50.67630919162184]"),
            ("ORGANISATION_UNIT", "SDFJKLZ456", "resolved-SDFJKLZ456"),
        )

        for testcase in testcases:
            self.assertEquals(
                value_formatter.format_value(buid_de(testcase[0]), testcase[1], orgunit_resolver), testcase[2], testcase
            )

    def test_formats_options_with_odk_mapping(self):
        de = buid_de(
            "TEXT", {"options": [{"code": "HIV prevention", "odk": "1"}, {"code": "Malaria preventation", "odk": "20"}]}
        )
        self.assertEquals(value_formatter.format_value(de, "1", orgunit_resolver), "HIV prevention")
        self.assertEquals(value_formatter.format_value(de, "20", orgunit_resolver), "Malaria preventation")
        self.assertEquals(value_formatter.format_value(de, "", orgunit_resolver), None)

        with self.assertRaises(Exception) as context:
            value_formatter.format_value(de, "unknown value", orgunit_resolver)

        self.assertEqual(
            str(context.exception),
            "no value matching : 'unknown value' in {'id': 'dataElementId', 'valueType': 'TEXT', 'optionSet': {'options': [{'code': 'HIV prevention', 'odk': '1'}, {'code': 'Malaria preventation', 'odk': '20'}]}}",
        )

    def test_formats_options_with_only_codes(self):
        de = buid_de("TEXT", {"options": [{"code": "HIV prevention"}, {"code": "Malaria preventation"}]})
        self.assertEquals(value_formatter.format_value(de, "HIV prevention", orgunit_resolver), "HIV prevention")
        self.assertEquals(
            value_formatter.format_value(de, "Malaria preventation", orgunit_resolver), "Malaria preventation"
        )
        self.assertEquals(value_formatter.format_value(de, "", orgunit_resolver), None)

        with self.assertRaises(Exception) as context:
            value_formatter.format_value(de, "unknown value", orgunit_resolver)

        self.assertEqual(
            str(context.exception),
            "no value matching : 'unknown value' in {'id': 'dataElementId', 'valueType': 'TEXT', 'optionSet': {'options': [{'code': 'HIV prevention'}, {'code': 'Malaria preventation'}]}}",
        )

    def test_fail_fast_on_non_supported_types(self):
        de = buid_de("UNSUPPORTED")

        with self.assertRaises(Exception) as context:
            value_formatter.format_value(de, "unknown value", orgunit_resolver)

        self.assertEqual(
            str(context.exception),
            "(\"unsupported data element type : {'id': 'dataElementId', 'valueType': 'UNSUPPORTED'}\", 'unknown value')",
        )

    def test_fail_fast_on_bad_string_value(self):
        testcases = (
            ("INTEGER", "(\"Bad value for int 'a bad string'\", {'id': 'dataElementId', 'valueType': 'INTEGER'})"),
            ("NUMBER", "(\"Bad value for float 'a bad string'\", {'id': 'dataElementId', 'valueType': 'NUMBER'})"),
            ("BOOLEAN", "(\"Bad value for boolean 'a bad string'\", {'id': 'dataElementId', 'valueType': 'BOOLEAN'})"),
        )

        for testcase in testcases:
            de = buid_de(testcase[0])

            with self.assertRaises(Exception) as context:
                value_formatter.format_value(de, "a bad string", orgunit_resolver)
            print(str(context.exception))
            print(testcase[1])
            self.assertTrue(str(context.exception).startswith(testcase[1]))

    def test_dont_fail_fast_on_int_or_float(self):
        testcases = (
            ("INTEGER", 0),
            ("NUMBER", 0.0),
            ("NUMBER", 1.2),
        )

        for testcase in testcases:
            de = buid_de(testcase[0])
            value_formatter.format_value(de, testcase[1], orgunit_resolver)
