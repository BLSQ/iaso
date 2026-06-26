from django.db import transaction

from iaso.models import ValidationWorkflow, ValidationWorkflowVersion


class ValidationWorkflowService:
    @staticmethod
    @transaction.atomic
    def create(*, user, account, name, version="1.0.0", description="", deleted_at=None):
        vf = ValidationWorkflow.objects.create(
            name=name, description=description, account=account, deleted_at=deleted_at
        )

        ValidationWorkflowVersion.objects.create(
            main_workflow=vf,
            version=version,
            version_major=1,
            version_minor=0,
            version_patch=0,
            created_by=user,
            updated_by=user,
        )

        return vf
