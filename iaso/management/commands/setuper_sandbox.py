import subprocess

from datetime import datetime
from logging import getLogger

from django.core.management.base import BaseCommand

from iaso.models import Account, DataSource, Profile, Project


logger = getLogger(__name__)


class Command(BaseCommand):
    help = "Custom command to reset admin sandbox account."

    def add_arguments(self, parser):
        parser.add_argument("account", type=str, help="Account name")

    def change_user_name_and_disable_user(self, profile, new_account_name):
        user_name = profile.user.username.split(".")
        new_user_name = new_account_name
        if len(user_name) > 1:
            new_user_name = f"{new_account_name}.{user_name[1]}"
        profile.user.username = new_user_name
        profile.user.is_active = False
        profile.user.save()
        return profile.user

    def update_users_profiles(self, profiles, new_account_name):
        return list(
            map(
                lambda profile: self.change_user_name_and_disable_user(profile, new_account_name),
                profiles,
            )
        )

    def map_project(self, projects, new_account_name):
        return list(
            map(
                lambda project: self.change_project_app_id(project, new_account_name),
                projects,
            )
        )

    def change_project_app_id(self, project, new_account_name):
        current_project = Project.objects.filter(app_id=project.app_id).first()
        app_id = project.app_id.split(".")
        current_project.app_id = new_account_name
        if len(app_id) > 1:
            current_project.app_id = f"{new_account_name}.{app_id[1]}"
        return current_project

    def map_data_source(self, data_sources, current_timestamp):
        return list(
            map(
                lambda data_source:  self.change_data_source_name(data_source, current_timestamp),
                data_sources,
            )
        )

    def change_data_source_name(self, data_source, current_timestamp):
        data_source.name = f"{data_source.name}{current_timestamp}"
        save = data_source.save()
        return data_source

    def recreate_account(self, account_name):
        try:
            command = ["python3", "setuper/setuper.py", "--additional_projects", "-n", f"{account_name}"]
            process = subprocess.run(command, check=True)
            self.stdout.write(f"Stdout:\n{process.stdout}")
            if process.stderr:
                self.stderr.write(f"Stderr:\n{process.stderr}")
        except subprocess.CalledProcessError as e:
            self.stderr.write(self.style.ERROR(f"Error executing script '{e}':"))
            self.stderr.write(self.style.ERROR(f"Return Code: {e.returncode}"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"An unexpected error occurred: {e}"))

    def handle(self, *args, **options):
        name = options["account"]
        self.stdout.write(self.style.SUCCESS(f" .... Resetting {name} account and its data! ..."))

        current_datetime = int(datetime.now().timestamp())
        new_name = f"{name}{current_datetime}"
        logger.info(f"Renaming current account {name} to {new_name}")
        account = Account.objects.filter(name=name).first()
        if account is not None:
            account.name = new_name
            account.save()
        profiles = Profile.objects.filter(account=account)
        logger.info(f"Renaming and deactivating all {len(profiles)} users belong to account {name}")
        updated_users = self.update_users_profiles(profiles, new_name)
        logger.info(f"Disabled {len(updated_users)} users")

        projects = Project.objects.filter(account=account)
        logger.info(f"Renaming app id for all {len(projects)} projects belong to account {name}")
        projects_to_updated = self.map_project(projects, new_name)
        updated_projects = Project.objects.bulk_update(projects_to_updated, ["app_id"])
        logger.info(f"Renamed app id for all {updated_projects} projects")

        data_sources = DataSource.objects.filter(projects__account=account).distinct()
        logger.info(f"Renaming all {len(data_sources)} data_sources belong to account {name}")
        rename_data_sources = self.map_data_source(data_sources, current_datetime)
        new_data_sources = DataSource.objects.bulk_update(rename_data_sources, ["name"])
        logger.info(f"Renamed all {new_data_sources} data_sources")

        self.stdout.write(self.style.SUCCESS(f"Reset {name} account!"))

        self.recreate_account(name)
