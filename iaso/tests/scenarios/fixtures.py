"""The scenarios' test data, from examples/; no test here."""

import datetime
import json
import os

from django.core.files.base import ContentFile
from pyxform.builder import create_survey_element_from_dict

from iaso import models as m
from iaso.api.workflows.import_export import import_workflow_real
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.test import TestCase


NOW = datetime.datetime(2026, 10, 8, 8, 30, tzinfo=datetime.timezone.utc)

EXAMPLES = os.path.join(os.path.dirname(__file__), "examples")


class ScenarioExamplesTestCase(TestCase):
    """A small nutrition workflow, from examples/: registration, then anthropometry; oedema sends the child to OTP.

    The forms are their descriptors (`form-<form_id>.json`, made XForms with pyxform as on upload), filled by the app's
    form engine (odk_cli, in the Docker images); the workflow is a workflow export (`workflow-child.json`), loaded with
    the workflow import, as when copying a workflow between servers."""

    @classmethod
    def setUpTestData(cls):
        account = m.Account.objects.create(name="Nutrition")
        project = m.Project.objects.create(name="Nutrition", app_id="nutrition", account=account)
        registration = cls.create_form("child_registration")
        project.forms.add(registration, cls.create_form("anthropometry"), cls.create_form("otp_admission"))
        m.EntityType.objects.create(name="Child", account=account, reference_form=registration)

        with open(os.path.join(EXAMPLES, "workflow-child.json")) as workflow_file:
            workflow = import_workflow_real(json.load(workflow_file), account)
        cls.version = workflow.workflow_versions.get(status=WorkflowVersionsStatus.PUBLISHED)

    @staticmethod
    def create_form(form_id):
        """A form with one version: its descriptor (pyxform JSON) read from examples/form-<form_id>.json, its XForm
        made from it."""
        with open(os.path.join(EXAMPLES, f"form-{form_id}.json")) as descriptor_file:
            descriptor = json.load(descriptor_file)
        xform = create_survey_element_from_dict(descriptor).to_xml(validate=False)
        form = m.Form.objects.create(form_id=descriptor["id_string"], name=descriptor["title"])
        m.FormVersion.objects.create(
            form=form,
            version_id=descriptor["version"],
            form_descriptor=descriptor,
            file=ContentFile(xform.encode("utf-8"), name=f"{form_id}.xml"),
        )
        return form
