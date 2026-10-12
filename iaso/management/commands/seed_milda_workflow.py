"""Seeds a MILDA (long-lasting insecticidal nets) distribution campaign in an account, from `iaso/fixtures/milda/`:
households registered with their reference health centre (the app's org unit picker) and the MILDA scanned on the
spot; while some remain, the household gets them at its health centre, scanned too (see `_demo_workflow`).

    docker compose run --rm iaso manage seed_milda_workflow --account 1
"""

import os
import uuid

from ._demo_workflow import DemoWorkflow, SeedDemoWorkflowCommand


REGISTRATION_FORM = "Enregistrement ménage MILDA"

MILDA = DemoWorkflow(
    fixtures=os.path.join("iaso", "fixtures", "milda"),
    project_name="Campagne MILDA 2026",
    app_id_prefix="milda",
    forms={
        REGISTRATION_FORM: "milda_registration.xlsx",
        "Remise MILDA au centre de santé": "milda_remise_cs.xlsx",
    },
    reference_form=REGISTRATION_FORM,
    entity_type_name="Ménage MILDA",
    entity_type_settings={
        "fields_list_view": ["nom_chef", "cs_name"],
        "fields_detail_info_view": ["nom_chef", "nb_couchages", "milda_restantes__int__"],
    },
    workflow_file="workflow-milda.json",
    uuid_namespace=uuid.UUID("8a1e2c34-6b7d-4f90-a1b2-c3d4e5f6a7b8"),
)


class Command(SeedDemoWorkflowCommand):
    help = "Seeds the MILDA 2026 campaign (household registration, MILDA handed out at the health centre)"
    demo = MILDA
