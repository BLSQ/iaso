import tempfile

from django.utils.timezone import now

from beanstalk_worker import task_decorator
from iaso.gpkg.import_gpkg import import_gpkg_file2
from iaso.models import Task
from iaso.models.import_gpkg import ImportGPKG


@task_decorator(task_name="import_gpkg_task")
def import_gpkg_task(import_gpkg_id: int, task: Task):
    """Background Task to bulk update org units."""
    task.report_progress_and_stop_if_killed(progress_message="Importing")

    user = task.launcher
    ig = ImportGPKG.objects.get(id=import_gpkg_id)

    with tempfile.NamedTemporaryFile(suffix=".gpkg") as tmp_file:
        # write the content to a temporary local file that we can read
        tmp_file.write(ig.file.read())
        tmp_file.flush()
        path = tmp_file.name
        total = import_gpkg_file2(
            path,
            project=ig.project,
            source=ig.data_source,
            version_number=ig.version_number,
            validation_status="NEW",
            user=user,
            description=ig.description,
        )

        task.report_success(message=f"Imported {total} OrgUnits")
