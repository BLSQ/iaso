from iaso.models import Project
from plugins.saas.models.account_usage import PeriodTypeChoices
from plugins.saas.registry import account_usage_registry

from ..constants import PROJECT_QUOTA, PROJECT_QUOTA_LABEL


def compute_quota_value(account):
    return Project.objects.filter(account=account).count()


account_usage_registry.register(
    name=PROJECT_QUOTA,
    label=PROJECT_QUOTA_LABEL,
    period_type=PeriodTypeChoices.ALL_TIME,
    compute_quota_value=compute_quota_value,
)
