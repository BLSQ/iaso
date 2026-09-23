from django.test import SimpleTestCase

from iaso.api.v3.common.fields_parser import FieldsParseError, parse_fields


class ParseFieldsTestCase(SimpleTestCase):
    def assert_parse_error(self, value, expected_in_detail):
        with self.assertRaises(FieldsParseError) as ctx:
            parse_fields(value)
        self.assertEqual(ctx.exception.detail["error"], "Invalid fields= parameter")
        self.assertIn(expected_in_detail, ctx.exception.detail["detail"])
        return ctx.exception.detail["detail"]

    def test_empty_or_blank_is_an_empty_tree(self):
        for value in ("", "   ", None):
            with self.subTest(value=value):
                self.assertEqual(parse_fields(value), {})

    def test_flat_list_keeps_requested_order(self):
        self.assertEqual(list(parse_fields("name,id,code")), ["name", "id", "code"])

    def test_nested_sub_selectors(self):
        self.assertEqual(
            parse_fields("id,version(id,data_source(name))"),
            {"id": {}, "version": {"id": {}, "data_source": {"name": {}}}},
        )

    def test_whitespace_is_ignored_between_tokens(self):
        self.assertEqual(parse_fields(" id , ancestors ( id , name ) "), parse_fields("id,ancestors(id,name)"))

    def test_empty_field_name_is_rejected(self):
        self.assert_parse_error("id,,name", "Expected a field name at position 3")

    def test_unclosed_sub_selector_is_rejected(self):
        self.assert_parse_error("id,ancestors(id,name", "Expected ')' to close 'ancestors'(...) but got end of string")

    def test_wrong_closing_bracket_suggests_parenthesis(self):
        self.assert_parse_error("ancestors(id,name]", "Did you mean ')' instead of ']'?")

    def test_trailing_garbage_without_bracket_typo_has_no_hint(self):
        detail = self.assert_parse_error("id;name", "Unexpected character ';' at position 2")
        self.assertNotIn("Did you mean", detail)
