"""A household survey built with pyxform, as an uploaded XLSForm would be, for the submissions API tests."""

import os

from unittest import skipUnless

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from pyxform.builder import create_survey_element_from_dict

from iaso import models as m
from iaso.permissions.core_permissions import CORE_SUBMISSIONS_UPDATE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


URL = "/api/submissions/"
VERSION = "2026110801"

#: pyxform's dict form of an XLSForm
HOUSEHOLD_SURVEY = {
    "type": "survey",
    "name": "data",
    "id_string": "household",
    "title": "Household",
    "version": VERSION,
    "children": [
        # injected from the org unit, as Enketo does (a constant calculate, replaced)
        {"type": "calculate", "name": "current_ou_name", "bind": {"calculate": "''"}},
        {
            "type": "group",
            "name": "household",
            "label": "Household",
            "children": [
                {"type": "text", "name": "head_name", "label": "Head", "bind": {"required": "true()"}},
                {
                    "type": "integer",
                    "name": "population",
                    "label": "Population",
                    "bind": {"constraint": ". >= 0", "jr:constraintMsg": "Population can't be negative"},
                },
            ],
        },
        {"type": "calculate", "name": "double_population", "bind": {"calculate": "${population} * 2"}},
        {
            "type": "text",
            "name": "district_code",
            "label": "District code",
            "bind": {"relevant": "${current_ou_name} = 'Brussels'"},
        },
        {
            "type": "repeat",
            "name": "child",
            "label": "Child",
            "children": [
                {"type": "text", "name": "child_name", "label": "Name", "bind": {"required": "true()"}},
                {
                    "type": "integer",
                    "name": "child_age",
                    "label": "Age",
                    "bind": {"constraint": ". < 5", "jr:constraintMsg": "Under 5 only"},
                },
            ],
        },
        {"type": "calculate", "name": "children_count", "bind": {"calculate": "count(${child})"}},
        {"type": "calculate", "name": "visit_hour", "bind": {"calculate": "format-date-time(now(), '%H')"}},
        # added by pyxform's XLSForm conversion
        {
            "type": "group",
            "name": "meta",
            "control": {"bodyless": True},
            "children": [
                {"type": "calculate", "name": "instanceID", "bind": {"readonly": "true()", "jr:preload": "uid"}}
            ],
        },
    ],
}

requires_odk_cli = skipUnless(
    os.path.exists(settings.ODK_CLI_PATH), f"odk_cli isn't installed at {settings.ODK_CLI_PATH} (ODK_CLI_PATH)"
)


def create_form_version(form: m.Form, survey: dict = HOUSEHOLD_SURVEY) -> m.FormVersion:
    element = create_survey_element_from_dict(survey)
    return m.FormVersion.objects.create(
        form=form,
        version_id=survey["version"],
        file=SimpleUploadedFile(f"{survey['id_string']}.xml", element.to_xml(validate=False).encode()),
        form_descriptor=element.to_json_dict(),
    )


class SubmissionsTestCase(SwaggerTestCaseMixin, APITestCase):
    """Belgium, where `user` edits the household form's submissions, and France, another account."""

    @classmethod
    def setUpTestData(cls):
        cls.account, _, cls.version, cls.project = cls.create_account_datasource_version_project(
            "Belgium source", "Belgium", "Belgium health"
        )
        cls.district = cls.create_org_unit_type("District", [cls.project])
        cls.region = cls.create_org_unit_type("Region", [cls.project])
        cls.flanders = cls.create_valid_org_unit("Flanders", cls.region, cls.version)
        cls.brussels = cls.create_valid_org_unit("Brussels", cls.district, cls.version)
        cls.antwerp = m.OrgUnit.objects.create(
            name="Antwerp", org_unit_type=cls.district, version=cls.version, parent=cls.flanders
        )
        cls.form = m.Form.objects.create(name="Household", period_type="MONTH")
        cls.form.projects.add(cls.project)
        cls.form.org_unit_types.add(cls.district)
        cls.form_version = create_form_version(cls.form)
        cls.user = cls.create_user_with_profile(
            username="belgium_editor", account=cls.account, permissions=[CORE_SUBMISSIONS_UPDATE_PERMISSION]
        )

        cls.france, _, france_version, cls.france_project = cls.create_account_datasource_version_project(
            "France source", "France", "France health"
        )
        france_district = cls.create_org_unit_type("Dept", [cls.france_project])
        cls.paris = cls.create_valid_org_unit("Paris", france_district, france_version)
        cls.france_form = m.Form.objects.create(name="Ménage", period_type="MONTH")
        cls.france_form.projects.add(cls.france_project)
        cls.france_form.org_unit_types.add(france_district)

    def setUp(self):
        super().setUp()
        self.client.force_authenticate(self.user)

    def submission(self, **overrides):
        content = overrides.pop("content", {})
        return {
            "ref": "row-1",
            "form_id": self.form.id,
            "org_unit_id": self.antwerp.id,
            "period": "202611",
            "content": {"head_name": "Alice", "population": 3, **content},
            **overrides,
        }

    def post(self, *submissions, query=""):
        return self.client.post(f"{URL}{query}", {"submissions": list(submissions)}, format="json")
