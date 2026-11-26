from __future__ import annotations

from django.utils import timezone

from iaso import models as m
from iaso.mcp.protocol import call_tool
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_ORG_UNITS_PERMISSION
from iaso.test import TestCase


class ListToolTestCase(TestCase):
    """Calls the MCP list tools through `call_tool`, so the advertised filters go through the real API."""

    @classmethod
    def setUpTestData(cls):
        cls.account, cls.source, cls.version, cls.project = cls.create_account_datasource_version_project(
            "Belgium source", "Belgium", "Belgium project"
        )
        cls.other_source = m.DataSource.objects.create(name="France source")
        cls.other_source.projects.set([cls.project])
        cls.other_version = m.SourceVersion.objects.create(data_source=cls.other_source, number=1)

        cls.country = cls.create_org_unit_type("Country", [cls.project])
        cls.province = cls.create_org_unit_type("Province", [cls.project])

        cls.belgium = cls._org_unit("Belgium", cls.country, cls.version)
        cls.antwerp = cls._org_unit("Antwerp", cls.province, cls.version, parent=cls.belgium)
        cls.liege = cls._org_unit("Liège", cls.province, cls.version, parent=cls.belgium)
        cls.ghent = cls._org_unit(
            "Ghent", cls.province, cls.version, parent=cls.belgium, validation_status=m.OrgUnit.VALIDATION_NEW
        )
        cls.france = cls._org_unit("France", cls.country, cls.other_version)

        cls.country_form = cls._form("Country census", cls.country)
        cls.province_form = cls._form("Province survey", cls.province)

        cls.user = cls.create_user_with_profile(
            username="belgium-mcp",
            account=cls.account,
            permissions=[CORE_ORG_UNITS_PERMISSION, CORE_FORMS_PERMISSION],
        )

    @staticmethod
    def _org_unit(name, org_unit_type, version, parent=None, validation_status=m.OrgUnit.VALIDATION_VALID):
        return m.OrgUnit.objects.create(
            name=name,
            org_unit_type=org_unit_type,
            version=version,
            parent=parent,
            validation_status=validation_status,
        )

    @classmethod
    def _form(cls, name, org_unit_type):
        form = m.Form.objects.create(name=name)
        form.projects.set([cls.project])
        form.org_unit_types.set([org_unit_type])
        return form

    def call(self, tool_name, **arguments):
        return call_tool(tool_name, {"limit": 50, **arguments}, self.user)

    def assertListed(self, result, key, field, expected):
        listed = sorted(item[field] for item in result[key])
        self.assertEqual(listed, sorted(expected), f"{key} {field} returned {listed}")
        self.assertEqual(result["count"], len(expected), f"count does not match the listed {key}")


class ListOrgUnitsToolTest(ListToolTestCase):
    def assertOrgUnits(self, result, expected_names):
        self.assertListed(result, "org_units", "name", expected_names)

    def test_defaults_to_valid_org_units(self):
        self.assertOrgUnits(self.call("list_org_units"), ["Antwerp", "Belgium", "France", "Liège"])

    def test_filters_on_validation_status(self):
        self.assertOrgUnits(self.call("list_org_units", validation_status="NEW"), ["Ghent"])

    def test_validation_status_all(self):
        result = self.call("list_org_units", validation_status="all")
        self.assertOrgUnits(result, ["Antwerp", "Belgium", "France", "Ghent", "Liège"])

    def test_filters_on_search(self):
        self.assertOrgUnits(self.call("list_org_units", search="antw"), ["Antwerp"])

    def test_filters_on_org_unit_type_id(self):
        self.assertOrgUnits(self.call("list_org_units", org_unit_type_id=self.province.id), ["Antwerp", "Liège"])

    def test_filters_on_source_id(self):
        self.assertOrgUnits(self.call("list_org_units", source_id=self.other_source.id), ["France"])

    def test_filters_on_parent_id(self):
        self.assertOrgUnits(self.call("list_org_units", parent_id=self.belgium.id), ["Antwerp", "Liège"])


class ListFormsToolTest(ListToolTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.create_form_instance(form=cls.province_form, project=cls.project, org_unit=cls.antwerp)

    def assertForms(self, result, expected_names):
        self.assertListed(result, "forms", "name", expected_names)

    def test_without_filter_returns_all(self):
        self.assertForms(self.call("list_forms"), ["Country census", "Province survey"])

    def test_filters_on_search(self):
        self.assertForms(self.call("list_forms", search="census"), ["Country census"])

    def test_filters_on_org_unit_type_id(self):
        self.assertForms(self.call("list_forms", org_unit_type_id=self.country.id), ["Country census"])

    def test_filters_on_org_unit_id(self):
        self.assertForms(self.call("list_forms", org_unit_id=self.antwerp.id), ["Province survey"])


class ListFormVersionsToolTest(ListToolTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.census_version = m.FormVersion.objects.create(form=cls.country_form, version_id="2026-01")
        cls.survey_version = m.FormVersion.objects.create(form=cls.province_form, version_id="2026-02")
        m.MappingVersion.objects.create(form_version=cls.census_version, name="census mapping", json={})

    def assertVersions(self, result, expected_versions):
        expected_ids = [version.id for version in expected_versions]
        self.assertListed(result, "form_versions", "id", expected_ids)

    def test_without_filter_returns_all(self):
        self.assertVersions(self.call("list_form_versions"), [self.census_version, self.survey_version])

    def test_filters_on_form_id(self):
        self.assertVersions(self.call("list_form_versions", form_id=self.province_form.id), [self.survey_version])

    def test_filters_on_search_name(self):
        self.assertVersions(self.call("list_form_versions", search_name="census"), [self.census_version])

    def test_filters_on_mapped(self):
        self.assertVersions(self.call("list_form_versions", mapped=True), [self.census_version])

    def test_filters_on_not_mapped(self):
        self.assertVersions(self.call("list_form_versions", mapped=False), [self.survey_version])


class SubmissionsToolTestCase(ListToolTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.antwerp_survey = cls.create_form_instance(form=cls.province_form, project=cls.project, org_unit=cls.antwerp)
        cls.ghent_survey = cls.create_form_instance(form=cls.province_form, project=cls.project, org_unit=cls.ghent)
        cls.belgium_census = cls.create_form_instance(
            form=cls.country_form, project=cls.project, org_unit=cls.belgium, last_export_success_at=timezone.now()
        )
        cls.deleted_liege_survey = cls.create_form_instance(
            form=cls.province_form, project=cls.project, org_unit=cls.liege, deleted=True
        )


class ListInstancesToolTest(SubmissionsToolTestCase):
    def assertInstances(self, result, expected_instances):
        self.assertListed(result, "instances", "id", [instance.id for instance in expected_instances])

    def test_without_filter_returns_non_deleted(self):
        result = self.call("list_instances")
        self.assertInstances(result, [self.antwerp_survey, self.ghent_survey, self.belgium_census])

    def test_filters_on_org_unit_id(self):
        self.assertInstances(self.call("list_instances", org_unit_id=self.antwerp.id), [self.antwerp_survey])

    def test_filters_on_form_id(self):
        self.assertInstances(self.call("list_instances", form_id=self.country_form.id), [self.belgium_census])

    def test_filters_on_org_unit_status(self):
        self.assertInstances(self.call("list_instances", org_unit_status="NEW"), [self.ghent_survey])

    def test_filters_on_status(self):
        self.assertInstances(self.call("list_instances", status="EXPORTED"), [self.belgium_census])

    def test_filters_on_search(self):
        self.assertInstances(self.call("list_instances", search="ghent"), [self.ghent_survey])

    def test_show_deleted_returns_deleted_only(self):
        self.assertInstances(self.call("list_instances", show_deleted=True), [self.deleted_liege_survey])

    def test_show_deleted_false_hides_deleted(self):
        result = self.call("list_instances", show_deleted=False)
        self.assertInstances(result, [self.antwerp_survey, self.ghent_survey, self.belgium_census])


class InstanceFilesToolTest(SubmissionsToolTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        for instance, file_name in [
            (cls.antwerp_survey, "photo.jpg"),
            (cls.antwerp_survey, "report.pdf"),
            (cls.belgium_census, "video.mp4"),
        ]:
            m.InstanceFile.objects.create(instance=instance, file=file_name, name=file_name)

    def assertFiles(self, result, expected_names):
        self.assertListed(result, "instance_files", "name", expected_names)

    def test_without_filter_returns_all_files(self):
        self.assertFiles(self.call("list_instance_files"), ["photo.jpg", "report.pdf", "video.mp4"])

    def test_filters_on_form_id(self):
        result = self.call("list_instance_files", form_id=self.province_form.id)
        self.assertFiles(result, ["photo.jpg", "report.pdf"])

    def test_filters_on_org_unit_id(self):
        self.assertFiles(self.call("list_instance_files", org_unit_id=self.belgium.id), ["video.mp4"])

    def test_filters_on_search(self):
        self.assertFiles(self.call("list_instance_files", search="belgium"), ["video.mp4"])

    def test_filters_on_image_only(self):
        self.assertFiles(self.call("list_instance_files", image_only=True), ["photo.jpg"])

    def test_filters_on_video_only(self):
        self.assertFiles(self.call("list_instance_files", video_only=True), ["video.mp4"])

    def test_filters_on_document_only(self):
        self.assertFiles(self.call("list_instance_files", document_only=True), ["report.pdf"])

    def test_count_filters_on_org_unit_id(self):
        result = call_tool("count_instance_files", {"org_unit_id": self.antwerp.id}, self.user)
        self.assertEqual(result, {"count": 1})

    def test_count_filters_on_form_id(self):
        result = call_tool("count_instance_files", {"form_id": self.province_form.id}, self.user)
        self.assertEqual(result, {"count": 2})
