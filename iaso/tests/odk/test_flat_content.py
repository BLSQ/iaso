from django.test import SimpleTestCase

from iaso.odk.flat_content import ContentProblem, FlatContent, HeldBack, same_text, to_xml_text


#: as pyxform's `to_json_dict()` writes it
DESCRIPTOR = {
    "name": "data",
    "type": "survey",
    "children": [
        {
            "name": "household",
            "type": "group",
            "children": [
                {"name": "head_name", "type": "text"},
                {"name": "population", "type": "integer"},
            ],
        },
        {"name": "score", "type": "calculate", "calculation": "${population} * 2"},
        {"name": "visit_time", "type": "calculate", "calculation": "format-date-time(now(), '%H')"},
        {"name": "start", "type": "start"},
        {"name": "current_ou_name", "type": "text"},
        {"name": "photo", "type": "image"},
        {
            "name": "symptoms",
            "type": "select all that apply",
            "children": [{"name": "fever", "label": "Fever"}, {"name": "cough", "label": "Cough"}],
        },
        {
            "name": "child",
            "type": "repeat",
            "children": [
                {"name": "child_name", "type": "text"},
                {
                    "name": "details",
                    "type": "group",
                    "children": [{"name": "child_age", "type": "integer"}],
                },
                {"name": "vaccine", "type": "repeat", "children": [{"name": "vaccine_name", "type": "text"}]},
                {"name": "child_photo", "type": "image"},
            ],
        },
        {
            "name": "meta",
            "type": "group",
            "control": {"bodyless": True},
            "children": [
                {"name": "instanceID", "type": "calculate", "bind": {"readonly": "true()", "jr:preload": "uid"}}
            ],
        },
    ],
}


class FlatContentToAnswersTestCase(SimpleTestCase):
    def setUp(self):
        self.content = FlatContent(DESCRIPTOR)

    def test_names_become_paths_with_their_groups(self):
        answers = self.content.to_answers({"head_name": "Alice", "population": 7, "symptoms": ["fever", "cough"]})

        self.assertEqual(
            answers.answers,
            {"household/head_name": "Alice", "household/population": "7", "symptoms": "fever cough"},
        )
        self.assertEqual(answers.problems, [])
        self.assertEqual(answers.held_back, [])

    def test_repeats_by_one_based_index_nested_too(self):
        answers = self.content.to_answers(
            {
                "child": [
                    {"child_name": "Bob", "child_age": 4},
                    {"child_name": "Eve", "vaccine": [{"vaccine_name": "polio"}, {"vaccine_name": "measles"}]},
                ]
            }
        )

        self.assertEqual(
            answers.answers,
            {
                "child/child_name": "Bob",
                "child/details/child_age": "4",
                "child[2]/child_name": "Eve",
                "child[2]/vaccine/vaccine_name": "polio",
                "child[2]/vaccine[2]/vaccine_name": "measles",
            },
        )

    def test_binary_answers_are_listed_as_attachments(self):
        answers = self.content.to_answers(
            {"photo": "front.jpg", "child": [{"child_photo": "bob.jpg"}, {"child_photo": None}]}
        )

        self.assertEqual(answers.answers["photo"], "front.jpg")
        self.assertEqual(answers.answers["child[2]/child_photo"], None)
        self.assertEqual(
            answers.attachments, [("content.photo", "front.jpg"), ("content.child[1].child_photo", "bob.jpg")]
        )

    def test_empty_values_clear(self):
        answers = self.content.to_answers({"head_name": None, "population": "", "symptoms": []})

        self.assertEqual(answers.answers, {"household/head_name": None, "household/population": None, "symptoms": None})

    def test_computed_values_are_held_back(self):
        answers = self.content.to_answers(
            {
                "score": 14,
                "visit_time": "10",
                "start": "2026-11-08T10:00:00.000+01:00",
                "current_ou_name": "Brussels",
                "head_name": "Alice",
            }
        )

        self.assertEqual(answers.answers, {"household/head_name": "Alice"})
        self.assertEqual(
            answers.held_back,
            [
                HeldBack("content.score", "score", "14", volatile=False),
                HeldBack("content.visit_time", "visit_time", "10", volatile=True),
                HeldBack("content.start", "start", "2026-11-08T10:00:00.000+01:00", volatile=True),
                HeldBack("content.current_ou_name", "current_ou_name", "Brussels", volatile=False),
            ],
        )

    def test_instance_id_and_read_keys(self):
        answers = self.content.to_answers({"instanceID": "uuid:6f1c", "_version": "2026110801", "uuid": "6f1c"})

        self.assertEqual(answers.instance_id, "uuid:6f1c")
        self.assertEqual(answers.answers, {})
        self.assertEqual(answers.held_back, [])
        self.assertEqual(answers.problems, [])

    def test_problems_point_at_the_input(self):
        answers = self.content.to_answers(
            {
                "nope": "1",
                # only exists inside the repeat
                "child_name": "Bob",
                "population": True,
                "child": [{"child_name": "Bob", "other": "x"}],
                "symptoms": {"fever": True},
            }
        )

        self.assertEqual(
            answers.problems,
            [
                ContentProblem("UNKNOWN_QUESTION", "content.nope", "No such question in this form"),
                ContentProblem("UNKNOWN_QUESTION", "content.child_name", "No such question in this form"),
                ContentProblem(
                    "INVALID", "content.population", "Booleans aren't XForm values: use the choice's value", "True"
                ),
                ContentProblem("UNKNOWN_QUESTION", "content.child[1].other", "No such question in this form"),
                ContentProblem(
                    "INVALID",
                    "content.symptoms",
                    "Expected a text, a number, or a list of choices",
                    "{'fever': True}",
                ),
            ],
        )
        self.assertEqual(answers.answers, {"child/child_name": "Bob"})

    def test_a_repeat_must_be_a_list_of_objects(self):
        for value in ({"child_name": "Bob"}, ["Bob"], "Bob"):
            with self.subTest(value=value):
                answers = self.content.to_answers({"child": value})
                self.assertEqual(
                    answers.problems,
                    [
                        ContentProblem(
                            "INVALID", "content.child", "A repeat is a list of objects, one per repeat instance"
                        )
                    ],
                )

    def test_null_removes_repeat_instances_answers_renumbered(self):
        answers = self.content.to_answers(
            {
                "child": [
                    None,
                    {"child_name": "Eve", "vaccine": [{}, None, {"vaccine_name": "measles"}]},
                    {"vaccine": None},
                ]
            }
        )

        self.assertEqual(
            answers.removed,
            [
                ("content.child[1]", "child[1]"),
                ("content.child[2].vaccine[2]", "child[2]/vaccine[2]"),
                ("content.child[3].vaccine", "child[3]/vaccine[*]"),
            ],
        )
        # where they are once the removals done: Eve is the first child, measles her second vaccine
        self.assertEqual(answers.answers, {"child/child_name": "Eve", "child/vaccine[2]/vaccine_name": "measles"})
        self.assertEqual(answers.problems, [])

    def test_a_counted_repeat_is_not_removed(self):
        content = FlatContent(
            {
                "name": "data",
                "type": "survey",
                "children": [
                    {"name": "child", "type": "repeat", "control": {"jr:count": "${n}"}, "children": []},
                ],
            }
        )
        for value in (None, [{}, None]):
            with self.subTest(value=value):
                answers = content.to_answers({"child": value})
                self.assertEqual(
                    answers.problems,
                    [
                        ContentProblem(
                            "INVALID", "content.child", "Its instances follow its count: change the count instead"
                        )
                    ],
                )
                self.assertEqual(answers.removed, [])

    def test_field_of_an_odk_cli_path(self):
        self.assertEqual(self.content.field_of("household/population"), "content.population")
        self.assertEqual(self.content.field_of("child/details/child_age"), "content.child[1].child_age")
        self.assertEqual(
            self.content.field_of("child[2]/vaccine[3]/vaccine_name"), "content.child[2].vaccine[3].vaccine_name"
        )
        self.assertIsNone(self.content.field_of(None))


class FlatContentMismatchesTestCase(SimpleTestCase):
    def setUp(self):
        self.content = FlatContent(DESCRIPTOR)

    def test_equal_values_pass_numbers_compared_as_numbers(self):
        held_back = self.content.to_answers({"score": 14, "child": [{"child_name": "Bob"}]}).held_back

        self.assertEqual(self.content.mismatches(held_back, {"score": "14.0"}), ([], []))

    def test_different_values_are_refused_volatile_ones_only_reported(self):
        held_back = self.content.to_answers({"score": "12", "visit_time": "09", "start": "2026"}).held_back

        refused, ignored = self.content.mismatches(held_back, {"score": "14", "visit_time": "10", "start": "2026"})

        self.assertEqual(
            refused,
            [ContentProblem("CALCULATION_MISMATCH", "content.score", "The form computes '14', not '12'", "12", "14")],
        )
        self.assertEqual(
            ignored,
            [
                ContentProblem(
                    "CALCULATION_IGNORED",
                    "content.visit_time",
                    "Computed by the server, the value sent is ignored",
                    "09",
                    "10",
                )
            ],
        )

    def test_values_in_repeats(self):
        descriptor = {
            "type": "survey",
            "children": [
                {"name": "child", "type": "repeat", "children": [{"name": "age_months", "type": "calculate"}]}
            ],
        }
        content = FlatContent(descriptor)
        held_back = content.to_answers({"child": [{"age_months": "12"}, {"age_months": "30"}]}).held_back

        refused, _ = content.mismatches(held_back, {"child": [{"age_months": "12"}, {"age_months": "36"}]})

        self.assertEqual([problem.field for problem in refused], ["content.child[2].age_months"])

    def test_a_value_sent_for_an_empty_calculate(self):
        held_back = self.content.to_answers({"score": "14"}).held_back

        refused, _ = self.content.mismatches(held_back, {})

        self.assertEqual([(problem.answer, problem.expected) for problem in refused], [("14", None)])


class ValuesTestCase(SimpleTestCase):
    def test_to_xml_text(self):
        self.assertIsNone(to_xml_text(None))
        self.assertIsNone(to_xml_text(""))
        self.assertEqual(to_xml_text(7), "7")
        self.assertEqual(to_xml_text(0.5), "0.5")
        self.assertEqual(to_xml_text(["a", "b"]), "a b")
        with self.assertRaisesMessage(ValueError, "Not a number"):
            to_xml_text(float("nan"))
        with self.assertRaisesMessage(ValueError, "list of choices"):
            to_xml_text(["a b"])

    def test_same_text(self):
        self.assertTrue(same_text("7", "7.0"))
        self.assertTrue(same_text("0.3", "0.30000000000000004"))
        self.assertTrue(same_text(None, ""))
        self.assertFalse(same_text("0.3", "0.31"))
        self.assertFalse(same_text("a", "b"))
        self.assertFalse(same_text("1", None))
        self.assertTrue(same_text("2026-01-15", "2026-01-15"))
