from django.contrib.gis import admin
from django.db import models

from iaso.admin.utils import IasoJSONEditorWidget, admin_attr_decorator
from iaso.models import FormVersion


@admin.register(FormVersion)
@admin_attr_decorator
class FormVersionAdmin(admin.GeoModelAdmin):
    search_fields = ("form__name", "form__form_id")
    ordering = ("form__name",)
    list_display = ("form_name", "form_id", "version_id", "created_at", "updated_at")

    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}

    @admin.display(
        description="Form name",
        ordering="form__name",
    )
    @admin_attr_decorator
    def form_name(self, obj):
        return obj.form.name

    @admin.display(
        description="Form ID",
        ordering="form__id",
    )
    @admin_attr_decorator
    def form_id(self, obj):
        return obj.form.form_id
