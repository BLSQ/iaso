import humanize

from django.contrib import admin

from iaso.models import AccountUsage
from iaso.models.account_usage import MetricTypeChoices


@admin.register(AccountUsage)
class AccountUsageAdmin(admin.ModelAdmin):
    list_display = ("metric", "account", "period_starts_at", "period_ends_at", "period_type", "get_usage")
    list_filter = ("metric", "period_type")
    search_fields = ["account__name"]

    def get_usage(self, obj):
        if obj.metric == MetricTypeChoices.DISK_SPACE:
            return humanize.naturalsize(obj.usage)
        return obj.usage
