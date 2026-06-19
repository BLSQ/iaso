from iaso.api.common import ModelSerializer
from iaso.models import AccountUsage


class AccountUsageListSerializer(ModelSerializer):
    class Meta:
        model = AccountUsage
        fields = ["id", "metric", "period_starts_at", "period_ends_at", "period_type", "usage"]
