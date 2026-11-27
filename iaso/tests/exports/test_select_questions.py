from django.test import SimpleTestCase

from iaso.exports.submissions import select_questions


POSSIBLE_FIELDS = [
    {"name": "first_name", "label": "First name", "type": "text"},
    {"name": "muac", "label": "MUAC", "type": "decimal"},
    {"name": "instanceID", "label": "instanceID", "type": "calculate"},
]


def names(fields):
    return [field["name"] for field in fields]


class SelectQuestionsTestCase(SimpleTestCase):
    def test_no_selection_keeps_every_question(self):
        self.assertEqual(names(select_questions(POSSIBLE_FIELDS)), ["first_name", "muac", "instanceID"])

    def test_only_question_names_keeps_the_form_order(self):
        selected = select_questions(POSSIBLE_FIELDS, only_question_names=["muac", "first_name"])
        self.assertEqual(names(selected), ["first_name", "muac"])

    def test_exclude_question_names(self):
        selected = select_questions(POSSIBLE_FIELDS, exclude_question_names=["instanceID"])
        self.assertEqual(names(selected), ["first_name", "muac"])

    def test_names_are_case_insensitive(self):
        self.assertEqual(names(select_questions(POSSIBLE_FIELDS, only_question_names=["INSTANCEID"])), ["instanceID"])
        self.assertEqual(
            names(select_questions(POSSIBLE_FIELDS, exclude_question_names=["instanceid"])), ["first_name", "muac"]
        )

    def test_unknown_question_name_is_refused(self):
        for selection in ({"only_question_names": ["muac", "age"]}, {"exclude_question_names": ["age"]}):
            with self.subTest(**selection):
                with self.assertRaisesMessage(ValueError, "Unknown question names: age"):
                    select_questions(POSSIBLE_FIELDS, **selection)
