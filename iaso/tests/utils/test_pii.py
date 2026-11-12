from django.test import SimpleTestCase

from iaso import models as m
from iaso.utils.pii import filter_pii, filter_submission_files, get_allowed_fields, jsonlogic_vars


class FilterPiiTestCase(SimpleTestCase):
    def test_keeps_only_whitelisted_questions(self):
        allowed = frozenset({"muac", "_version"})
        self.assertEqual(
            filter_pii({"muac": "12.5", "first_name": "Amina", "_version": "1"}, allowed),
            {"muac": "12.5", "_version": "1"},
        )

    def test_is_case_insensitive(self):
        self.assertEqual(filter_pii({"MUAC": "12"}, frozenset({"muac"})), {"MUAC": "12"})

    def test_repeat_groups_keep_whitelisted_children_only(self):
        data = {"children": [{"child_name": "A", "child_age": 2}, {"child_name": "B"}], "name": "X"}
        self.assertEqual(filter_pii(data, frozenset({"child_age"})), {"children": [{"child_age": 2}]})

    def test_meta_keeps_only_technical_keys(self):
        allowed = get_allowed_fields(m.Form(non_pii_fields=[]), None)
        self.assertEqual(
            filter_pii({"meta": {"instanceID": "uuid:1", "instanceName": "Amina"}}, allowed),
            {"meta": {"instanceID": "uuid:1"}},
        )

    def test_list_of_values_is_a_leaf(self):
        self.assertEqual(filter_pii({"choices": ["a", "b"]}, frozenset()), {})
        self.assertEqual(filter_pii({"choices": ["a", "b"]}, frozenset({"choices"})), {"choices": ["a", "b"]})

    def test_form_without_configuration_is_not_filtered(self):
        self.assertIsNone(get_allowed_fields(m.Form(non_pii_fields=None), None))

    def test_files_of_hidden_questions_are_removed(self):
        files = ["https://s3/instancefiles/face_123.jpg", "https://s3/instancefiles/stock_456.jpg?sig=1"]
        self.assertEqual(
            filter_submission_files(files, {"stock_photo": "stock_456.jpg"}),
            ["https://s3/instancefiles/stock_456.jpg?sig=1"],
        )

    def test_jsonlogic_vars(self):
        logic = {"and": [{"==": [{"var": "gender"}, "F"]}, {">": [{"var": ["age__int__"]}, 3]}]}
        self.assertEqual(jsonlogic_vars(logic), {"gender", "age__int__"})
