from django.contrib import admin
from django.db import models

from iaso.admin import IasoJSONEditorWidget

from .models import Modification


@admin.register(Modification)
class ModificationAdmin(admin.ModelAdmin):
    autocomplete_fields = ("user",)
    date_hierarchy = "created_at"
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    list_display = ("object_id", "source", "created_at")
    list_filter = ("content_type",)
    raw_id_fields = ("org_unit_change_request",)
    search_fields = ("id", "source")
