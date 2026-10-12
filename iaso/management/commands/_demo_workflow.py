"""Seeds a demo entity workflow in an account, from a fixture folder: its forms (XLSForms), entity type, workflow (a
workflow export) and scenarios (`scenario-*.json`) - to try the scenario tester on a real-sized workflow. Each demo
is a `DemoWorkflow`, its command a `SeedDemoWorkflowCommand` (`seed_cps_workflow`, `seed_milda_workflow`).

Idempotent: forms, versions, entity type, workflow and scenarios are found by name / version / uuid and reused.
"""

import glob
import json
import os
import uuid

from dataclasses import dataclass, field
from typing import Any, Dict

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from iaso.api.workflows.import_export import import_workflow_real
from iaso.models import Account, EntityType, Form, FormVersion, Project, Scenario, ScenarioKind, Workflow
from iaso.odk import parsing
from iaso.scenarios.schema import load_scenario


@dataclass(frozen=True)
class DemoWorkflow:
    fixtures: str
    project_name: str
    # the project's app_id: `<app_id_prefix>.<account id>`
    app_id_prefix: str
    # form name -> its XLSForm in `fixtures`; the reference form among them
    forms: Dict[str, str]
    reference_form: str
    entity_type_name: str
    workflow_file: str
    # the workflow and version uuids are unique on the whole server: one per account, from this namespace
    uuid_namespace: uuid.UUID
    entity_type_settings: Dict[str, Any] = field(default_factory=dict)
    auto_first_step: bool = False


class SeedDemoWorkflowCommand(BaseCommand):
    demo: DemoWorkflow

    def add_arguments(self, parser):
        parser.add_argument("--account", type=int, required=True, help="Account id")

    @transaction.atomic
    def handle(self, *args, **options):
        demo = self.demo
        account = Account.objects.filter(id=options["account"]).first()
        if account is None:
            raise CommandError(f"No account {options['account']}")

        project, _ = Project.objects.get_or_create(
            account=account, name=demo.project_name, defaults={"app_id": f"{demo.app_id_prefix}.{account.id}"}
        )
        forms = {name: self._seed_form(project, name, file_name) for name, file_name in demo.forms.items()}

        entity_type, _ = EntityType.objects.update_or_create(
            account=account,
            name=demo.entity_type_name,
            defaults={"reference_form": forms[demo.reference_form], "is_active": True, **demo.entity_type_settings},
        )

        with open(os.path.join(demo.fixtures, demo.workflow_file)) as workflow_file:
            workflow_data = json.load(workflow_file)
        workflow_data["uuid"] = str(uuid.uuid5(demo.uuid_namespace, f"workflow-{account.id}"))
        for version_data in workflow_data["versions"]:
            version_data["uuid"] = str(uuid.uuid5(demo.uuid_namespace, f"version-{account.id}-{version_data['name']}"))
        # an entity type has one workflow: reuse the one already there (made in the web interface...)
        existing = Workflow.objects.filter(entity_type=entity_type).first()
        if existing:
            workflow_data["uuid"] = str(existing.uuid)
        workflow = import_workflow_real(workflow_data, account)
        # not in the export format
        workflow.workflow_versions.filter(uuid__in=[v["uuid"] for v in workflow_data["versions"]]).update(
            auto_first_step=demo.auto_first_step
        )

        scenarios = [
            self._seed_scenario(entity_type, path)
            for path in sorted(glob.glob(os.path.join(demo.fixtures, "scenario-*.json")))
        ]

        if options["verbosity"] > 0:
            self.stdout.write(
                f"Project {project.id} ({project.app_id}), entity type {entity_type.id}, workflow {workflow.id}"
            )
            for name, form in forms.items():
                self.stdout.write(f"  form {form.id} {name} ({form.form_id})")
            for scenario in scenarios:
                self.stdout.write(f"  scenario {scenario.id} {scenario.name}")

    def _seed_form(self, project: Project, name: str, file_name: str) -> Form:
        with open(os.path.join(self.demo.fixtures, file_name), "rb") as xls_file:
            survey = parsing.parse_xls_form(xls_file)
            form = Form.objects.filter(projects=project, name=name).first()
            if form is None:
                form = Form.objects.create(name=name, form_id=survey.form_id)
                form.projects.add(project)
            if not FormVersion.objects.filter(form=form, version_id=survey.version).exists():
                xls_file.seek(0)
                FormVersion.objects.create_for_form_and_survey(form=form, survey=survey, xls_file=File(xls_file))
        return form

    def _seed_scenario(self, entity_type: EntityType, path: str) -> Scenario:
        with open(path) as scenario_file:
            text = scenario_file.read()
        scenario_file_data = load_scenario(text)  # a fixture that doesn't fit the schema fails here
        scenario, _ = Scenario.objects.update_or_create(
            account=entity_type.account,
            kind=ScenarioKind.ENTITY,
            entity_type=entity_type,
            name=scenario_file_data.name,
            defaults={"description": scenario_file_data.description, "definition": json.loads(text)},
        )
        return scenario
