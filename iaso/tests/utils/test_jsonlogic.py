from iaso.test import TestCase
from iaso.utils.jsonlogic import jsonlogic_to_q, keyvalue_jsonlogic_to_q


class JsonLogicTests(TestCase):
    def test_keyvalut_jsonlogic_to_q__simple_and(self) -> None:
        filters = { "and": [{">=":[ {"var":"23"}, 900]}, {"==":[{"var":"22"}, 700]}]}
        q, annotations, annotationFilters = keyvalue_jsonlogic_to_q(filters, "metric_type", "value", "org_unit_id")
        self.assertEqual(str(q), "(OR: (AND: ('metric_type__exact', '23'), ('value__gte', 900)), (AND: ('metric_type__exact', '22'), ('value__exact', 700)))")
        
        annotationKey = "23__gte__900"
        self.assertIn(annotationKey, annotations.keys())
        firstConditionCases = annotations[annotationKey].cases
        firstConditionCase = firstConditionCases[0]
        self.assertEqual(str(firstConditionCase.condition), "(AND: ('metric_type__exact', '23'), ('value__gte', 900))")
        self.assertEqual(str(firstConditionCase.result), "Value(True)")

        annotationKey = "22__exact__700"
        self.assertIn(annotationKey, annotations.keys())
        firstConditionCases = annotations[annotationKey].cases
        firstConditionCase = firstConditionCases[0]
        self.assertEqual(str(firstConditionCase.condition), "(AND: ('metric_type__exact', '22'), ('value__exact', 700))")
        self.assertEqual(str(firstConditionCase.result), "Value(True)")


        self.assertNotIn("or", annotationFilters.keys())
        self.assertIn("and", annotationFilters.keys())

        andAnnotationFilters = annotationFilters["and"]
        self.assertEqual(2, len(andAnnotationFilters))
        expectedAnnotationFilters = [
            "(AND: {'23__gte__900': True})",
            "(AND: {'22__exact__700': True})"
        ]
        for query in andAnnotationFilters:
            self.assertIn(str(query), expectedAnnotationFilters)

    def test_keyvalut_jsonlogic_to_q__simple_or(self) -> None:
        filters = { "or": [{">=":[ {"var":"23"}, 900]}, {"==":[{"var":"22"}, 700]}]}
        q, annotations, annotationFilters = keyvalue_jsonlogic_to_q(filters, "metric_type", "value", "org_unit_id")
        self.assertEqual(str(q), "(OR: (AND: ('metric_type__exact', '23'), ('value__gte', 900)), (AND: ('metric_type__exact', '22'), ('value__exact', 700)))")
        
        annotationKey = "23__gte__900"
        self.assertIn(annotationKey, annotations.keys())
        firstConditionCases = annotations[annotationKey].cases
        firstConditionCase = firstConditionCases[0]
        self.assertEqual(str(firstConditionCase.condition), "(AND: ('metric_type__exact', '23'), ('value__gte', 900))")
        self.assertEqual(str(firstConditionCase.result), "Value(True)")

        annotationKey = "22__exact__700"
        self.assertIn(annotationKey, annotations.keys())
        firstConditionCases = annotations[annotationKey].cases
        firstConditionCase = firstConditionCases[0]
        self.assertEqual(str(firstConditionCase.condition), "(AND: ('metric_type__exact', '22'), ('value__exact', 700))")
        self.assertEqual(str(firstConditionCase.result), "Value(True)")


        self.assertIn("or", annotationFilters.keys())
        self.assertNotIn("and", annotationFilters.keys())

        andAnnotationFilters = annotationFilters["or"]
        self.assertEqual(2, len(andAnnotationFilters))
        expectedAnnotationFilters = [
            "(AND: {'23__gte__900': True})",
            "(AND: {'22__exact__700': True})"
        ]
        for query in andAnnotationFilters:
            self.assertIn(str(query), expectedAnnotationFilters)


    def test_keyvalut_jsonlogic_to_q__simple_and_or(self) -> None:
        filters = { 
            "or":[
                {">=":[{"var":"23"},900]},
                {"==":[{"var":"22"},700]},
                {"and":[
                    {"<=":[{"var":"23"},1500]},
                    {"==":[{"var":"24"},1000]}
                ]}
            ]
                  
        }
        q, annotations, annotationFilters = keyvalue_jsonlogic_to_q(filters, "metric_type", "value", "org_unit_id")
        
        self.assertEqual(str(q), (""
        "(OR: "
            "(AND: ('metric_type__exact', '23'), ('value__gte', 900)), "
            "(AND: ('metric_type__exact', '22'), ('value__exact', 700)), "
            "(AND: ('metric_type__exact', '23'), ('value__lte', 1500)), "
            "(AND: ('metric_type__exact', '24'), ('value__exact', 1000))"
        ")"))
        
        annotationKey = "23__gte__900"
        self.assertIn(annotationKey, annotations.keys())
        firstConditionCases = annotations[annotationKey].cases
        firstConditionCase = firstConditionCases[0]
        self.assertEqual(str(firstConditionCase.condition), "(AND: ('metric_type__exact', '23'), ('value__gte', 900))")
        self.assertEqual(str(firstConditionCase.result), "Value(True)")

        annotationKey = "23__lte__1500"
        self.assertIn(annotationKey, annotations.keys())
        firstConditionCases = annotations[annotationKey].cases
        firstConditionCase = firstConditionCases[0]
        self.assertEqual(str(firstConditionCase.condition), "(AND: ('metric_type__exact', '23'), ('value__lte', 1500))")
        self.assertEqual(str(firstConditionCase.result), "Value(True)")

        annotationKey = "24__exact__1000"
        self.assertIn(annotationKey, annotations.keys())
        firstConditionCases = annotations[annotationKey].cases
        firstConditionCase = firstConditionCases[0]
        self.assertEqual(str(firstConditionCase.condition), "(AND: ('metric_type__exact', '24'), ('value__exact', 1000))")
        self.assertEqual(str(firstConditionCase.result), "Value(True)")


        self.assertIn("or", annotationFilters.keys())
        self.assertNotIn("and", annotationFilters.keys())

        print(annotationFilters)

        orAnnotationFilters = annotationFilters["or"]
        self.assertEqual(3, len(orAnnotationFilters))
        expectedAnnotationFilters = [
            "(AND: {'23__gte__900': True})",
            "(AND: {'22__exact__700': True})"
        ]

        andSubAnnotationFilters = []
        for query in orAnnotationFilters:
            if (type(query) is dict):
                self.assertTrue('and' in query)
                andSubAnnotationFilters = query['and']
                continue
            self.assertIn(str(query), expectedAnnotationFilters)

        print(andSubAnnotationFilters)

        expectedSubAnnotationFilters = [
            "(AND: {'23__lte__1500': True})",
            "(AND: {'24__exact__1000': True})"
        ]

        for query in andSubAnnotationFilters:
            self.assertIn(str(query), expectedSubAnnotationFilters)

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
