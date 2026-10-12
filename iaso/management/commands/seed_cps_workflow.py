"""Seeds a seasonal malaria chemoprevention (CPS/SMC) entity workflow in an account, to try the scenario tester on a
real-sized workflow: a registration form, four cycle forms, their workflow and scenarios, from `iaso/fixtures/cps/`.

    docker compose run --rm iaso manage seed_cps_workflow --account 1

Idempotent: forms, versions, entity type, workflow and scenarios are found by name / version / uuid and reused.
"""

import glob
import json
import os
import uuid

from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from iaso.api.workflows.import_export import import_workflow_real
from iaso.models import Account, EntityType, Form, FormVersion, Project, Scenario, ScenarioKind, Workflow
from iaso.odk import parsing
from iaso.scenarios.schema import load_scenario


FIXTURES = os.path.join("iaso", "fixtures", "cps")
PROJECT_NAME = "CPS 2026"
REGISTRATION_FORM = "Enregistrement CPS 2026"
FORMS = {
    REGISTRATION_FORM: "cps_registration.xlsx",
    "Cycle 1 CPS 2026": "cps_cycle_1.xlsx",
    "Cycle 2 CPS 2026": "cps_cycle_2.xlsx",
    "Cycle 3 CPS 2026": "cps_cycle_3.xlsx",
    "Cycle 4 CPS 2026": "cps_cycle_4.xlsx",
}
# the workflow and version uuids are unique on the whole server: one per account
UUID_NAMESPACE = uuid.UUID("5d8f6c7e-2f0a-4c55-9b1e-1c2b3a4d5e6f")


class Command(BaseCommand):
    help = "Seeds the CPS 2026 entity workflow (registration + 4 cycles) in an account"

    def add_arguments(self, parser):
        parser.add_argument("--account", type=int, required=True, help="Account id")

    @transaction.atomic
    def handle(self, *args, **options):
        account = Account.objects.filter(id=options["account"]).first()
        if account is None:
            raise CommandError(f"No account {options['account']}")

        project, _ = Project.objects.get_or_create(
            account=account, name=PROJECT_NAME, defaults={"app_id": f"cps.{account.id}"}
        )
        forms = {name: self._seed_form(project, name, file_name) for name, file_name in FORMS.items()}

        entity_type, _ = EntityType.objects.update_or_create(
            account=account,
            name="Enfant CPS 2026",
            defaults={
                "reference_form": forms[REGISTRATION_FORM],
                "is_active": True,
                "fields_list_view": ["code_menage", "nom_prenoms_enfant"],
                "fields_detail_info_view": ["nom_prenoms_enfant"],
                # the card's QR code: scanned, searched, and a second child with the same card is refused
                "fields_duplicate_search": ["qr_code"],
                "prevent_add_if_duplicate_found": True,
            },
        )

        with open(os.path.join(FIXTURES, "workflow-cps.json")) as workflow_file:
            workflow_data = json.load(workflow_file)
        workflow_data["uuid"] = str(uuid.uuid5(UUID_NAMESPACE, f"workflow-{account.id}"))
        for version_data in workflow_data["versions"]:
            version_data["uuid"] = str(uuid.uuid5(UUID_NAMESPACE, f"version-{account.id}-{version_data['name']}"))
        # an entity type has one workflow: reuse the one already there (made in the web interface...)
        existing = Workflow.objects.filter(entity_type=entity_type).first()
        if existing:
            workflow_data["uuid"] = str(existing.uuid)
        workflow = import_workflow_real(workflow_data, account)
        # not in the export format
        workflow.workflow_versions.filter(uuid__in=[v["uuid"] for v in workflow_data["versions"]]).update(
            auto_first_step=True
        )

        scenarios = [
            self._seed_scenario(entity_type, path) for path in sorted(glob.glob(f"{FIXTURES}/scenario-*.json"))
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
        with open(os.path.join(FIXTURES, file_name), "rb") as xls_file:
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
