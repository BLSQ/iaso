from plugins.polio.tasks.api.refresh_lqas_im_data import LQAS_CONFIG_SLUG, LQAS_TASK_NAME, RefreshLQASIMDataViewset


class RefreshLQASDataViewset(RefreshLQASIMDataViewset):
    task_name = LQAS_TASK_NAME
    config_slug = LQAS_CONFIG_SLUG
