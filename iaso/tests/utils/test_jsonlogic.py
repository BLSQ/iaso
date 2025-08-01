from django.db.models import Q

from iaso.models.metric import MetricValue
from iaso.test import TestCase
from iaso.utils.jsonlogic import instance_jsonlogic_to_q, jsonlogic_to_exists_q_clauses, jsonlogic_to_q


class JsonLogicTests(TestCase):
    def setUp(self):
        self.id_field_name = "metric_type_id"
        self.group_by_field_name = "org_unit_id"

    def test_jsonlogic_to_exists_q_clauses__simple(self) -> None:
        """Test a simple JsonLogic query to ensure it returns a Q object."""
        filters = {"==": [{"var": 22}, 1]}
        expectedQuerySet = (
            'SELECT "iaso_metricvalue"."id", "iaso_metricvalue"."metric_type_id", "iaso_metricvalue"."org_unit_id", '
            '"iaso_metricvalue"."year", "iaso_metricvalue"."value", "iaso_metricvalue"."string_value" '
            'FROM "iaso_metricvalue" '
            "WHERE EXISTS("
            'SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 22 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" = 1.0) LIMIT 1)'
        )
        q = jsonlogic_to_exists_q_clauses(filters, MetricValue.objects, self.id_field_name, self.group_by_field_name)

        querySet = MetricValue.objects.filter(q)
        self.assertEqual(str(querySet.query), expectedQuerySet)

    def test_jsonlogic_to_exists_q_clauses__simple_string_value(self) -> None:
        """Test a simple JsonLogic query to ensure it returns a Q object."""
        filters = {"==": [{"var": 22}, "coucou"]}
        expectedQuerySet = (
            'SELECT "iaso_metricvalue"."id", "iaso_metricvalue"."metric_type_id", "iaso_metricvalue"."org_unit_id", '
            '"iaso_metricvalue"."year", "iaso_metricvalue"."value", "iaso_metricvalue"."string_value" '
            'FROM "iaso_metricvalue" '
            "WHERE EXISTS("
            'SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 22 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."string_value" = coucou) LIMIT 1)'
        )
        q = jsonlogic_to_exists_q_clauses(filters, MetricValue.objects, self.id_field_name, self.group_by_field_name)

        querySet = MetricValue.objects.filter(q)
        self.assertEqual(str(querySet.query), expectedQuerySet)

    def test_jsonlogic_to_exists_q_clauses__simple_and(self) -> None:
        filters = {"and": [{">=": [{"var": "23"}, 900]}, {"==": [{"var": "22"}, 700]}]}
        expectedQuerySet = (
            'SELECT "iaso_metricvalue"."id", "iaso_metricvalue"."metric_type_id", "iaso_metricvalue"."org_unit_id", '
            '"iaso_metricvalue"."year", "iaso_metricvalue"."value", "iaso_metricvalue"."string_value" '
            'FROM "iaso_metricvalue" '
            "WHERE ("
            'EXISTS(SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 23 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" >= 900.0) LIMIT 1) '
            "AND "
            'EXISTS(SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 22 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" = 700.0) LIMIT 1)'
            ")"
        )
        q = jsonlogic_to_exists_q_clauses(filters, MetricValue.objects, "metric_type_id", "org_unit_id")
        querySet = MetricValue.objects.filter(q)
        self.assertEqual(str(querySet.query), expectedQuerySet)

    def test_jsonlogic_to_exists_q_clauses__simple_or(self) -> None:
        filters = {"or": [{">=": [{"var": "23"}, 900]}, {"==": [{"var": "22"}, 700]}]}
        expectedQuerySet = (
            'SELECT "iaso_metricvalue"."id", "iaso_metricvalue"."metric_type_id", "iaso_metricvalue"."org_unit_id", '
            '"iaso_metricvalue"."year", "iaso_metricvalue"."value", "iaso_metricvalue"."string_value" '
            'FROM "iaso_metricvalue" '
            "WHERE ("
            'EXISTS(SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 23 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" >= 900.0) LIMIT 1) '
            "OR "
            'EXISTS(SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 22 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" = 700.0) LIMIT 1)'
            ")"
        )
        q = jsonlogic_to_exists_q_clauses(filters, MetricValue.objects, "metric_type_id", "org_unit_id")
        self.assertIsInstance(q, Q)
        querySet = MetricValue.objects.filter(q)
        self.assertEqual(str(querySet.query), expectedQuerySet)

    def test_jsonlogic_to_exists_q_clauses__complex(self) -> None:
        filters = {
            "or": [
                {">=": [{"var": "23"}, 900]},
                {"==": [{"var": "22"}, 700]},
                {"and": [{"<=": [{"var": "23"}, 1500]}, {"==": [{"var": "24"}, 1000]}]},
            ]
        }
        expectedQuerySet = (
            'SELECT "iaso_metricvalue"."id", "iaso_metricvalue"."metric_type_id", '
            '"iaso_metricvalue"."org_unit_id", "iaso_metricvalue"."year", "iaso_metricvalue"."value", "iaso_metricvalue"."string_value" '
            'FROM "iaso_metricvalue" '
            "WHERE ("
            'EXISTS(SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 23 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" >= 900.0) LIMIT 1) '
            "OR "
            'EXISTS(SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 22 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" = 700.0) LIMIT 1) '
            "OR ("
            'EXISTS(SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 23 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" <= 1500.0) LIMIT 1) '
            "AND "
            'EXISTS(SELECT 1 AS "a" FROM "iaso_metricvalue" U0 WHERE (U0."metric_type_id" = 24 AND U0."org_unit_id" = ("iaso_metricvalue"."org_unit_id") AND U0."value" = 1000.0) LIMIT 1)'
            ")"
            ")"
        )
        q = jsonlogic_to_exists_q_clauses(filters, MetricValue.objects, "metric_type_id", "org_unit_id")
        querySet = MetricValue.objects.filter(q)
        self.assertEqual(str(querySet.query), expectedQuerySet)

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
