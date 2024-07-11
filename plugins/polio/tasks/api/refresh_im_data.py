from plugins.polio.tasks.api.refresh_lqas_im_data import IM_CONFIG_SLUG, IM_TASK_NAME, RefreshLQASIMDataViewset


class RefreshIMDataViewset(RefreshLQASIMDataViewset):
    task_name = IM_TASK_NAME
    config_slug = IM_CONFIG_SLUG
