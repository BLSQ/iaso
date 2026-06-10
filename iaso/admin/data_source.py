from django import forms
from django.contrib.gis import admin
from django.contrib.postgres.fields import ArrayField

from iaso.admin.utils import ArrayFieldMultipleChoiceField, admin_attr_decorator
from iaso.models import DataSource, DataSourceVersionsSynchronization, SourceVersion


@admin.register(DataSourceVersionsSynchronization)
class DataSourceVersionsSynchronizationAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "name",
        "account",
        "created_by",
        "count_create",
        "count_update",
    )
    list_display_links = ("pk", "name")
    autocomplete_fields = ("account", "created_by", "source_version_to_update", "source_version_to_compare_with")
    readonly_fields = (
        "json_diff",
        "count_create",
        "count_update",
        "created_at",
        "updated_at",
        "sync_task",
    )

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related(
                "source_version_to_update__data_source",
                "source_version_to_compare_with__data_source",
                "account",
                "created_by",
            )
        )


@admin.register(SourceVersion)
@admin_attr_decorator
class SourceVersionAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at",)
    list_display = ["id", "data_source", "number", "created_at", "updated_at"]
    list_filter = ["data_source", "created_at", "updated_at"]
    search_fields = ["data_source__name", "number", "description"]
    autocomplete_fields = ["data_source"]
    date_hierarchy = "created_at"


@admin.register(DataSource)
class DataSourceAdmin(admin.ModelAdmin):
    formfield_overrides = {
        ArrayField: {
            "form_class": ArrayFieldMultipleChoiceField,
            "widget": forms.CheckboxSelectMultiple,
        }
    }
    list_display = ["name", "description", "created_at", "updated_at"]
    list_filter = ["created_at", "updated_at", "public"]
    search_fields = ["name", "description"]
    date_hierarchy = "created_at"
