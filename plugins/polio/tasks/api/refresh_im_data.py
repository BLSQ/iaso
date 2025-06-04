from plugins.polio.tasks.api.refresh_lqas_im_data import IM_TASK_NAME, RefreshLQASIMDataViewset


IM_HH_CONFIG_SLUG = "im_hh-pipeline-config"
IM_OHH_CONFIG_SLUG = "im_ohh-pipeline-config"
IM_HH_OHH_CONFIG_SLUG = "im_hh_ohh-pipeline-config"


class RefreshIMHouseholdDataViewset(RefreshLQASIMDataViewset):
    task_name = IM_TASK_NAME
    config_slug = IM_HH_CONFIG_SLUG


class RefreshIMOutOfHouseholdDataViewset(RefreshLQASIMDataViewset):
    task_name = IM_TASK_NAME
    config_slug = IM_OHH_CONFIG_SLUG


class RefreshIMAllDataViewset(RefreshLQASIMDataViewset):
    task_name = IM_TASK_NAME
    config_slug = IM_HH_OHH_CONFIG_SLUG
