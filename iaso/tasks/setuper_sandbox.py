import logging
import subprocess

from datetime import datetime

from django.conf import settings
from django.db.models import Q

from beanstalk_worker import task_decorator
from iaso.models import Account, DataSource, Profile, Project, Task


logger = logging.getLogger(__name__)


def update_users_profiles(profiles, account_name, new_account_name):
    for profile in profiles:
        new_user_name = profile.user.username.replace(account_name, new_account_name)
        profile.user.username = new_user_name
        profile.user.is_active = False
        profile.user.save()
    return profiles


def change_projects_app_id(projects, account_name, new_account_name):
    for project in projects:
        project.app_id = project.app_id.replace(account_name, new_account_name)
        project.save()
    return projects


def recreate_account(account_name):
    command = ["python3", "setuper/setuper.py", "--additional_projects", "-n", account_name]
    logger.info(f"Executing command: {' '.join(command)}")
    try:
        process = subprocess.run(command, capture_output=True, text=True)
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
        logger.warning(f" .... Resetting {name} account and its data! ...")
        current_timestamp = int(datetime.now().timestamp())
        account_name = name
        if isinstance(name, list):
            account_name = name[0]
        new_name = f"{account_name}{current_timestamp}"
        logger.info(f"Renaming current account {account_name} to {new_name}")
        account = Account.objects.filter(name=account_name).first()
        if account is not None:
            account.name = new_name
            account.save()

        profiles = Profile.objects.filter(Q(account=account) | Q(user__username=account_name))
        logger.info(f"Renaming and deactivating all {len(profiles)} users belong to account {account_name}")

        updated_users = update_users_profiles(profiles, account_name, new_name)
        logger.info(f"Disabled {len(updated_users)} users")

        projects = Project.objects.filter(account=account)
        logger.info(f"Renaming app id for all {len(projects)} projects belong to account {account_name}")
        projects_to_updated = change_projects_app_id(projects, account_name, new_name)
        updated_projects = Project.objects.bulk_update(projects_to_updated, ["app_id"])
        logger.info(f"Renamed app id for all {updated_projects} projects")

        data_sources = DataSource.objects.filter(projects__account=account).distinct()
        logger.info(f"Renaming all {len(data_sources)} data_sources belong to account {account_name}")
        for data_source in data_sources:
            data_source.name = f"{data_source.name}{current_timestamp}"
            data_source.save()
        logger.info(f"Renamed all {len(data_sources)} data_sources")

        logger.info(f"Reset {account_name} account!")
        result = recreate_account(account_name)
        message = f"Sandbox {account_name} account"
        if result:
            task.report_success(f"{message} created")
        else:
            task.terminate_with_error(f"{message} task failed")
    else:
        logger.info("No setuper sandbox task")
