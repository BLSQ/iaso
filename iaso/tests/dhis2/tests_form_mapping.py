from django.test import SimpleTestCase

from iaso import models as m
from iaso.dhis2.form_mapping import copy_mappings_from_previous_version, mapped_question_names
from iaso.models import MappingVersion
from iaso.test import TestCase


DESCRIPTOR = {
    "name": "data",
    "type": "survey",
    "children": [
        {"name": "weight", "type": "decimal"},
        {
            "name": "household",
            "type": "repeat",
            "children": [{"name": "age", "type": "integer"}],
        },
        {
            "name": "symptoms",
            "type": "select all that apply",
            "children": [{"name": "fever"}, {"name": "cough"}],
        },
        {"name": "sex", "type": "select one", "children": [{"name": "male"}]},
    ],
}


class CopyMappingsFromPreviousVersionTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="account")
        cls.data_source = m.DataSource.objects.create(name="dhis2")
        cls.form = m.Form.objects.create(name="form")
        project = m.Project.objects.create(name="project", app_id="app", account=account)
        project.forms.add(cls.form)

    def test_keeps_mappings_of_questions_still_in_the_new_version(self):
        previous = m.FormVersion.objects.create(form=self.form, version_id="1", form_descriptor=DESCRIPTOR)
        new_descriptor = {
            **DESCRIPTOR,
            # "weight" and the "cough" choice were removed
            "children": [
                DESCRIPTOR["children"][1],
                {**DESCRIPTOR["children"][2], "children": [{"name": "fever"}]},
                DESCRIPTOR["children"][3],
            ],
        }
        new = m.FormVersion.objects.create(form=self.form, version_id="2", form_descriptor=new_descriptor)
        mapping = m.Mapping.objects.create(form=self.form, data_source=self.data_source, mapping_type=m.EVENT_TRACKER)
        repeat_mapping = [{"type": "repeat", "program_id": "p1", "relationship_type": "r1"}]
        age_mapping = [{"dataElement": {"id": "de_age"}, "programStage": "s1", "parent": "household"}]
        m.MappingVersion.objects.create(
            mapping=mapping,
            form_version=previous,
            json={
                "question_mappings": {
                    "weight": {"id": "de_weight", "valueType": "NUMBER"},
                    "household": repeat_mapping,
                    "age": age_mapping,
                    "symptoms__fever": {"id": "de_fever", "valueType": "BOOLEAN"},
                    "symptoms__cough": {"id": "de_cough", "valueType": "BOOLEAN"},
                    "sex__male": {"id": "de_male", "valueType": "BOOLEAN"},
                }
            },
        )

        copy_mappings_from_previous_version(new, previous)

        self.assertEqual(
            new.mapping_versions.get().json["question_mappings"],
            {
                "household": repeat_mapping,
                # inside the repeat group
                "age": age_mapping,
                "symptoms__fever": {"id": "de_fever", "valueType": "BOOLEAN"},
                # choice keys are kept for any question with choices, as before
                "sex__male": {"id": "de_male", "valueType": "BOOLEAN"},
            },
        )


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
