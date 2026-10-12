"""The scenarios' test data, from examples/; no test here."""

import datetime
import json
import os
import uuid

from dataclasses import dataclass

from django.core.files.base import ContentFile
from pyxform.builder import create_survey_element_from_dict

from iaso import models as m
from iaso.api.workflows.import_export import import_workflow_real
from iaso.models.workflow import WorkflowVersionsStatus
from iaso.scenarios.forms import FormSource
from iaso.test import TestCase


NOW = datetime.datetime(2026, 10, 8, 8, 30, tzinfo=datetime.timezone.utc)

EXAMPLES = os.path.join(os.path.dirname(__file__), "examples")


@dataclass
class NutritionSetup:
    account: m.Account
    project: m.Project
    entity_type: m.EntityType
    version: m.WorkflowVersion


def create_form(form_id: str) -> m.Form:
    """A form with one version: its descriptor (pyxform JSON) read from examples/form-<form_id>.json, its XForm made
    from it."""
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
    # as on upload: the questions the web interface knows (follow-up conditions, mappings...)
    form.update_possible_fields()
    form.save()
    return form


def create_nutrition_setup(account_name: str) -> NutritionSetup:
    """A small nutrition workflow, from examples/: registration, then anthropometry; oedema sends the child to OTP.

    The forms are their descriptors (`form-<form_id>.json`, made XForms with pyxform as on upload), filled by the app's
    form engine (odk_cli, in the Docker images); the workflow is a workflow export (`workflow-child.json`), loaded with
    the workflow import, as when copying a workflow between servers. Each call creates its own forms: two accounts
    have forms with the same `form_id`."""
    account = m.Account.objects.create(name=account_name)
    project = m.Project.objects.create(
        name=f"Nutrition {account_name}", app_id=f"nutrition.{account_name}", account=account
    )
    registration = create_form("child_registration")
    project.forms.add(registration, create_form("anthropometry"), create_form("otp_admission"))
    entity_type = m.EntityType.objects.create(name="Child", account=account, reference_form=registration)

    with open(os.path.join(EXAMPLES, "workflow-child.json")) as workflow_file:
        workflow_data = json.load(workflow_file)
    # the import finds workflows and versions by uuid on the whole server: one copy per account
    workflow_data["uuid"] = str(uuid.uuid4())
    for version_data in workflow_data["versions"]:
        version_data["uuid"] = str(uuid.uuid4())
    workflow = import_workflow_real(workflow_data, account)
    version = workflow.workflow_versions.get(status=WorkflowVersionsStatus.PUBLISHED)
    return NutritionSetup(account, project, entity_type, version)


def read_example(name: str) -> str:
    with open(os.path.join(EXAMPLES, name)) as example:
        return example.read()


# examples, by file name
PASSING = "scenario-oedema_leads_to_otp.json"
FAILING = "failing/scenario-oedema_forgotten.json"
FORM = "scenario-form-child_registration.json"


def example(file_name: str, **changes) -> dict:
    return {**json.loads(read_example(file_name)), **changes}


def create_scenario(setup: NutritionSetup, file_name: str, **changes) -> m.Scenario:
    definition = example(file_name, **changes)
    return m.Scenario.objects.create(
        account=setup.account,
        kind=definition["kind"],
        entity_type=setup.entity_type if definition["kind"] == m.ScenarioKind.ENTITY else None,
        name=definition["name"],
        description=definition.get("description", ""),
        definition=definition,
    )


class ScenarioExamplesTestCase(TestCase):
    """The nutrition workflow of examples/, in account Belgium."""

    @classmethod
    def setUpTestData(cls):
        cls.setup = create_nutrition_setup("Belgium")
        cls.project = cls.setup.project
        cls.version = cls.setup.version

    def form_source(self) -> FormSource:
        return FormSource(self.setup.account)
