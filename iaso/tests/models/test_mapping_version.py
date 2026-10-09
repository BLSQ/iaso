from iaso import models as m
from iaso.test import TestCase


class MappingVersionQuerySetTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Belgium")
        cls.other_account = m.Account.objects.create(name="France")
        cls.project_1 = m.Project.objects.create(
            name="Belgium health 1", app_id="belgium.health.1", account=cls.account
        )
        cls.project_2 = m.Project.objects.create(
            name="Belgium health 2", app_id="belgium.health.2", account=cls.account
        )
        cls.other_project = m.Project.objects.create(
            name="France health", app_id="france.health", account=cls.other_account
        )
        cls.user = cls.create_user_with_profile(username="belgium_user", account=cls.account)
        cls.data_source = m.DataSource.objects.create(name="DHIS2")

    def create_mapping_version(self, form_name):
        form = m.Form.objects.create(name=form_name)
        form_version = m.FormVersion.objects.create(form=form, version_id="1")
        mapping = m.Mapping.objects.create(form=form, data_source=self.data_source, mapping_type=m.AGGREGATE)
        mapping_version = m.MappingVersion.objects.create(
            mapping=mapping, form_version=form_version, name="aggregate", json={"question_mappings": {}}
        )
        return form, mapping_version

    def test_filter_for_user_no_duplicates_when_form_in_several_projects(self):
        form, mapping_version = self.create_mapping_version("Shared form")
        form.projects.set([self.project_1, self.project_2])

        result = m.MappingVersion.objects.filter_for_user(self.user)

        self.assertQuerySetEqual(result, [mapping_version])

    def test_filter_for_user_excludes_forms_of_other_accounts(self):
        form, _ = self.create_mapping_version("Other account form")
        form.projects.set([self.other_project])

        result = m.MappingVersion.objects.filter_for_user(self.user)

        self.assertQuerySetEqual(result, [])

    def test_filter_for_user_excludes_forms_without_project(self):
        self.create_mapping_version("Orphan form")

        result = m.MappingVersion.objects.filter_for_user(self.user)

        self.assertQuerySetEqual(result, [])
