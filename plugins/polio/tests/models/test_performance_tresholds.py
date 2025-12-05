from iaso import models as m
from iaso.test import TestCase
from plugins.polio.models.performance_thresholds import PerformanceThresholds


class PerformanceTresholdTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.data_source = m.DataSource.objects.create(name="Data Source")
        cls.source_version = m.SourceVersion.objects.create(data_source=cls.data_source, number=1)
        cls.account = m.Account.objects.create(name="Account", default_version=cls.source_version)
        cls.var = {"var": "value"}
        cls.avg = {"var": "average"}
        cls.rule_avg_correct = {"<": [cls.var, cls.avg]}
        cls.rule_int_correct = {">=": [cls.var, 90]}
        cls.rule_bad_operator = {">>": [cls.var, 90]}
        cls.rule_bad_array = {">": [cls.var, 90, 50]}
        cls.rule_not_array = {">": {"value": 10, "key": "average"}}
        cls.rule_bad_json_arg = {">": [cls.var, {"var": "median"}]}
        cls.rule_bad_var = {">": [{"var": "median"}, cls.avg]}

    def test_json_logic_rule_validation(self):
        self.assertTrue(PerformanceThresholds.is_json_logic_rule(self.rule_avg_correct))
        self.assertTrue(PerformanceThresholds.is_json_logic_rule(self.rule_int_correct))
        self.assertFalse(PerformanceThresholds.is_json_logic_rule(self.rule_bad_operator))
        self.assertFalse(PerformanceThresholds.is_json_logic_rule(self.rule_bad_array))
        self.assertFalse(PerformanceThresholds.is_json_logic_rule(self.rule_not_array))
        self.assertFalse(PerformanceThresholds.is_json_logic_rule(self.rule_bad_json_arg))
        self.assertFalse(PerformanceThresholds.is_json_logic_rule(self.rule_bad_var))

    def test_is_json_logic_expression(self):
        correct_expression_and = {"and": [{">": [self.var, self.avg]}, {"<": [self.var, 95]}]}
        correct_expression_or = {"or": [{">": [self.var, self.avg]}, {"<": [self.var, 95]}]}
        incorrect_rule = {
            "or": [{">": [self.rule_bad_operator]}, {"<": [self.var, 95]}]
        }  # testing only one incorrect child rule since all rules are tested by test_json_logic_rule_validation
        incorrect_operator = {"xor": [{">": [self.var, self.avg]}, {"<": [self.var, 95]}]}
        nested_expression = {"and": [{"and": [{">": [self.var, self.avg]}, {"<": [self.var, 95]}]}]}

        self.assertTrue(PerformanceThresholds.is_json_logic_expression(correct_expression_and))
        self.assertTrue(PerformanceThresholds.is_json_logic_expression(correct_expression_or))
        self.assertFalse(PerformanceThresholds.is_json_logic_expression(incorrect_rule))
        self.assertFalse(PerformanceThresholds.is_json_logic_expression(incorrect_operator))
        self.assertFalse(PerformanceThresholds.is_json_logic_expression(nested_expression))
