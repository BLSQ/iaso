from django.contrib import admin

from iaso.models import MetricType, MetricValue


@admin.register(MetricType)
class MetricTypeAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "account",
        "category",
        "name",
        "source",
        "units",
        "created_at",
        "updated_at",
    )
    search_fields = ("name", "description", "source", "units", "comments")
    list_filter = ("account", "source")
    ordering = ("account", "category", "name")
    readonly_fields = ("account",)


@admin.register(MetricValue)
class MetricValueAdmin(admin.ModelAdmin):
    raw_id_fields = ("org_unit",)
    list_display = ("account", "metric_type", "org_unit", "year", "value")
    search_fields = ("metric_type__name", "org_unit__name")
    list_filter = ("metric_type__account", "metric_type", "year")
    readonly_fields = ("metric_type", "org_unit")

    def account(self, metric_value):
        return metric_value.metric_type.account

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("metric_type__account", "org_unit")
