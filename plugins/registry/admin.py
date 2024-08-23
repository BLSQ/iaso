from .models import PublicRegistryConfig
from django.db import models
from iaso.admin import IasoJSONEditorWidget
from django.contrib.gis import admin


@admin.register(PublicRegistryConfig)
class PublicRegistryConfigAdmin(admin.ModelAdmin):
    raw_id_fields = ("root_orgunit",)
    formfield_overrides = {models.JSONField: {"widget": IasoJSONEditorWidget}}
