from __future__ import annotations

from iaso import models as m
from iaso.mcp.protocol import call_tool
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_ORG_UNITS_PERMISSION
from iaso.test import TestCase


class ListToolFiltersTest(TestCase):
    """The advertised snake_case tool filters reach the API under the names it reads."""

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

        cls.belgium = cls._valid_org_unit("Belgium", cls.country, cls.version)
        cls.antwerp = cls._valid_org_unit("Antwerp", cls.province, cls.version, parent=cls.belgium)
        cls.liege = cls._valid_org_unit("Liège", cls.province, cls.version, parent=cls.belgium)
        cls.france = cls._valid_org_unit("France", cls.country, cls.other_version)

        cls.country_form = m.Form.objects.create(name="Country census")
        cls.country_form.projects.set([cls.project])
        cls.country_form.org_unit_types.set([cls.country])
        cls.province_form = m.Form.objects.create(name="Province survey")
        cls.province_form.projects.set([cls.project])
        cls.province_form.org_unit_types.set([cls.province])
        cls.create_form_instance(form=cls.province_form, project=cls.project, org_unit=cls.antwerp)

        cls.user = cls.create_user_with_profile(
            username="belgium-mcp",
            account=cls.account,
            permissions=[CORE_ORG_UNITS_PERMISSION, CORE_FORMS_PERMISSION],
        )

    @staticmethod
    def _valid_org_unit(name, org_unit_type, version, parent=None):
        return m.OrgUnit.objects.create(
            name=name,
            org_unit_type=org_unit_type,
            version=version,
            parent=parent,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

    def assertListedNames(self, result, key, expected_names):
        listed = sorted(item["name"] for item in result[key])
        self.assertEqual(listed, sorted(expected_names), f"{key} returned {listed}")
        self.assertEqual(result["count"], len(expected_names), f"count does not match listed {key}")

    def test_list_org_units_without_filter_returns_all(self):
        result = call_tool("list_org_units", {"limit": 50}, self.user)
        self.assertListedNames(result, "org_units", ["Antwerp", "Belgium", "France", "Liège"])

    def test_list_org_units_filters_on_org_unit_type_id(self):
        result = call_tool("list_org_units", {"org_unit_type_id": self.province.id, "limit": 50}, self.user)
        self.assertListedNames(result, "org_units", ["Antwerp", "Liège"])

    def test_list_org_units_filters_on_source_id(self):
        result = call_tool("list_org_units", {"source_id": self.other_source.id, "limit": 50}, self.user)
        self.assertListedNames(result, "org_units", ["France"])

    def test_list_org_units_filters_on_parent_id(self):
        result = call_tool("list_org_units", {"parent_id": self.belgium.id, "limit": 50}, self.user)
        self.assertListedNames(result, "org_units", ["Antwerp", "Liège"])

    def test_list_forms_without_filter_returns_all(self):
        result = call_tool("list_forms", {"limit": 50}, self.user)
        self.assertListedNames(result, "forms", ["Country census", "Province survey"])

    def test_list_forms_filters_on_org_unit_type_id(self):
        result = call_tool("list_forms", {"org_unit_type_id": self.country.id, "limit": 50}, self.user)
        self.assertListedNames(result, "forms", ["Country census"])

    def test_list_forms_filters_on_org_unit_id(self):
        result = call_tool("list_forms", {"org_unit_id": self.antwerp.id, "limit": 50}, self.user)
        self.assertListedNames(result, "forms", ["Province survey"])
