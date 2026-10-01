from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.template.response import TemplateResponse
from django.urls import path

from iaso.models import Account, PerfStat
from iaso.perf_stats.dashboard import Dashboard, format_ms
from iaso.perf_stats.histogram import percentile


class AccountIdFilter(admin.SimpleListFilter):
    # `account_id` is a plain column (the table may be in another database), so no automatic related filter.
    title = "account"
    parameter_name = "account_id"

    def lookups(self, request, model_admin):
        return [
            (str(account_id), name) for account_id, name in Account.objects.order_by("name").values_list("id", "name")
        ]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(account_id=self.value())
        return queryset


@admin.register(PerfStat)
class PerfStatAdmin(admin.ModelAdmin):
    list_display = (
        "hour",
        "kind",
        "name",
        "variant",
        "outcome",
        "account",
        "count",
        "total",
        "avg_ms",
        "p50",
        "p95",
        "max",
    )
    list_filter = ("kind", AccountIdFilter, "outcome", "variant", "hour")
    search_fields = ("name",)
    date_hierarchy = "hour"
    # Total time first: a moderately slow endpoint called a lot costs more than a rare slow one.
    ordering = ("-hour", "-sum_ms")
    change_list_template = "admin/iaso/perfstat/change_list.html"

    def get_urls(self):
        return [
            path(
                "dashboard/",
                self.admin_site.admin_view(self.dashboard_view),
                name="iaso_perfstat_dashboard",
            ),
        ] + super().get_urls()

    def dashboard_view(self, request):
        if not self.has_view_permission(request):
            raise PermissionDenied
        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "title": "Performance",
            **Dashboard(request.GET).context(),
        }
        return TemplateResponse(request, "admin/iaso/perfstat/dashboard.html", context)

    def changelist_view(self, request, extra_context=None):
        # One query for the names of the accounts of the page (can't join: may be another database).
        self._account_names = dict(Account.objects.values_list("id", "name"))
        return super().changelist_view(request, extra_context)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    @admin.display(description="account", ordering="account_id")
    def account(self, stat):
        if stat.account_id is None:
            return "-"
        return getattr(self, "_account_names", {}).get(stat.account_id, f"#{stat.account_id}")

    @admin.display(description="total", ordering="sum_ms")
    def total(self, stat):
        return format_ms(stat.sum_ms)

    @admin.display(description="avg")
    def avg_ms(self, stat):
        return format_ms(stat.sum_ms / stat.count if stat.count else None)

    @admin.display(description="p50")
    def p50(self, stat):
        return format_ms(percentile(stat.buckets, 0.5, stat.max_ms))

    @admin.display(description="p95")
    def p95(self, stat):
        return format_ms(percentile(stat.buckets, 0.95, stat.max_ms))

    @admin.display(description="max", ordering="max_ms")
    def max(self, stat):
        return format_ms(stat.max_ms)
