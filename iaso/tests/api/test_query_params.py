import base64

from django.test import SimpleTestCase
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso.api.query_params import CURSOR, encode_cursor, get_cursor_id


def cursor_request(**params) -> Request:
    return Request(APIRequestFactory().get("/", data=params))


class CursorTestCase(SimpleTestCase):
    def assert_cursor_error(self, params: dict, expected_message: str):
        with self.assertRaises(serializers.ValidationError) as ctx:
            get_cursor_id(cursor_request(**params), "entities")
        self.assertEqual(ctx.exception.detail, {CURSOR: expected_message})

    def test_encode_cursor_is_base64url_json_without_padding(self):
        cursor = encode_cursor("entities", 12)

        self.assertEqual(cursor, "eyJtb2RlbCI6ImVudGl0aWVzIiwiYWZ0ZXIiOjEyfQ")
        self.assertNotIn("=", cursor)

    def test_get_cursor_id_decodes_encode_cursor(self):
        for after_id in (0, 1, 12, 123456789):
            with self.subTest(after_id):
                request = cursor_request(cursor=encode_cursor("entities", after_id))

                self.assertEqual(get_cursor_id(request, "entities"), after_id)

    def test_get_cursor_id_without_cursor_is_none(self):
        for params in ({}, {"cursor": ""}):
            with self.subTest(params):
                self.assertIsNone(get_cursor_id(cursor_request(**params), "entities"))

    def test_get_cursor_id_invalid_cursor(self):
        invalid_cursors = {
            "not base64": "abc!",
            "not json": "YWJj",  # "abc"
            "raw id": "12",
            "no model": base64.urlsafe_b64encode(b'{"after":1}').decode(),
            "no after": base64.urlsafe_b64encode(b'{"model":"entities"}').decode(),
            "string id": base64.urlsafe_b64encode(b'{"model":"entities","after":"1"}').decode(),
            "boolean id": base64.urlsafe_b64encode(b'{"model":"entities","after":true}').decode(),
            "negative id": encode_cursor("entities", -1),
            "not an object": base64.urlsafe_b64encode(b"[1]").decode(),
        }

        for name, cursor in invalid_cursors.items():
            with self.subTest(name):
                self.assert_cursor_error({"cursor": cursor}, f"Invalid cursor '{cursor}'.")

    def test_get_cursor_id_cursor_of_another_model(self):
        self.assert_cursor_error(
            {"cursor": encode_cursor("orgunits", 1)}, "This cursor pages 'orgunits', not 'entities'."
        )

    def test_get_cursor_id_with_order(self):
        self.assert_cursor_error(
            {"cursor": encode_cursor("entities", 1), "order": "-created_at"},
            "'cursor' can't be combined with 'order', it pages by id.",
        )
