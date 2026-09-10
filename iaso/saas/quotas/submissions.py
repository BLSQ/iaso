from django.db.models import F

from iaso.models import Instance
from plugins.saas.models.account_usage import PeriodTypeChoices
from plugins.saas.registry import account_usage_registry

from ..constants import SUBMISSION_QUOTA, SUBMISSION_QUOTA_LABEL


def compute_quota_value(account, period_start_at, period_ends_at, create, delete, update=False):
    if update:
        if create:
            return F("usage") + 1
        return F("usage")
    return Instance.objects.filter(
        project__account=account, created_at__gte=period_start_at, created_at__lt=period_ends_at
    ).count()


account_usage_registry.register(
    name=SUBMISSION_QUOTA,
    label=SUBMISSION_QUOTA_LABEL,
    period_type=PeriodTypeChoices.MONTH,
    compute_quota_value=compute_quota_value,
)
