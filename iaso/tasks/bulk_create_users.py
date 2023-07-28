from beanstalk_worker import task_decorator
from iaso.bulk_create_users.import_users_from_csv import bulk_create_users
from iaso.models import Task


@task_decorator(task_name="bulk_create_users")
def bulk_create_users_task(task: Task, user=None, user_id=None, file_id=None, launch_task=None):
    """Background Task to bulk create users from a CSV file"""
    task.report_progress_and_stop_if_killed(progress_message="Importing")

    total = bulk_create_users(user=user, user_id=user_id, file_id=file_id, launch_task=launch_task, task=task)

    task.report_success(message=f"Created {total} Users.")
