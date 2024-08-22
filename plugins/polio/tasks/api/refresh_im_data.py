from plugins.polio.tasks.api.refresh_lqas_im_data import IM_TASK_NAME, RefreshLQASIMDataViewset
from django.shortcuts import get_object_or_404
from iaso.models.json_config import Config
import logging
from iaso.models.base import ERRORED, RUNNING, SKIPPED
from gql.transport.requests import RequestsHTTPTransport
from gql import Client, gql

logger = logging.getLogger(__name__)

IM_HH_CONFIG_SLUG = "im_hh-pipeline-config"
IM_OHH_CONFIG_SLUG = "im_ohh-pipeline-config"
IM_HH_OHH_CONFIG_SLUG = "im_hh_ohh-pipeline-config"


# deprecated
class RefreshIMDataViewset(RefreshLQASIMDataViewset):
    task_name = IM_TASK_NAME
    config_slug = IM_HH_CONFIG_SLUG


class RefreshIMHouseholdDataViewset(RefreshLQASIMDataViewset):
    task_name = IM_TASK_NAME
    config_slug = IM_HH_CONFIG_SLUG


class RefreshIMOutOfHouseholdDataViewset(RefreshLQASIMDataViewset):
    task_name = IM_TASK_NAME
    config_slug = IM_OHH_CONFIG_SLUG


class RefreshIMAllDataViewset(RefreshLQASIMDataViewset):
    task_name = IM_TASK_NAME
    config_slug = IM_HH_OHH_CONFIG_SLUG
