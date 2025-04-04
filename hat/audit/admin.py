from django.contrib import admin
from django.db import models

from iaso.admin import IasoJSONEditorWidget

from .models import Modification


@admin.register(Modification)
class ModificationAdmin(admin.ModelAdmin):
    date_hierarchy = "created_at"
    list_filter = ("content_type", "source")
    list_display = ("id", "object_id", "source", "created_at")
    list_display_links = ("id", "object_id")
    autocomplete_fields = ("user",)
    search_fields = ("user",)
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
