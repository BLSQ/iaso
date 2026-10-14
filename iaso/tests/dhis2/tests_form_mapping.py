from iaso import models as m
from iaso.dhis2.form_mapping import copy_mappings_from_previous_version
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
