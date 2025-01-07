from django.db import transaction

from beanstalk_worker import task_decorator

from iaso.models import DataSourceVersionsSynchronization, Task


@task_decorator(task_name="create_json_diff_task")
def create_json_diff_async(data_source_versions_synchronization_id: int, task: Task):
    task.report_progress_and_stop_if_killed(progress_message="Creating JSON diff…")

    user = task.launcher

    data_source_versions_synchronization = DataSourceVersionsSynchronization.objects.get(
        id=data_source_versions_synchronization_id,
        account=user.iaso_profile.account,
    )

    with transaction.atomic():
        data_source_versions_synchronization.create_json_diff()
        data_source_versions_synchronization.json_diff_task = task
        data_source_versions_synchronization.save()

    task.report_success(message="Created JSON diff.")


@task_decorator(task_name="synchronize_source_versions_task")
def synchronize_source_versions_async(data_source_versions_synchronization_id: int, task: Task):
    task.report_progress_and_stop_if_killed(progress_message="Synchronizing source versions…")

    user = task.launcher

    data_source_versions_synchronization = DataSourceVersionsSynchronization.objects.get(
        id=data_source_versions_synchronization_id,
        account=user.iaso_profile.account,
    )

    with transaction.atomic():
        data_source_versions_synchronization.synchronize_source_versions()
        data_source_versions_synchronization.sync_task = task
        data_source_versions_synchronization.save()

    task.report_success(message="Synchronized source versions.")
