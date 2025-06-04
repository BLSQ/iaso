from django.contrib.gis import admin
from django.db import models

from iaso.admin import IasoJSONEditorWidget

from .models import PublicRegistryConfig


@admin.register(PublicRegistryConfig)
class PublicRegistryConfigAdmin(admin.ModelAdmin):
    raw_id_fields = ("root_orgunit",)
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
    autocomplete_fields = ["source_version", "data_source", "account"]
    search_fields = ["id", "account__name", "data_source__name"]
    list_display = ["id", "account", "data_source", "source_version"]
    list_filter = ["account", "data_source"]
