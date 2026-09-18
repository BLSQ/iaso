from django.core.management import call_command

from beanstalk_worker import task_decorator
from iaso.models import Task
from iaso.plugins import is_saas_plugin_active
from iaso.saas.constants import DISK_SPACE_QUOTA


@task_decorator(task_name="sync_disk_space_usage")
def sync_disk_space_usage(task=Task):
    if is_saas_plugin_active():
        call_command("sync_account_usage", "-m", DISK_SPACE_QUOTA)
