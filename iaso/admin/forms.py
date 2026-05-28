from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget, admin_attr_decorator
from iaso.models import Form, FormAttachment, FormPredefinedFilter


@admin.register(Form)
@admin_attr_decorator
class FormAdmin(admin.GeoModelAdmin):
    search_fields = ("name", "form_id")
    list_display = (
        "name",
        "form_id",
        "period_type",
        "single_per_period",
        "periods_before_allowed",
        "periods_after_allowed",
        "derived",
        "get_account_names",
        "created_at",
        "updated_at",
        "deleted_at",
    )

    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}

    list_filter = ["projects__account"]

    @admin.display(description="Accounts")
    def get_account_names(self, obj):
        accounts = set(f"{project.account.name} ({project.account.id})" for project in obj.projects.all())
        return ", ".join(sorted(accounts)) if accounts else "-"

    def get_queryset(self, request):
        return Form.objects_include_deleted.prefetch_related("projects__account")


@admin.register(FormPredefinedFilter)
class FormPredefinedFilterAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at", "updated_at")
    list_display = ("form", "name", "short_name", "json_logic")
    list_filter = ("form", "name", "short_name")


@admin.register(FormAttachment)
class FormAttachmentAdmin(admin.ModelAdmin):
    readonly_fields = ("created_at", "updated_at")
    list_display = ("form", "name", "file", "md5")
    list_filter = ("form", "name")
