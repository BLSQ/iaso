from iaso.test import TestCase
from iaso.utils.jsonlogic import instance_jsonlogic_to_q, jsonlogic_to_q


class JsonLogicTests(TestCase):
    def test_jsonlogic_to_q_filters_base(self) -> None:
        """The base case of jsonlogic_to_q works as expected."""
        filters = {"and": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, "25"]}]}
        q = jsonlogic_to_q(filters)
        self.assertEqual(str(q), "(AND: ('gender__exact', 'F'), ('age__lt', '25'))")

    def test_jsonlogic_to_q_filters_not(self) -> None:
        """The not operator works as expected"""
        filters = {"!": {"and": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, "25"]}]}}
        q = jsonlogic_to_q(filters)
        self.assertEqual(str(q), "(NOT (AND: ('gender__exact', 'F'), ('age__lt', '25')))")

    def test_jsonlogic_to_q_filters_field_prefix(self) -> None:
        """The field_prefix argument is taken into account."""
        filters = {"and": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, "25"]}]}
        q = jsonlogic_to_q(filters, field_prefix="content__")
        self.assertEqual(str(q), "(AND: ('content__gender__exact', 'F'), ('content__age__lt', '25'))")

    def test_jsonlogic_to_q_filters_field_recursive(self) -> None:
        """And / or operators can be recursively nested."""
        filters = {
            "and": [
                {"==": [{"var": "gender"}, "F"]},
                {"or": [{"==": [{"var": "age"}, "20"]}, {"==": [{"var": "age"}, "30"]}]},
            ],
        }

        q = jsonlogic_to_q(filters)
        self.assertEqual(str(q), "(AND: ('gender__exact', 'F'), (OR: ('age__exact', '20'), ('age__exact', '30')))")

    def test_jsonlogic_to_q_filters_field_valueerror(self) -> None:
        """A ValueError is raised in the case of an unknown operator."""
        filters = {"unknown operator": [{"==": [{"var": "gender"}, "F"]}, {"<": [{"var": "age"}, "25"]}]}
        with self.assertRaises(ValueError):
            jsonlogic_to_q(filters)

    def test_jsonlogic_to_q_filters_all_operators(self) -> None:
        """The following operators are supported: ==, !=, >, >=, <, <=."""
        filters = {
            "and": [
                {"==": [{"var": "var1"}, 1]},
                {"!=": [{"var": "var2"}, 1]},
                {">": [{"var": "var3"}, 1]},
                {">=": [{"var": "var4"}, 1]},
                {"<": [{"var": "var5"}, 1]},
                {"<=": [{"var": "var6"}, 1]},
            ],
        }

        q = jsonlogic_to_q(filters)
        self.assertEqual(
            str(q),
            "(AND: ('var1__exact', 1), (NOT (AND: ('var2__exact', 1))), ('var3__gt', 1), ('var4__gte', 1), ('var5__lt', 1), ('var6__lte', 1))",
        )


class JsonLogicSomeAllStringFieldTests(TestCase):
    def test_some_operator_all_values_present(self):
        filters = {"some": [{"var": "colors"}, {"in": [{"var": ""}, ["red", "blue"]]}]}
        q = instance_jsonlogic_to_q(filters)
        self.assertEqual(str(q), "(AND: ('colors__icontains', 'red'), ('colors__icontains', 'blue'))")

    def test_some_operator_three_values_present(self):
        filters = {"some": [{"var": "colors"}, {"in": [{"var": ""}, ["red", "blue", "green"]]}]}
        q = instance_jsonlogic_to_q(filters)
        self.assertEqual(
            str(q), "(AND: ('colors__icontains', 'red'), ('colors__icontains', 'blue'), ('colors__icontains', 'green'))"
        )

    def test_some_operator_no_match(self):
        filters = {"some": [{"var": "colors"}, {"in": [{"var": ""}, ["yellow", "green"]]}]}
        q = instance_jsonlogic_to_q(filters)
        self.assertEqual(str(q), "(AND: ('colors__icontains', 'yellow'), ('colors__icontains', 'green'))")

    def test_all_operator_exact_match(self):
        filters = {"all": [{"var": "colors"}, {"in": [{"var": ""}, ["red", "blue", "orange"]]}]}
        q = instance_jsonlogic_to_q(filters)
        pattern = r"^blue orange red$"
        self.assertEqual(str(q), f"(AND: ('colors__regex', '{pattern}'))")

    def test_all_operator_extra_value(self):
        filters = {"all": [{"var": "colors"}, {"in": [{"var": ""}, ["red", "blue"]]}]}
        q = instance_jsonlogic_to_q(filters)
        pattern = r"^blue red$"
        self.assertEqual(str(q), f"(AND: ('colors__regex', '{pattern}'))")

    def test_all_operator_single_value(self):
        filters = {"all": [{"var": "colors"}, {"in": [{"var": ""}, ["red"]]}]}
        q = instance_jsonlogic_to_q(filters)
        pattern = r"^red$"
        self.assertEqual(str(q), f"(AND: ('colors__regex', '{pattern}'))")
