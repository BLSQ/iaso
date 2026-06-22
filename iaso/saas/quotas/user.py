from iaso.models import Profile
from iaso.saas.constants import USER_QUOTA, USER_QUOTA_LABEL
from plugins.saas.models.account_usage import PeriodTypeChoices
from plugins.saas.registry import account_usage_registry


def compute_quota_value(account):
    return Profile.objects.filter(account=account).count()


account_usage_registry.register(
    name=USER_QUOTA,
    label=USER_QUOTA_LABEL,
    period_type=PeriodTypeChoices.ALL_TIME,
    compute_quota_value=compute_quota_value,
)
