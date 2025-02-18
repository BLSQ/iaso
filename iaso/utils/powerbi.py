import requests
import time
from django.http import Http404
from django.shortcuts import get_object_or_404
from datetime import datetime
from iaso.api.tasks.views import ExternalTaskModelViewSet
from iaso.models.base import RUNNING, SUCCESS, Task
from django.contrib.auth.models import User


SP_AUTH_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/token"
POWERBI_RESOURCE = "https://analysis.windows.net/powerbi/api"
GRANT_TYPE = "client_credentials"


def get_powerbi_service_principal_token(tenant_id, client_id, secret_value):
    body = {
        "grant_type": GRANT_TYPE,
        "resource": POWERBI_RESOURCE,
        "client_id": client_id,
        "client_secret": secret_value,
    }
    r = requests.post(url=SP_AUTH_URL.format(tenant_id=tenant_id), data=body)
    r.raise_for_status()
    access_token = r.json()["access_token"]
    return access_token


def get_powerbi_report_token_with_sp(sp_access_token, group_id, report_id):
    body = {"accessLevel": "View"}
    url = "https://api.powerbi.com/v1.0/myorg/groups/%s/reports/%s/GenerateToken" % (group_id, report_id)
    headers = {"Content-Type": "application/json", "Authorization": "Bearer %s" % sp_access_token}
    r = requests.post(url=url, json=body, headers=headers)
    r.raise_for_status()
    report_token = r.json()["token"]
    return report_token


def get_powerbi_report_token(group_id, report_id):
    # FIXME : import is not extra but will do till we move this model
    from iaso.models.json_config import Config

    conf = get_object_or_404(Config, slug="powerbi_sp")
    config = conf.content

    sp_access_token = get_powerbi_service_principal_token(
        config["tenant_id"], config["client_id"], config["secret_value"]
    )
    return get_powerbi_report_token_with_sp(sp_access_token, group_id, report_id)


def get_openhexa_config_for_data_set_id(data_set_id):
    from iaso.models.json_config import Config

    dataset_config = None
    oh_conf = Config.objects.filter(slug="openhexa_powerbi")
    if oh_conf.exists():
        oh_conf = oh_conf.first()
        oh_config = oh_conf.content
        dataset_config = oh_config[data_set_id]
    return dataset_config


def launch_external_task(dataset_config):
    user_id = dataset_config["user_id"]
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise Http404(f"No user found for id {user_id}")
    task = Task.objects.create(
        created_by=user,
        launcher=user,
        account=user.iaso_profile.account,
        name=dataset_config["task_name"],
        status=RUNNING,
        external=True,
        started_at=datetime.now(),
        should_be_killed=False,
    )
    status = ExternalTaskModelViewSet.launch_task(slug=dataset_config["config"], task_id=task.pk)
    task.status = status
    task.save()
    return task


def monitor_task_and_raise_if_fail(dataset_config, task):
    expected_run_time = dataset_config["expected_run_time"] if dataset_config["expected_run_time"] else 60
    additional_timeout = dataset_config["additional_timeout"] if dataset_config["additional_timeout"] else 30
    max_attempts = dataset_config["timeout_count"] if dataset_config["timeout_count"] else 2
    attempts = 0
    while task.status == RUNNING and attempts < max_attempts:
        if attempts == 0:
            time.sleep(expected_run_time)
        else:
            time.sleep(additional_timeout)
        task.refresh_from_db()
        attempts += 1
    if task.status != SUCCESS:
        raise Http404(f'{dataset_config["task_name"]} failed with status {task.status}')


def launch_dataset_refresh(group_id, data_set_id):
    # FIXME : import is not extra but will do till we move this model
    from iaso.models.json_config import Config

    conf = get_object_or_404(Config, slug="powerbi_sp")
    config = conf.content
    dataset_config = get_openhexa_config_for_data_set_id(data_set_id)

    if dataset_config:
        task = launch_external_task(dataset_config)
        monitor_task_and_raise_if_fail(dataset_config, task)

    sp_access_token = get_powerbi_service_principal_token(
        config["tenant_id"], config["client_id"], config["secret_value"]
    )
    body = {"accessLevel": "View"}
    url = "https://api.powerbi.com/v1.0/myorg/groups/%s/datasets/%s/refreshes" % (group_id, data_set_id)
    headers = {"Content-Type": "application/json", "Authorization": "Bearer %s" % sp_access_token}

    r = requests.post(url=url, json=body, headers=headers)
    r.raise_for_status()
