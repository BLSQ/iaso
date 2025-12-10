import logging
import secrets
import subprocess

from datetime import datetime

from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ImproperlyConfigured

from beanstalk_worker import task_decorator
from iaso.models import Account, DataSource, Profile, Project, Task


logger = logging.getLogger(__name__)


def prepare_account_name_str(name):
    """
    If this task is triggered by a web call (e.g. if you curl your server), the name parameter is passed as a list instead of a str.
    If this task is triggered by code inside IASO, the name parameter is passed as a str.
    """
    if isinstance(name, list):
        return name[0]
    return name


def log_and_progress_task(task: Task, message: str, progress: int):
    logger.info(message)
    task.report_progress_and_stop_if_killed(progress, message, 100)


def reset_account(account: Account, task: Task):
    current_timestamp = int(datetime.now().timestamp())
    old_name = account.name
    new_name = f"{old_name}{current_timestamp}"

    log_and_progress_task(task, f"Renaming current account {old_name} to {new_name}", 5)
    account.name = new_name
    account.save()

    profiles = Profile.objects.filter(account=account)
    log_and_progress_task(
        task, f"Renaming and deactivating all {len(profiles)} users that belong to account {old_name}", 10
    )
    update_user_profiles(profiles, old_name, new_name)
    log_and_progress_task(task, f"Disabled {len(profiles)} users", 30)

    projects = Project.objects.filter(account=account)
    log_and_progress_task(
        task, f"Renaming app_id for all {len(projects)} projects that belong to account {old_name}", 35
    )
    logger.info(f"Renaming app id for all {len(projects)} projects belong to account {old_name}")
    update_projects_app_id(projects, old_name, new_name)
    log_and_progress_task(task, f"Renamed app_id for all {len(projects)} projects", 55)

    data_sources = DataSource.objects.filter(projects__account=account).distinct()
    log_and_progress_task(task, f"Renaming all {len(data_sources)} data_sources that belong to account {old_name}", 60)
    update_data_sources(data_sources, current_timestamp)
    log_and_progress_task(task, f"Renamed all {len(data_sources)} data_sources", 70)

    log_and_progress_task(task, f"Finished reseting {old_name} account!", 70)


def update_user_profiles(profiles, account_name, new_account_name):
    """
    Users in a setuper account have usernames like: "admin", "admin.user01", "admin.user02"...
    """
    for profile in profiles:
        user: User = profile.user
        new_username = user.username.replace(account_name, new_account_name)
        user.username = new_username
        user.is_active = False
        user.save()


def update_projects_app_id(projects, account_name, new_account_name):
    """
    Projects in a setuper account have app_ids like: "project.children", "project.georegistry", "project"...
    """
    for project in projects:
        project.app_id = project.app_id.replace(account_name, new_account_name)
        project.save()


def update_data_sources(data_sources, timestamp):
    for data_source in data_sources:
        data_source.name = f"{data_source.name}{timestamp}"
        data_source.save()


def recreate_account(account_name: str, task: Task):
    log_and_progress_task(task, "Recreating the cron_task_sandbox_user superuser", 75)
    new_password = reset_superuser_password()
    log_and_progress_task(task, "Superuser password reset", 80)
    log_and_progress_task(task, "Launching setuper...", 80)
    success = run_setuper(account_name, new_password)
    if success:
        message = "admin account recreated successfully"
        task.report_success(message)
    else:
        message = "admin account recreation failed"
        task.terminate_with_error(message)
    logger.info(message)


def reset_superuser_password() -> str:
    user = User.objects.filter(username="cron_task_sandbox_user")
    if not user:
        raise ImproperlyConfigured("Can't find the cron_task_sandbox_user user")
    new_password = secrets.token_urlsafe(32)
    superuser = user.first()
    superuser.set_password(new_password)
    superuser.save()
    return new_password


def run_setuper(account_name: str, password: str):
    server_url = f"https://{settings.DNS_DOMAIN}"
    command = [
        "python3",
        "setuper/setuper.py",
        "--additional_projects",
        "-n",
        account_name,
        "-u",
        "cron_task_sandbox_user",
        "-p",
        password,
        "-s",
        server_url,
    ]
    logger.info(f"Executing command: {' '.join(command)}")
    try:
        process = subprocess.run(command, capture_output=True, text=True, check=True)
        logger.info(f"Stdout:\n{process.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        logger.exception(f"Error executing script '{e}':")
        logger.exception(f"Return Code: {e.returncode}")
        logger.exception(f"Stderr:\n{e.stderr}")
        return False
    except Exception as e:
        logger.exception(f"An unexpected error occurred: {e}")
        return False


@task_decorator(task_name="setuper_sandbox")
def setuper_sandbox(name="admin", task=Task):
    if settings.ENABLE_SETUPER_SANDBOX:
        account_name = prepare_account_name_str(name)
        log_and_progress_task(task, f" .... trying to reset account {name} account and its data! ...", 0)
        account = Account.objects.filter(name__exact=account_name).first()
        if account is not None:
            reset_account(account, task)
        else:
            message = f"Account {account_name} does not exist. Simply calling the setuper."
            logger.warning(message)
            task.report_progress_and_stop_if_killed(progress_value=50, progress_message=message, end_value=100)

        recreate_account(account_name, task)
    else:
        logger.info("No setuper sandbox task")
