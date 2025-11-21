import logging
import subprocess

from datetime import datetime

from beanstalk_worker import task_decorator
from iaso.models import Account, DataSource, Profile, Project


logger = logging.getLogger(__name__)


def change_user_name_and_disable_user(profile, new_account_name):
    user_name = profile.user.username.split(".")
    new_user_name = new_account_name
    if len(user_name) > 1:
        new_user_name = f"{new_account_name}.{user_name[1]}"
    profile.user.username = new_user_name
    profile.user.is_active = False
    profile.user.save()
    return profile.user


def update_users_profiles(profiles, new_account_name):
    return list(
        map(
            lambda profile: change_user_name_and_disable_user(profile, new_account_name),
            profiles,
        )
    )


def map_project(projects, new_account_name):
    return list(
        map(
            lambda project: change_project_app_id(project, new_account_name),
            projects,
        )
    )


def change_project_app_id(project, new_account_name):
    current_project = Project.objects.filter(app_id=project.app_id).first()
    app_id = project.app_id.split(".")
    current_project.app_id = new_account_name
    if len(app_id) > 1:
        current_project.app_id = f"{new_account_name}.{app_id[1]}"
    return current_project


def map_data_source(data_sources, current_timestamp):
    return list(
        map(
            lambda data_source: change_data_source_name(data_source, current_timestamp),
            data_sources,
        )
    )


def change_data_source_name(data_source, current_timestamp):
    data_source.name = f"{data_source.name}{current_timestamp}"
    data_source.save()
    return data_source


def recreate_account(account_name):
    try:
        command = ["python3", "setuper/setuper.py", "--additional_projects", "-n", account_name]
        process = subprocess.run(command, capture_output=True, text=True)
        logger.info(f"Stdout:\n{process.stdout}")
        if process.stderr:
            logger.error(f"Stderr:\n{process.stderr}")
    except subprocess.CalledProcessError as e:
        logger.exception(f"Error executing script '{e}':")
        logger.exception(f"Return Code: {e.returncode}")
    except Exception as e:
        logger.exception(f"An unexpected error occurred: {e}")


@task_decorator(task_name="setuper_sandbox")
def setuper_sandbox(name, task=None):
    logger.warning(f" .... Resetting {name} account and its data! ...")
    current_datetime = int(datetime.now().timestamp())
    account_name = name
    if isinstance(name, list):
        account_name = name[0]
    new_name = f"{account_name}{current_datetime}"
    logger.info(f"Renaming current account {account_name} to {new_name}")
    account = Account.objects.filter(name=account_name).first()
    if account is not None:
        account.name = new_name
        account.save()
    profiles = Profile.objects.filter(account=account)
    logger.info(f"Renaming and deactivating all {len(profiles)} users belong to account {account_name}")
    updated_users = update_users_profiles(profiles, new_name)
    logger.info(f"Disabled {len(updated_users)} users")

    projects = Project.objects.filter(account=account)
    logger.info(f"Renaming app id for all {len(projects)} projects belong to account {account_name}")
    projects_to_updated = map_project(projects, new_name)
    updated_projects = Project.objects.bulk_update(projects_to_updated, ["app_id"])
    logger.info(f"Renamed app id for all {updated_projects} projects")

    data_sources = DataSource.objects.filter(projects__account=account).distinct()
    logger.info(f"Renaming all {len(data_sources)} data_sources belong to account {account_name}")
    rename_data_sources = map_data_source(data_sources, current_datetime)
    logger.info(f"Renamed all {len(rename_data_sources)} data_sources")

    logger.warning(f"Reset {account_name} account!")

    recreate_account(account_name)
