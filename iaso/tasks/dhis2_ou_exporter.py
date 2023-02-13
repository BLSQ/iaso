import sys

from beanstalk_worker import task_decorator
from iaso.diffing import Differ, Exporter
from iaso.management.commands.command_logger import CommandLogger
from iaso.models import Task, ExternalCredentials, SourceVersion
from iaso.tasks.dhis2_ou_importer import get_api


def get_api_from_credential(credentials: ExternalCredentials):
    if credentials and credentials.is_valid:
        return get_api(
            {
                "dhis2_url": credentials.url,
                "dhis2_password": credentials.password,
                "dhis2_user": credentials.login,
            }
        )


@task_decorator(task_name="dhis2_ou_exporter")
def dhis2_ou_exporter(
    ref_version_id,
    version_id,
    ignore_groups,
    show_deleted_org_units,
    validation_status,
    ref_validation_status,
    top_org_unit_id,
    top_org_unit_ref_id,
    org_unit_types_ids,
    org_unit_types_ref_ids,
    field_names,
    task: Task,
):
    task.report_progress_and_stop_if_killed(progress_message="Computing differences")
    iaso_logger = CommandLogger(sys.stdout)
    source_version = SourceVersion.objects.get(pk=version_id)
    ref_source_version = SourceVersion.objects.get(pk=ref_version_id)
    diffs, fields = Differ(iaso_logger).diff(
        ref_source_version,
        source_version,
        ignore_groups,
        show_deleted_org_units,
        validation_status,
        ref_validation_status,
        top_org_unit_id,
        top_org_unit_ref_id,
        org_unit_types_ids,
        org_unit_types_ref_ids,
        field_names,
    )
    task.report_progress_and_stop_if_killed(progress_message=f"Starting to export: {len(diffs)}")

    # TODO: investigate type error on next line
    api = get_api_from_credential(source_version.data_source.credentials)  # type: ignore
    if not api:
        raise ValueError("No credentials exist for this source, please provide them")

    Exporter(iaso_logger).export_to_dhis2(api, diffs, fields, task)
    task.report_success(message="Export Done")
