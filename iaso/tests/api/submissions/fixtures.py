"""A household survey built with pyxform, as an uploaded XLSForm would be, for the submissions API tests."""

import os

from unittest import skipUnless

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from pyxform.builder import create_survey_element_from_dict

from iaso import models as m


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
