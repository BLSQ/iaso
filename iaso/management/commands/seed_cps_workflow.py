"""Seeds a seasonal malaria chemoprevention (CPS/SMC) entity workflow in an account, from `iaso/fixtures/cps/`: a
registration on a QR card, four cycles, their workflow and scenarios (see `_demo_workflow`).

    docker compose run --rm iaso manage seed_cps_workflow --account 1
"""

import os
import uuid

from ._demo_workflow import DemoWorkflow, SeedDemoWorkflowCommand


REGISTRATION_FORM = "Enregistrement CPS 2026"

CPS = DemoWorkflow(
    fixtures=os.path.join("iaso", "fixtures", "cps"),
    project_name="CPS 2026",
    app_id_prefix="cps",
    forms={
        REGISTRATION_FORM: "cps_registration.xlsx",
        "Cycle 1 CPS 2026": "cps_cycle_1.xlsx",
        "Cycle 2 CPS 2026": "cps_cycle_2.xlsx",
        "Cycle 3 CPS 2026": "cps_cycle_3.xlsx",
        "Cycle 4 CPS 2026": "cps_cycle_4.xlsx",
    },
    reference_form=REGISTRATION_FORM,
    entity_type_name="Enfant CPS 2026",
    entity_type_settings={
        "fields_list_view": ["code_menage", "nom_prenoms_enfant"],
        "fields_detail_info_view": ["nom_prenoms_enfant"],
        # the card's QR code: scanned, searched, and a second child with the same card is refused
        "fields_duplicate_search": ["qr_code"],
        "prevent_add_if_duplicate_found": True,
    },
    workflow_file="workflow-cps.json",
    uuid_namespace=uuid.UUID("5d8f6c7e-2f0a-4c55-9b1e-1c2b3a4d5e6f"),
    auto_first_step=True,
)


class Command(SeedDemoWorkflowCommand):
    help = "Seeds the CPS 2026 entity workflow (registration + 4 cycles) in an account"
    demo = CPS
