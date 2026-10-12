from django.test import SimpleTestCase

from iaso.dhis2.form_mapping import mapped_question_names
from iaso.models import MappingVersion


class MappedQuestionNamesTests(SimpleTestCase):
    def test_aggregate_mapping(self):
        mapping_json = {
            "question_mappings": {
                "age": {"id": "de1", "valueType": "INTEGER"},
                "full_name": {"id": "de2", "valueType": "TEXT"},
            }
        }
        self.assertEqual(mapped_question_names(mapping_json), {"age", "full_name"})

    def test_multiple_select_exported_as_booleans(self):
        """`<question>__<choice>`: the choice and its question, whose removal drops every choice."""
        mapping_json = {"question_mappings": {"colors__red": {"id": "de1"}, "colors__blue": {"id": "de2"}}}
        self.assertEqual(mapped_question_names(mapping_json), {"colors__red", "colors__blue", "colors"})

    def test_never_mapped_questions_left_out(self):
        mapping_json = {
            "question_mappings": {
                "age": {"id": "de1"},
                "comment": {"type": MappingVersion.QUESTION_MAPPING_NEVER_MAPPED},
                "colors__red": {"type": MappingVersion.QUESTION_MAPPING_NEVER_MAPPED},
            }
        }
        self.assertEqual(mapped_question_names(mapping_json), {"age"})

    def test_event_mapping(self):
        mapping_json = {
            "type": "simple_event",
            "program_id": "program1",
            "question_mappings": {"age": {"id": "de1", "code": "age", "valueType": "INTEGER"}},
        }
        self.assertEqual(mapped_question_names(mapping_json), {"age"})

    def test_event_tracker_mapping(self):
        """A list of data elements / attributes per question, a repeat group being mapped to its own program."""
        mapping_json = {
            "program_id": "program1",
            "tracked_entity_type": "person",
            "question_mappings": {
                "age": [{"programStage": "stage1", "dataElement": {"id": "de1"}}],
                "full_name": [{"trackedEntityAttribute": {"id": "tea1", "name": "Name"}}],
                "children": [{"program_id": "program2", "parent": None}],
                "child_name": [{"trackedEntityAttribute": {"id": "tea2", "name": "Name"}, "parent": "children"}],
            },
        }
        self.assertEqual(mapped_question_names(mapping_json), {"age", "full_name", "children", "child_name"})

    def test_derived_mapping(self):
        """The aggregated question and the ones of its `where` conditions, an aggregation without question skipped."""
        mapping_json = {
            "aggregations": [
                {
                    "id": "average_weight",
                    "questionName": "weight",
                    "aggregationType": "avg",
                    "where": [{"questionName": "sex", "operator": "exact", "value": "F"}],
                },
                {"id": "visits", "questionName": "visit_date", "aggregationType": "count", "where": None},
                {"id": "malformed"},
            ]
        }
        self.assertEqual(mapped_question_names(mapping_json), {"weight", "sex", "visit_date"})

    def test_empty_mapping(self):
        for mapping_json in (None, {}, {"question_mappings": {}}, {"aggregations": []}):
            with self.subTest(mapping_json=mapping_json):
                self.assertEqual(mapped_question_names(mapping_json), set())
